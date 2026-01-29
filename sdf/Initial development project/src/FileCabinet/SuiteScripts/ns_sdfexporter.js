/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @filename ns_sl_sdfexporter_nojet_fixed.js
 *
 * Script Parameters (Deployment):
 *  - custscript_json_file_id              : JSON_FILE_ID (File ID of authoritative SDF object catalog)
 *  - custscript_export_base_folder_id     : EXPORT_BASE_FOLDER_ID (File Cabinet base folder)
 *
 * Catalog JSON entry example (authoritative):
 *   {
 *     "id":"customtransactiontype",
 *     "Name":"Custom Transaction Type",
 *     "isTable":true,
 *     "keyField":"internalid",
 *     "tableName":"customtransactiontype"
 *   }
 *
 * Key fixes in this version:
 *  - Rewrote the Web Worker source using function.toString() to avoid escape issues.
 *  - Fixed regex and logical OR when parsing Content-Disposition filename.
 *  - Minor cleanups and small robustness improvements.
 */

define([
    'N/runtime', 'N/file', 'N/record', 'N/search', 'N/query', 'N/log', 'N/xml', 'N/compress'
  ], function (runtime, file, record, search, query, log, xml, compress) {
  
    const PARAM_JSON_FILE_ID = 'custscript_json_file_id';
    const PARAM_EXPORT_BASE_FOLDER_ID = 'custscript_export_base_folder_id';
  
    // Authoritative script object types to copy script files for
    const SCRIPT_OBJECT_TYPES = new Set([
      'clientscript','usereventscript','mapreducescript','scheduledscript',
      'restlet','suitelet','workflowactionscript','massupdatescript',
      'portlet','bundleinstallationscript','customtool'
    ]);
  
    function onRequest(context) {
      try {
        const req = context.request;
        const res = context.response;
  
        if (req.method === 'GET' && !req.parameters.action) {
          res.setHeader({ name: 'Content-Type', value: 'text/html; charset=utf-8' });
          res.write(buildAppHtml());
          return;
        }
  
        const action = req.parameters.action;
        switch (action) {
          case 'getCatalog':
            return respondJson(res, getCatalog());
          case 'getConfig':
            return respondJson(res, getConfig());
          case 'ensureFolders':
            return respondJson(res, ensureFolders());
          case 'listInstances':
            return respondJson(res, listInstances(JSON.parse(req.body || '{}')));
          case 'saveXml':
            return respondJson(res, saveXml(JSON.parse(req.body || '{}')));
          case 'zip':
            return streamZip(res, JSON.parse(req.body || '{}'));
          case 'governance':
            return respondJson(res, { remaining: runtime.getCurrentScript().getRemainingUsage() });
          default:
            res.setHeader({ name: 'Content-Type', value: 'application/json; charset=utf-8' });
            res.write(JSON.stringify({ error: 'Unknown action' }));
        }
      } catch (e) {
        log.error('Suitelet error', e);
        context.response.setHeader({ name: 'Content-Type', value: 'application/json; charset=utf-8' });
        context.response.write(JSON.stringify({ error: (e && e.message) || String(e) }));
      }
    }
  
    /** ===== Data & Config ===== */
    function getCatalog() {
      const jsonFileId = runtime.getCurrentScript().getParameter(PARAM_JSON_FILE_ID);
      if (!jsonFileId) throw Error('Missing script parameter JSON_FILE_ID');
      const f = file.load({ id: jsonFileId });
      const txt = f.getContents();
      let data = JSON.parse(txt);
      if (!Array.isArray(data)) throw Error('Catalog JSON must be an array');
      data = data.filter(x => x && x.isTable === true);
      return { catalog: data };
    }
  
    function getConfig() {
      const baseFolderId = runtime.getCurrentScript().getParameter(PARAM_EXPORT_BASE_FOLDER_ID);
      if (!baseFolderId) throw Error('Missing script parameter EXPORT_BASE_FOLDER_ID');
      return { baseFolderId: Number(baseFolderId) };
    }
  
    /** Ensure base subfolders: /objects, /_errors, /SuiteScripts */
    function ensureFolders() {
      const baseFolderId = Number(runtime.getCurrentScript().getParameter(PARAM_EXPORT_BASE_FOLDER_ID));
      if (!baseFolderId) throw Error('Missing script parameter EXPORT_BASE_FOLDER_ID');
  
      const created = [];
      ['objects', '_errors', 'SuiteScripts'].forEach(name => {
        const id = getOrCreateFolder(name, baseFolderId);
        created.push({ name, id });
      });
      return { ok: true, created };
    }
  
    function getOrCreateFolder(name, parentId) {
      const hit = search.create({
        type: 'folder',
        filters: [['name', 'is', name], 'AND', ['parent', 'anyof', parentId]],
        columns: ['internalid']
      }).run().getRange({ start: 0, end: 1 });
      if (hit && hit.length) return Number(hit[0].getValue('internalid'));
      const rec = record.create({ type: 'folder' });
      rec.setValue({ fieldId: 'name', value: name });
      rec.setValue({ fieldId: 'parent', value: parentId });
      return Number(rec.save());
    }

    /** Quick heuristic: true if it contains <!doctype html> OR <html>...</html> */
    function isHtmlPageQuick(input) {
        if (input == null) return false;
        let s = String(input).trim();
        if (s.length < 14) return false;
        // Strip UTF‑8 BOM if present
        if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1);
        // Doctype or explicit html root
        if (/<!doctype\s+html[^>]*>/i.test(s)) return true;
        if (/<html(?:\s[^>]*)?>[\s\S]*<\/html>/i.test(s)) return true;
        return false;
        }
  
    /** ===== SuiteQL instance listing ===== */
    function listInstances(payload) {
        //log.debug('listInstances payload', payload);
      const { objectTypeId, keyField, tableName, sql } = payload || {};
      if (!objectTypeId) throw Error('objectTypeId required');
      const selectField = (keyField && String(keyField).trim()) || 'id';
      const table = (tableName && String(tableName).trim()) || objectTypeId;
      const sqlp = sql || 'SELECT ' + selectField + ' FROM ' + table;
      log.debug('listInstances', { objectTypeId, keyField: selectField, table, sql });
      const res = query.runSuiteQL({ query: sqlp });
      let rows = res.asMappedResults().map(r => {
        const k = Object.keys(r)[0];
        // standard object instances are numbered < 0 
        if(r[k] > 0) {return String(r[k])};
      });
      rows = rows.filter(x => x != null);
      if (rows.length >= 1000) {
        return { error: 'Too many instances for ' + objectTypeId + ': ' + rows.length + ' (>=1000)' };
      }
      return { instances: rows, count: rows.length };
    }
  
    /** ===== XML saving & script copy ===== */
    function saveXml(payload) {
      const { objectTypeId, fileName, xml: xmlText } = payload || {};
      if (!objectTypeId || !fileName || typeof xmlText !== 'string') {
        throw Error('objectTypeId, fileName and xml required');
      }
  
      const baseFolderId = Number(runtime.getCurrentScript().getParameter(PARAM_EXPORT_BASE_FOLDER_ID));
      if (!baseFolderId) throw Error('Missing script parameter EXPORT_BASE_FOLDER_ID');
  
      const objectsFolderId = getOrCreateFolder('objects', baseFolderId);
      const typeFolderId = getOrCreateFolder(objectTypeId, objectsFolderId);
  
      // Check if we got an HTML Page
        if (isHtmlPageQuick(xmlText)) {
            log.audit('HTML detected', 'Likely locked object: ' + objectTypeId + ' / ' + fileName);
            return { ok: false, fileId: null, error: 'Locked Object: ' + objectTypeId + ' / ' + fileName };
        }
      // Minimal well-formedness
      let ok = true, parseErr = null;
      try { xml.Parser.fromString({ text: xmlText }); } catch (e) { ok = false; parseErr = e; }
  
      let fileId;
      if (ok) {
        const fl = file.create({
          name: fileName,
          fileType: file.Type.XMLDOC,
          contents: xmlText,
          folder: typeFolderId
        });
        fileId = Number(fl.save());
      } else {
        const errFolderId = getOrCreateFolder('_errors', baseFolderId);
        const fl = file.create({
          name: fileName.replace(/\.xml$/i, '') + '_INVALID.xml',
          fileType: file.Type.PLAINTEXT,
          contents: xmlText,
          folder: errFolderId
        });
        fileId = Number(fl.save());
        return { ok: false, fileId, error: 'XML not well-formed: ' + ((parseErr && parseErr.message) || String(parseErr)) };
      }
  
      // If script object, copy referenced <scriptfile> to /SuiteScripts/ if missing
      let copyInfo = null;
      if (SCRIPT_OBJECT_TYPES.has(objectTypeId)) {
        try {
          const scriptPath = extractScriptPath(xmlText); // e.g. [/SuiteScripts/MyFile.js] or /SuiteScripts/MyFile.js
          if (scriptPath) {
            copyInfo = copyScriptIfMissing(scriptPath, baseFolderId);
          } else {
            copyInfo = { note: 'No <scriptfile> tag found' };
          }
        } catch (e) {
          copyInfo = { error: 'Script copy failed: ' + ((e && e.message) || String(e)) };
        }
      }
  
      return { ok: true, fileId, copyInfo };
    }
  
    function extractScriptPath(xmlText) {
      const m = xmlText.match(/<\s*scriptfile\s*>\s*([^<]+?)\s*<\/\s*scriptfile\s*>/i);
      if (!m) return null;
      return m[1].trim().replace(/^\[|\]$/g, '');
    }
  
    function copyScriptIfMissing(sourcePath, baseFolderId) {
      let src;
      try { src = file.load({ id: sourcePath }); }
      catch (e) { return { error: 'Source script not found: ' + sourcePath }; }
  
      const destFolderId = getOrCreateFolder('SuiteScripts', baseFolderId);
      const existing = search.create({
        type: 'file',
        filters: [['name', 'is', src.name], 'AND', ['folder', 'anyof', destFolderId]],
        columns: ['internalid']
      }).run().getRange({ start: 0, end: 1 });
  
      if (existing && existing.length) {
        return { skipped: true, reason: 'File exists', name: src.name };
      }
  
      const copy = file.create({
        name: src.name,
        fileType: src.fileType,
        contents: src.getContents(),
        folder: destFolderId,
        encoding: src.encoding
      });
      const newId = Number(copy.save());
      return { copied: true, newId, name: src.name };
    }
  
    /** ===== ZIP stream back to client ===== */
    function streamZip(response, payload) {
      const ids = (payload && payload.fileIds) || [];
      if (!ids.length) throw Error('No fileIds provided');
      const zipName = (payload && payload.zipName) || ('sdf_export_' + Date.now() + '.zip');
  
      const archive = compress.createArchive({ type: compress.Type.ZIP });
      ids.forEach(id => {
        try {
          const f = file.load({ id });
          archive.addFile({ file: f, name: f.name });
        } catch (e) {
          log.error('zip add', id + ': ' + e);
        }
      });
      const baseFolderId = Number(runtime.getCurrentScript().getParameter(PARAM_EXPORT_BASE_FOLDER_ID));
      const zipId = archive.save({ name: zipName, folder: baseFolderId });
      const zipFile = file.load({ id: zipId });
  
      response.writeFile({ file: zipFile, isInline: false });
    }
  
    /** ===== Utilities ===== */
    function respondJson(response, obj) {
      response.setHeader({ name: 'Content-Type', value: 'application/json; charset=utf-8' });
      response.write(JSON.stringify(obj || {}));
    }
  
    /** ===== UI (No JET; Redwood-like styling with plain HTML/CSS/JS) ===== */
    function buildAppHtml() {
      return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>SDF XML Exporter</title>
  
    <!-- highlight.js (XML) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>document.addEventListener('DOMContentLoaded', () => { hljs.highlightAll(); });</script>
  
    <style>
      :root{
        --bg: #f8f9fb; --panel: #fff; --border: #e0e3e7; --text: #1f2937; --muted: #6b7280;
        --brand: #3b82f6; --brand-2: #2563eb; --ok: #10b981; --warn: #f59e0b; --err: #ef4444;
        --radius: 12px; --pad: 12px; --shadow: 0 10px 20px rgba(0,0,0,0.06);
      }
      *{ box-sizing:border-box; }
      html, body { height:100%; }
      body { margin:0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
  
      .wrap { display:grid; grid-template-rows:auto 1fr; height:100vh; }
  
      header.cards { display:grid; grid-template-columns: repeat(3, 1fr); gap: var(--pad); padding: var(--pad); }
      .card { background: var(--panel); border:1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; display:flex; align-items:center; justify-content:space-between; }
      .card .title { color: var(--muted); font-size: 12px; }
      .card .value { font-size: 20px; font-weight: 700; }
  
      .main { display:grid; grid-template-columns: 320px 1fr 360px; gap: var(--pad); padding: var(--pad); height: calc(100vh - 110px); }
  
      .left { background: var(--panel); border:1px solid var(--border); border-radius: var(--radius); display:flex; flex-direction:column; overflow:hidden; }
      .left .sticky { position: sticky; top:0; background: var(--panel); z-index:2; padding: 12px; border-bottom:1px solid var(--border); }
      .left .controls { display:flex; gap:8px; flex-wrap:wrap; }
      .left .progress { display:flex; gap:8px; align-items:center; margin-top:8px; }
      .left progress { width:100%; height:10px; }
      .left input[type="text"]{ width:100%; padding:8px; border:1px solid var(--border); border-radius:8px; }
      .left .list { overflow:auto; padding: 8px 12px; }
      .type-row { display:flex; align-items:center; gap:8px; padding:6px 4px; border-bottom:1px dashed #f1f3f6; }
  
      button.btn { appearance:none; border:1px solid var(--border); background:#fff; color:#111827; padding:8px 12px; border-radius:10px; cursor:pointer; font-weight:600; box-shadow: 0 2px 0 rgba(0,0,0,0.03); }
      button.btn.primary { background: var(--brand); color:#fff; border-color: var(--brand-2); }
      button.btn.primary:hover { background: var(--brand-2); }
  
      .center { display:flex; flex-direction:column; gap: var(--pad); }
      .panel { background: var(--panel); border:1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow:hidden; }
      .toolbar { display:flex; gap:8px; align-items:center; padding:10px; border-bottom:1px solid var(--border); }
      .codebox { height: 46vh; overflow:auto; padding: 10px; background:#0b1020; color:#d1d5db; }
      .codebox pre { margin:0; }
      .kv { margin-left:auto; color: var(--muted); font-size:12px; }
  
      .section-title { margin: 4px 6px 8px 6px; color: var(--muted); font-weight:600; }
  
      details.accord { border-top:1px solid var(--border); }
      details.accord summary { cursor:pointer; padding:10px 14px; font-weight:600; }
      details.accord .acc-body { padding: 4px 16px 12px 22px; }
      details.accord ul { margin: 6px 0; padding-left: 18px; }
      details.accord li { margin: 4px 0; }
  
      .right { background: var(--panel); border:1px solid var(--border); border-radius: var(--radius); overflow:hidden; display:flex; flex-direction:column; }
      .right .hdr { padding:10px 12px; border-bottom:1px solid var(--border); font-weight:700; }
      .right .errwrap { overflow:auto; padding: 8px 12px; }
      .right table { width:100%; border-collapse: collapse; font-size:12px; }
      .right th, .right td { border-bottom:1px solid #f0f2f5; padding:6px; text-align:left; }
  
      .muted { color: var(--muted); }
      .wrap-label { margin-left: 8px; }
    </style>
  </head>
  <body>
  <div class="wrap">
    <header class="cards">
      <div class="card"><div><div class="title">Types Processed</div><div class="value" id="card-types">0 / 0</div></div></div>
      <div class="card"><div><div class="title">Objects Collected</div><div class="value" id="card-objects">0</div></div></div>
      <div class="card"><div><div class="title">Remaining Governance</div><div class="value" id="card-gov">—</div></div></div>
    </header>
  
    <main class="main">
      <aside class="left">
        <div class="sticky">
          <div class="controls">
            <button class="btn primary" id="btn-run">Export Selected</button>
            <button class="btn" id="btn-zip">Download ZIP</button>
          </div>
          <div class="progress">
            <progress id="overall" value="0" max="100"></progress>
            <div id="overall-label" class="muted" style="min-width:160px"></div>
          </div>
          <div style="margin-top:8px"><input id="filter" type="text" placeholder="Filter object types…"></div>
          <div class="controls" style="margin-top:6px">
            <button class="btn" id="btn-select-all">Select All</button>
            <button class="btn" id="btn-select-none">None</button>
          </div>
        </div>
        <div class="list" id="types"></div>
      </aside>
  
      <section class="center">
        <div class="panel">
          <div class="toolbar">
            <button class="btn" id="btn-copy">Copy</button>
            <button class="btn" id="btn-download">Download</button>
            <label class="wrap-label"><input type="checkbox" id="wrap"> Word wrap</label>
            <span id="current-label" class="kv"></span>
          </div>
          <div class="codebox" id="code-container">
            <pre><code id="code" class="language-xml"><!-- XML preview will appear here --></code></pre>
          </div>
        </div>
  
        <div class="panel">
          <div class="section-title">Processed Files</div>
          <div id="acc-files"></div>
        </div>
      </section>
  
      <aside class="right">
        <div class="hdr">Errors</div>
        <div class="errwrap">
          <table id="err-table">
            <thead><tr><th>Time</th><th>Type</th><th>Instance</th><th>Message</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </aside>
    </main>
  </div>
  
  <script>
    const ORIGIN = (function(){
    try { return window.location.origin || (window.location.protocol + '//' + window.location.host); }
    catch(_) { return ''; }
    })();
  (function(){
    var STORAGE_KEY = 'sdf_export_run';
    var catalog = [], baseFolderId = null;
    var selectedTypeIds = new Set();
    var fileIdBag = [];
    var totalTypes = 0, processedTypes = 0, totalObjects = 0;
    var filesByType = new Map();
    var fileTextCache = new Map();
  
    var elTypes = document.getElementById('types');
    var elFilter = document.getElementById('filter');
    var elBtnAll = document.getElementById('btn-select-all');
    var elBtnNone = document.getElementById('btn-select-none');
    var elBtnRun = document.getElementById('btn-run');
    var elBtnZip = document.getElementById('btn-zip');
    var elProg = document.getElementById('overall');
    var elProgLbl = document.getElementById('overall-label');
    var elCardTypes = document.getElementById('card-types');
    var elCardObjects = document.getElementById('card-objects');
    var elCardGov = document.getElementById('card-gov');
    var elCode = document.getElementById('code');
    var elCodeWrap = document.getElementById('wrap');
    var elBtnCopy = document.getElementById('btn-copy');
    var elBtnDownload = document.getElementById('btn-download');
    var elErrTbody = document.querySelector('#err-table tbody');
    var elCurrentLabel = document.getElementById('current-label');
    var elAcc = document.getElementById('acc-files');
  
    elCodeWrap.addEventListener('change', function(){
      document.getElementById('code-container').style.whiteSpace = elCodeWrap.checked ? 'pre-wrap' : 'pre';
    });
    elBtnCopy.addEventListener('click', function(){
      navigator.clipboard.writeText(elCode.textContent || '').catch(function(){});
    });
    elBtnDownload.addEventListener('click', function(){
      var blob = new Blob([elCode.textContent || ''], {type:'application/xml'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
        const label = elCurrentLabel.textContent || 'export.xml';
        const bs = String.fromCharCode(92);
        const fileName = label.split('/').pop().split(bs).pop();
        a.download = fileName || 'export.xml';
      a.click();
    });
  
    function renderTypes(filter){
      var f = (filter||'').toLowerCase();
      elTypes.innerHTML = '';
      catalog
        .filter(function(o){ return o.id.toLowerCase().indexOf(f) > -1 || String(o.Name||'').toLowerCase().indexOf(f) > -1; })
        .forEach(function(o){
          var row = document.createElement('div');
          row.className = 'type-row';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = selectedTypeIds.has(o.id);
          cb.addEventListener('change', function(){ if (cb.checked) selectedTypeIds.add(o.id); else selectedTypeIds.delete(o.id); persist(); });
          var lab = document.createElement('span'); lab.textContent = o.Name + ' (' + o.id + ')';
          row.appendChild(cb); row.appendChild(lab); elTypes.appendChild(row);
        });
    }
    elFilter.addEventListener('input', function(){ renderTypes(elFilter.value); });
    elBtnAll.addEventListener('click', function(){ catalog.forEach(function(o){ selectedTypeIds.add(o.id); }); persist(); renderTypes(elFilter.value); });
    elBtnNone.addEventListener('click', function(){ selectedTypeIds.clear(); persist(); renderTypes(elFilter.value); });
  
    setInterval(function(){
      fetch(window.location.href + '&action=governance')
        .then(function(r){ return r.json(); })
        .then(function(j){ elCardGov.textContent = j.remaining; })
        .catch(function(){});
    }, 10000);
  
    (function init(){
      ensureFolders()
        .then(function(){ return fetch(window.location.href + '&action=getConfig'); })
        .then(function(r){ return r.json(); })
        .then(function(cfg){ baseFolderId = cfg.baseFolderId; return fetch(window.location.href + '&action=getCatalog'); })
        .then(function(r){ return r.json(); })
        .then(function(cat){ catalog = cat.catalog || []; totalTypes = catalog.length; elCardTypes.textContent = '0 / ' + totalTypes; hydrate(); renderTypes(); })
        .then(function(){ elBtnRun.addEventListener('click', runExport); elBtnZip.addEventListener('click', downloadZip); })
        .then(function(){ setInterval(function(){ elCardObjects.textContent = totalObjects; elCardTypes.textContent = processedTypes + ' / ' + totalTypes; }, 1000); });
    })();
  
    function persist(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ selected: Array.from(selectedTypeIds), fileIdBag: fileIdBag, totalObjects: totalObjects, processedTypes: processedTypes })); } catch(e){} }
    function hydrate(){ try { var j = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (Array.isArray(j.selected)) selectedTypeIds = new Set(j.selected); fileIdBag = Array.isArray(j.fileIdBag) ? j.fileIdBag : []; totalObjects = Number(j.totalObjects||0); processedTypes = Number(j.processedTypes||0); } catch(e){} }
  
    function ensureFolders(){ return fetch(window.location.href + '&action=ensureFolders'); }
  
    function updateProgress(frac, label){ var pct = Math.max(0, Math.min(100, Math.round(frac*100))); elProg.value = pct; elProgLbl.textContent = label || ''; }
  
    function logError(objType, instanceId, message){ var tr = document.createElement('tr'); var now = new Date().toLocaleTimeString(); tr.innerHTML = '<td>'+now+'</td><td>'+objType+'</td><td>'+instanceId+'</td><td>'+escapeHtml(String(message))+'</td>'; elErrTbody.appendChild(tr); }
    function escapeHtml(s) {
  if (s == null) return '';
  const ESC = {
    38: '&amp;',  // &
    60: '&lt;',   // <
    62: '&gt;',   // >
    34: '&quot;', // "
    39: '&#39;'   // '
  };
  return String(s).replace(/[&<>\"']/g, c => ESC[c.charCodeAt(0)]);
}
  
    function runExport(){
      fileIdBag = []; totalObjects = 0; processedTypes = 0; filesByType.clear(); fileTextCache.clear(); elAcc.innerHTML = ''; persist();
      var selected = catalog.filter(function(o){ return selectedTypeIds.has(o.id); });
      if (!selected.length) { alert('Select at least one object type.'); return; }
      var overallSteps = selected.length, step = 0;
      (function next(){
        console.log('Next step', step, 'of', overallSteps);
        if (step >= overallSteps){ updateProgress(1, 'Done'); return; }
        var obj = selected[step++]; updateProgress(step/overallSteps, 'Loading 0 of ? from ' + obj.Name);
        fetch(window.location.href + '&action=listInstances', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ objectTypeId: obj.id, keyField: obj.keyField || 'id', tableName: obj.tableName || obj.id, sql: obj.sql || null })
        }).then(function(r){ return r.json(); }).then(function(j){
          if (j.error){ logError(obj.id, '-', j.error); processedTypes++; persist(); next(); return; }
          var ids = j.instances || []; totalObjects += ids.length;
          fetchXmlsForType(obj, ids, 3).then(function(){ processedTypes++; persist(); next(); });
        }).catch(function(e){ logError(obj.id, '-', (e && e.message) || String(e)); processedTypes++; persist(); next(); });
      })();
    }
  
    function fetchXmlsForType(obj, ids, concurrency){
      if (!ids.length) return Promise.resolve();
      ensureAccordionSection(obj.id, obj.Name);
      var pending = ids.slice(); var active = 0, done = 0;
  
      // Build worker source WITHOUT escape hell
var workerSrc = '(' + function() {
const TIMEOUT_MS = 45000; // abort if no response within 45s
const MAX_RETRY = 3; // retry up to 3 attempts on transient failures


function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }


async function fetchWithTimeout(url, opts, timeoutMs) {
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), timeoutMs);
try {
const resp = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
return resp;
} finally { clearTimeout(timer); }
}


self.onmessage = async function(e){
const d = e.data;
let backoff = 1000; // 1s -> 2s -> 4s (cap elsewhere if you like)
for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
try {
const resp = await fetchWithTimeout(d.url, { credentials: 'same-origin' }, TIMEOUT_MS);
const status = resp.status;
const text = await resp.text();
// Backoff-worthy statuses
if (status === 408 || status === 429 || status === 503) {
throw { transient: true, status, message: 'HTTP ' + status };
}
const cd = resp.headers.get('Content-Disposition') || '';
// RFC5987 filename* support
let fn = null; const mm = cd.match(/filename\*=UTF-8''([^;]+)/i);
if (mm && mm[1]) { try { fn = decodeURIComponent(mm[1]); } catch(_){} }
if (!fn) {
const m2 = cd.match(/filename="?([^";]+)"?/i) || [];
fn = m2[1] || null;
}
const fileName = fn || (d.objectTypeId + '_' + d.instanceId + '.xml');
self.postMessage({ ok:true, instanceId:d.instanceId, objectTypeId:d.objectTypeId, fileName, status, text });
return; // success
} catch (err) {
const isAbort = err && err.name === 'AbortError';
const isTransient = isAbort || (err && err.transient === true);
if (attempt < MAX_RETRY && isTransient) {
await sleep(backoff); backoff = Math.min(backoff * 2, 8000); // cap at 8s
continue; // retry
}
// Final failure -> return an error so the main thread can advance progress
self.postMessage({ ok:false, instanceId:d.instanceId, objectTypeId:d.objectTypeId,
error: (err && err.message) ? err.message : String(err),
status: err && err.status });
return;
}
}
};
}.toString() + ')();';
  
      var blob = new Blob([workerSrc], {type:'application/javascript'});
      var workerUrl = URL.createObjectURL(blob);
  
      return new Promise(function(resolve){
        function spin(){
          while (active < concurrency && pending.length){
            var instanceId = pending.shift(); active++;
            updateProgress(done / ids.length, 'Loading ' + done + ' of ' + ids.length + ' from ' + obj.Name);
            var rel = '/app/suiteapp/devframework/xml/xmlexport.nl'
            + '?recordtype=' + encodeURIComponent(obj.id)
            + '&id=' + encodeURIComponent(instanceId);
            var url = (ORIGIN ? new URL(rel, ORIGIN).href : rel);
            var w = new Worker(workerUrl);
            w.onmessage = function(ev){
              var data = ev.data;
              if (data.ok){
                fetch(window.location.href + '&action=saveXml', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ objectTypeId: obj.id, fileName: data.fileName, xml: data.text })
                }).then(function(r){ return r.json(); }).then(function(sj){
                  if (sj && sj.ok){
                    fileIdBag.push(sj.fileId); fileTextCache.set(sj.fileId, data.text);
                    addProcessedFile(obj.id, obj.Name, data.fileName, sj.fileId, data.text);
                    if (done === 0) showXml(data.text, data.fileName);
                  } else { logError(obj.id, data.instanceId, (sj && sj.error) || 'Save failed'); }
                }).catch(function(e2){ logError(obj.id, data.instanceId, (e2 && e2.message) || String(e2)); });
              } else {
                logError(obj.id, data.instanceId, data.error || ('HTTP ' + data.status));
              }
              done++; active--; updateProgress(done / ids.length, 'Loading ' + done + ' of ' + ids.length + ' from ' + obj.Name);
              spin(); w.terminate();
            };
            w.postMessage({ url: url, objectTypeId: obj.id, instanceId: instanceId });
          }
        }
        spin();
        (function wait(){ if (done < ids.length){ setTimeout(wait, 200); } else { URL.revokeObjectURL(workerUrl); resolve(); } })();
      });
    }
  
    function showXml(text, label){ elCurrentLabel.textContent = label || ''; elCode.textContent = text || ''; hljs.highlightElement(elCode); }
  
    function ensureAccordionSection(typeId, typeName){
      if (document.getElementById('sec-'+typeId)) return;
      var det = document.createElement('details'); det.className = 'accord'; det.id = 'sec-'+typeId; det.open = false;
      var sum = document.createElement('summary'); sum.textContent = typeName + ' (' + typeId + ')';
      var body = document.createElement('div'); body.className = 'acc-body';
      var ul = document.createElement('ul'); ul.id = 'ul-'+typeId;
      body.appendChild(ul); det.appendChild(sum); det.appendChild(body);
      elAcc.appendChild(det);
      filesByType.set(typeId, []);
    }
    function addProcessedFile(typeId, typeName, fileName, fileId, text){
      ensureAccordionSection(typeId, typeName);
      filesByType.get(typeId).push({ name: fileName, fileId: fileId });
      var ul = document.getElementById('ul-' + typeId);
      var li = document.createElement('li');
      var a = document.createElement('a'); a.href = '#'; a.textContent = fileName;
      a.addEventListener('click', function(ev){ ev.preventDefault(); var t = fileTextCache.get(fileId) || ''; showXml(t, fileName); });
      li.appendChild(a); ul.appendChild(li);
    }
  
    function downloadZip(){
      if (!fileIdBag.length){ alert('No files from this run yet.'); return; }
      fetch(window.location.href + '&action=zip', { method:'POST', body: JSON.stringify({ fileIds: fileIdBag, zipName: 'sdf_export_' + Date.now() + '.zip' }) })
        .then(function(res){ return res.blob(); })
        .then(function(blob){ var a=document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sdf_export.zip'; a.click(); })
        .catch(function(){ alert('ZIP failed'); });
    }
  })();
  </script>
  
  </body>
  </html>`;
    }
  
    return { onRequest };
  });
  