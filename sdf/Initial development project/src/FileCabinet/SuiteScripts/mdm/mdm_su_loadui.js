/**
* Copyright (c) 1998-2025 Oracle NetSuite, Inc.
*  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
*  All Rights Reserved.
*
*  This software is the confidential and proprietary information of
*  NetSuite, Inc. ('Confidential Information'). You shall not
*  disclose such Confidential Information and shall use it only in
*  accordance with the terms of the license agreement you entered into
*  with Oracle NetSuite.
*
*  Version          Date                Author               Remarks
*  1.04            2025-09-09          riccardi             Group by Data Category with collapse/expand; plural/singular file match; async summaries
*  1.05            2025-10-21          riccardi             expanded category data; CSV template links
*
*/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define([
    'N/runtime',
    'N/file',
    'N/url',
    './lib/mdm_lib_csv',
    './lib/mdm_lib_suiteql'
  ], (runtime, file, url, csvlib, suiteql) => {
      log.debug('Runtime Script Governance', `Remaining = ${runtime.getCurrentScript().getRemainingUsage()}`);
    const LOG_PREFIX = 'SL_CSV_DZ_MDM';
   const folderId = runtime.getCurrentScript().getParameter({ name: 'custscript_csv_dz_folder' });



    // CSV splitting defaults for saves
    const SPLIT_SIZE_BYTES = 9.95 * 1024 * 1024; // ~10 MB
    const SPLIT_ROWS = 24999;
  
    /**
     * Normalize a record type to a base filename (no extension).
     * @param {string} recType
     * @returns {string}
     */
    function toBaseName(recType) {
      return String(recType).trim().toLowerCase().replace(/\s+/g, '_');
    }
  
    /**
     * Parse a single CSV row into fields, respecting quotes.
     * @param {string} rowStr
     * @param {string} delimiter
     * @returns {string[]}
     */
    function parseCsvRow(rowStr, delimiter) {
      const out = [];
      let cur = '', inQ = false;
      for (let i = 0; i < rowStr.length; i++) {
        const ch = rowStr[i], nxt = i + 1 < rowStr.length ? rowStr[i + 1] : '';
        if (ch === '"') {
          if (inQ && nxt === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (!inQ && ch === delimiter) {
          out.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out;
    }
  
    /**
     * Count rows (excluding header) and header column count for a CSV content string.
     * Uses newline counting and simple header parse; delimiter auto-detected if possible.
     * @param {string} contents
     * @returns {{rows:number, headerCols:number}}
     */
    function summarizeCsv(contents) {
      if (!contents) return { rows: 0, headerCols: 0 };
      const delim = csvlib.inferDelimiter(contents, { sampleLines: 25 }) || ',';
      const norm = contents.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = norm.endsWith('\n') ? norm.slice(0, -1).split('\n') : norm.split('\n');
      if (!lines.length) return { rows: 0, headerCols: 0 };
      const header = lines[0] || '';
      const headerCols = parseCsvRow(header, delim).length;
      const dataRows = Math.max(0, lines.length - 1);
      return { rows: dataRows, headerCols };
    }
  
    /**
     * Build async status for a single record type: fileCount, totalBytes, headerCols, totalRows.
     * Reads the header of the first file and counts rows across all files.
     * Supports plural/singular compatibility (e.g., price_level vs price_levels).
     * @param {number|string} folderId
     * @param {string} recordType
     * @returns {{fileCount:number,totalBytes:number,headerCols:number,totalRows:number, latest?:{id:number,name:string}, files?:Array}}
     */
    function getStatusForRecord(folderId, recordType) {
      const baseRaw = toBaseName(recordType).replace(/_+$/g, '');
      const hasTrailingS = /s$/.test(baseRaw);
      // generate LIKE patterns to match both singular/plural bases to avoid breaking prior saves
      const baseSing = hasTrailingS ? baseRaw.replace(/s$/, '') : baseRaw;
      const basePlural = hasTrailingS ? baseRaw : baseRaw + 's';
      const like1 = `${baseSing}_%.csv`;
      const like2 = `${basePlural}_%.csv`;
  
      const sql = `
        SELECT f.name, f.filesize, f.id, f.url, f.filetype
        FROM file f
        WHERE f.folder = ?
          AND f.filetype = 'CSV'
          AND (f.name LIKE ? OR f.name LIKE ?)
        ORDER BY f.name ASC
      `;
      const params = [String(folderId), like1, like2];
      const files = suiteql.runSuiteQLAsMapped(sql, params) || [];
  
      const fileCount = files.length;
      let totalBytes = 0;
      let headerCols = 0;
      let totalRows = 0;
      let latest = null;
      const detail = [];
  
      for (let i = 0; i < files.length; i++) {
        const r = files[i];
        const id = Number(r.id);
        const name = r.name;
        const size = Number(r.filesize) || 0;
        totalBytes += size;
  
        const f = file.load({ id });
        const text = f.getContents() || '';
        const sum = summarizeCsv(text);
        totalRows += sum.rows;
        if (i === 0) headerCols = sum.headerCols;
  
        detail.push({ id, name, bytes: size, rows: sum.rows });
        latest = { id, name };
      }
  
      return { fileCount, totalBytes, headerCols, totalRows, latest, files: detail };
    }
  
    /**
     * Handle POST actions from the client.
     * Actions:
     *  - save:   { recordType, csvText, includeHeader?:boolean }
     *  - status: { recordType }
     */
    function handlePost(context) {
      let payload = {};
      try {
        payload = JSON.parse(context.request.body || '{}');
      } catch (e) {
        context.response.write(JSON.stringify({ ok: false, error: 'Invalid JSON payload' }));
        return;
      }
  
      const action = payload.action;
      const folderId = context.request.parameters.folderId  || getFolderIdFromRecordType(payload.recordType) || runtime.getCurrentScript().getParameter({ name: 'custscript_csv_dz_folder' });
      if (!folderId) {
        context.response.write(JSON.stringify({ ok: false, error: 'Suitelet missing parameter: custscript_csv_dz_folder' }));
        return;
      }
  
      if (action === 'status') {
        const rt = (payload.recordType || '').trim();
        if (!rt) {
          context.response.write(JSON.stringify({ ok: false, error: 'Missing recordType' }));
          return;
        }
        try {
          const status = getStatusForRecord(folderId, rt);
          context.response.write(JSON.stringify({ ok: true, recordType: rt, ...status }));
        } catch (e) {
          log.error({ title: `${LOG_PREFIX} status error`, details: e });
          context.response.write(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
        return;
      }
  
      if (action === 'save') {
        const rt = (payload.recordType || '').trim();
        const csvText = payload.csvText || '';
        const includeHeader = payload.includeHeader === true; // default false
  
        if (!rt || !csvText) {
          context.response.write(JSON.stringify({ ok: false, error: 'Missing recordType or csvText' }));
          return;
        }
  
        try {
          const base = toBaseName(rt);
          const chunks = csvlib.splitCSV(csvText, {
            mode: 'size',
            maxBytes: SPLIT_SIZE_BYTES,
            rowsPerFile: SPLIT_ROWS,
            includeHeader,
            delimiter: ','
          });
  
          log.debug({ title: `${LOG_PREFIX} saving`, details: `recordType=${rt}, base=${base}, chunks=${chunks.length}` });
  
          const ids = csvlib.saveCSVs(chunks, {
            folderId,
            fileNameMask: base,
            encoding: 'UTF_8',
            isOnline: false
          });
  
          const quick = summarizeCsv(csvText);
          context.response.write(JSON.stringify({ ok: true, fileIds: ids, fileId: ids && ids[0], rowCount: quick.rows }));
        } catch (e) {
          log.error({ title: `${LOG_PREFIX} save error`, details: e });
          context.response.write(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
        }
        return;
      }
  
      context.response.write(JSON.stringify({ ok: false, error: `Unsupported action: ${action}` }));
    }
  
    /**
     * Safely serialize JSON for inline embedding (avoid </script> breaks & XSS).
     * @param {Object} obj
     * @returns {string}
     */
    function jsonForInline(obj) {
      return JSON.stringify(obj || {})
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
    }
  
    /**
     * Render Redwood-themed HTML with Oracle JET + PapaParse front-end.
     * - Cards grouped by Data Category with collapse/expand
     * - Async fetch per-card (fileCount, total size, header count, rows)
     * - Indeterminate spinner on Save; barn-red error border; subtle green backdrop on saved
     */
    function renderGet(context) {
      
          let data = {};
        try{
        data = getCategories();
        }catch(e){
          log.error({title: `${LOG_PREFIX} getCategories error`, details: e});
          data = { categories: [], fullData: [] };
        }
        const DATA_CATEGORIES = data.categories || [];

    // Full data for all categories
    const FULL_DATA = data.fullData || [];
      const slUrl = url.resolveScript({
        scriptId: runtime.getCurrentScript().id,
        deploymentId: runtime.getCurrentScript().deploymentId,
        returnExternalUrl: false
      });
  
      const safeJSON = jsonForInline({});
  
      const redwoodCss = `
        :root{
          --rdw-bg:#f9f9fb; --rdw-card:#ffffff; --rdw-border:#e6e6ea; --rdw-text:#1b1f24;
          --rdw-muted:#6b7280; --rdw-primary:#5390a5; --rdw-success:#426d4d;
          --rdw-danger:#8f1d1d; --rdw-accent:#434d69; --rdw-shadow:0 8px 20px rgba(0,0,0,.06);
        }
        *{box-sizing:border-box}
        body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:var(--rdw-bg);color:var(--rdw-text)}
        .app{max-width:1200px;margin:32px auto;padding:0 20px}
        .title{font-weight:700;font-size:28px;margin-bottom:8px;color:var(--rdw-accent)}
        .subtitle{color:var(--rdw-muted);margin-bottom:24px}
        .footer{margin-top:20px;color:var(--rdw-muted);font-size:12px}
  
        /* Category containers */
        .cats{display:flex;flex-direction:column;gap:16px}
        .cat{background:var(--rdw-card);border:1px solid var(--rdw-border);border-radius:16px;box-shadow:var(--rdw-shadow);overflow:hidden}
        .cat-header{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fafbfc;border-bottom:1px solid var(--rdw-border);cursor:pointer;user-select:none}
        .cat-title{font-weight:700;color:#111827}
        .cat-summary{margin-left:auto;color:var(--rdw-muted);font-size:12px}
        .cat-toggle{width:22px;height:22px;border:1px solid var(--rdw-border);border-radius:999px;display:flex;align-items:center;justify-content:center;background:#fff;font-weight:700}
        .cat-content{padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;transition:max-height .25s ease}
        .cat.collapsed .cat-content{display:none}
  
        /* Cards */
        .card{background:var(--rdw-card);border:1px solid var(--rdw-border);border-radius:16px;box-shadow:var(--rdw-shadow);padding:16px;display:flex;flex-direction:column;min-height:260px;position:relative;transition:border-color .18s ease, box-shadow .18s ease, transform .18s ease, background .18s ease}
        .card h3{margin:0 0 8px 0;font-size:16px}
        .dz{flex:1;border:2px dashed var(--rdw-border);border-radius:14px;display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;color:var(--rdw-muted);transition:border-color .2s, background .2s}
        .dz.hover{border-color:var(--rdw-primary);background:rgba(83,144,165,.06)}
        .meta{margin-top:12px;font-size:13px;color:var(--rdw-muted)}
        .stats{margin-top:6px;font-size:12px;color:#374151;display:flex;flex-wrap:wrap;gap:8px}
        .stat{background:#f3f4f6;border:1px solid var(--rdw-border);border-radius:999px;padding:3px 8px}
        .rowcount{font-weight:600;color:var(--rdw-success)}
        .actions{display:flex;gap:8px;margin-top:12px}
        button{border:1px solid var(--rdw-border);background:#fff;border-radius:12px;padding:8px 12px;font-weight:600;cursor:pointer}
        .btn-save{background:var(--rdw-primary);color:#fff;border-color:var(--rdw-primary)}
        .btn-cancel{background:#fff;color:var(--rdw-accent)}
  
        /* Loader overlay + states (saving) */
        .saving-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(255,255,255,.6);backdrop-filter:blur(2px);border-radius:16px;z-index:5}
        .card.is-saving .saving-overlay{display:flex}
        .card.is-saving{border-color:var(--rdw-primary);box-shadow:0 0 0 1px var(--rdw-primary) inset}
        .card.is-saving .btn, .card.is-saving input, .card.is-saving .dz{pointer-events:none;opacity:.6}
  
        /* Error border (barn red) + subtle shake */
        .card.is-error{border-color:var(--rdw-danger) !important;box-shadow:0 0 0 1px var(--rdw-danger) inset;animation:card-shake .18s ease-in-out}
        .card.is-error h3{color:var(--rdw-danger)}
        @keyframes card-shake{0%{transform:translateX(0)}25%{transform:translateX(-2px)}50%{transform:translateX(2px)}100%{transform:translateX(0)}}
  
        /* Saved (subtle green backdrop) */
        .card.is-saved{
          background: linear-gradient(0deg, rgba(66,109,77,0.06), rgba(66,109,77,0.06)), var(--rdw-card);
          border-color: rgba(66,109,77,0.35);
        }
        .card.is-saved .dz{
          border-color: rgba(66,109,77,0.25);
          background: rgba(66,109,77,0.03);
        }
        .card.flash-saved{ animation: saved-pulse 500ms ease-out; }
        @keyframes saved-pulse{ 0%{ box-shadow:0 0 0 0 rgba(66,109,77,0.30);} 100%{ box-shadow:0 0 0 12px rgba(66,109,77,0);} }
        .csv-template-link{margin-left:8px;text-decoration:none;font-size:16px;float:right;}
        .info-icon {
            cursor: pointer;
            background: none;
            border: none;
            font-size: 16px;
            margin-left: 8px;
            color: var(--redwood-teal-140, #375E62);
            transition: transform 0.2s;
            padding: 0px 0px;
            float: right;
            display: inline-block;
        }
        .info-icon:hover {
          transform: scale(1.1);
        }

.modal.hidden {
  display: none;
}
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 800px;
  width: 90%;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  font-family: 'Redwood', sans-serif;
  overflow-y: scroll;
  max-height: 90%;
}
.modal-content h2 {
  color: #375E62;
  margin-top: 0;
}
.close {
  float: right;
  font-size: 1.4em;
  cursor: pointer;
  color: #888;
}
.close:hover {
  color: #000;
}

      `;
  
      const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>CSV Drop-Zone Loader</title>
    <!-- Oracle JET (CDN) -->
    <link rel="stylesheet" href="https://static.oracle.com/cdn/jet/v14.1.0/default/css/redwood/oj-redwood-min.css"/>
    <script src="https://static.oracle.com/cdn/jet/v14.1.0/default/js/ojbundle.min.js"></script>
    <!-- PapaParse for client-side CSV parsing -->
    <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
    <style>${redwoodCss}</style>
  </head>
  <body>
    <div class="app">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div class="title">CSV Loader</div>
        <span class="pill">Fast</span>
        <span class="pill">Easy</span>
        <span class="badge" id="badge-ready">Ready</span>
      </div>
      <div class="subtitle">Drop CSVs for each record type, grouped by <strong>Data Category</strong>. We’ll count rows, Save to File Cabinet, and fetch load stats asynchronously.</div>
  
      <div class="cats" id="cats"></div>
  
      <div class="footer">
        Default Folder ID: ${folderId ? String(folderId) : '<em>not configured (set custscript_csv_dz_folder)</em>'}
      </div>
    </div>
  
    <!-- Safely embedded initial state (no N/encode). -->
    <script id="init-json" type="application/json">${safeJSON}</script>
  
    <script>
        function openModal(id) {
            //document.getElementById(id).classList.remove('hidden');
            id.classList.remove('hidden');
          }

          function closeModal(id) {
           // document.getElementById(id).classList.add('hidden');
           id.classList.add('hidden');
          }

          // Optional: close modal when clicking outside content
          window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(m => {
              if (event.target === m) {
                m.classList.add('hidden');
              }
            });
          };
      (function(){
        const SL_URL = ${JSON.stringify(slUrl)};
        const DATA_CATEGORIES = ${JSON.stringify(DATA_CATEGORIES)};
        const FULL_DATA = ${JSON.stringify(FULL_DATA)};
        const initialState = JSON.parse(document.getElementById('init-json').textContent || '{}');
  
        const catsRoot = document.getElementById('cats');
        const state = {}; // per-recordType transient state + status
  
        function el(tag, attrs = {}, children = []) {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'class') e.className = v;
            else if (k === 'text') e.textContent = v;
            else if (k === 'html') e.innerHTML = v;
            else e.setAttribute(k, v);
        });

        const toAppend = Array.isArray(children) ? children : [children];
        toAppend.forEach((c) => {
            if (c == null) return;
            if (typeof c === 'string' || typeof c === 'number') {
            e.appendChild(document.createTextNode(String(c)));
            } else if (Array.isArray(c)) {
            c.forEach((cc) => {
                if (cc == null) return;
                if (typeof cc === 'string' || typeof cc === 'number') {
                e.appendChild(document.createTextNode(String(cc)));
                } else {
                e.appendChild(cc);
                }
            });
            } else {
            e.appendChild(c);
            }
        });

        return e;
        }
  
        function bytesToHuman(n){
          if (!n || n < 0) return '0 B';
          const u = ['B','KB','MB','GB','TB'];
          let i = 0, x = n;
          while (x >= 1024 && i < u.length-1) { x /= 1024; i++; }
          return (i<=1?Math.round(x):x.toFixed(2)) + ' ' + u[i];
        }
  
        function setSaving(cardEl, saving) {
          if (!cardEl) return;
          cardEl.classList.toggle('is-saving', !!saving);
          cardEl.setAttribute('aria-busy', saving ? 'true' : 'false');
        }
        function setError(cardEl, on, message) {
          if (!cardEl) return;
          cardEl.classList.toggle('is-error', !!on);
          const meta = cardEl.querySelector('.meta');
          if (on && meta) {
            meta.textContent = message || 'Error';
          }
        }
  
        async function fetchStatus(recType){
          const res = await fetch(SL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', recordType: recType })
          });
          return await res.json();
        }
  
        function renderCard(recType) {
          const rt = String(recType || '').trim();
          const st = state[rt] || (state[rt] = {});
          const cardInfo = getCsvTemplateInfo(FULL_DATA, rt);
          console.log('GetCSVInfo for record type:' + rt, cardInfo);
          let csvTemplateUrl = cardInfo.csvTemplateUrl;
          let description = cardInfo.description;
          let div_id = 'modal_' + cardInfo.id;
          let descElp = el('p', { class: 'modal-body', html: description || '' });
          let descName = el('h2', { text: rt });
          let closeSpan = el('span', { class: 'close', onclick: 'closeModal('+ div_id +')', html: '&#10005;' });
          let modalContent = el('div', { class: 'modal-content' }, [closeSpan, descName, descElp]);
          let modalDiv = el('div', { class: 'modal hidden', id: div_id }, [modalContent]);
          let modalInfoButton = '';
          if(description ){modalInfoButton = el('button', { class: 'info-icon', title: 'Record Information', text: 'ℹ️', onclick: 'openModal('+ div_id +')' });}
          let template = '';
          if(csvTemplateUrl){
             template = el('a', { class: 'csv-template-link', title: 'Download CSV Template', href: csvTemplateUrl, target: '_blank', rel: 'noopener noreferrer', text: '📄' });
            }
          const csvFolder = cardInfo.csvFolderId;
          let csvFolderIcon = el('span', { class: 'csv-template-link', title: csvFolder, href: '#', target: '_blank', rel: 'noopener noreferrer', text: '📁' });

          const title = el('h3', { text: rt },[modalInfoButton,template,csvFolderIcon]);


          const dz = el('div', { class: 'dz', id: 'dz_'+rt, 'data-rectype': rt, 'data-csvfolder': csvFolder }, [
            el('div', { class: 'dz-inner' , }, [
              el('div', { text: 'Drop CSV here or click to select' }),
              el('div', { class: 'meta', text: 'CSV only. Header row optional.' })
            ])
          ]);
          const fileInput = el('input', { type: 'file', accept: '.csv,text/csv', style: 'display:none' });
          dz.addEventListener('click', ()=> fileInput.click());
  
          const meta = el('div', { class: 'meta', id: 'meta_'+rt, 'aria-live':'polite' });
          const stats = el('div', { class: 'stats', id: 'stats_'+rt });
  
          const actions = el('div', { class: 'actions' });
          const btnSave = el('button', { class: 'btn btn-save', text: 'Save', disabled: 'disabled' });
          const btnCancel = el('button', { class: 'btn btn-cancel', text: 'Cancel', disabled: 'disabled' });
          actions.appendChild(btnSave);
          actions.appendChild(btnCancel);
  
          const overlay = el('div', { class: 'saving-overlay', 'aria-hidden':'true' }, [
            (function(){ const o = document.createElement('oj-progress-circle'); o.setAttribute('size','sm'); o.setAttribute('value','-1'); o.setAttribute('aria-label','Saving'); return o; })()
          ]);
  
          const card = el('div', { class: 'card csv-card', 'data-type': rt }, [title, dz, meta, stats, actions, overlay, modalDiv]);
  
          function setHover(on){ dz.classList.toggle('hover', !!on); }
          ['dragenter','dragover'].forEach(evt => dz.addEventListener(evt, (e)=>{ e.preventDefault(); setHover(true); }));
          ['dragleave','drop'].forEach(evt => dz.addEventListener(evt, (e)=>{ e.preventDefault(); setHover(false); }));
          dz.addEventListener('drop', (e)=>{
            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (f) handleFile(f);
          });
          fileInput.addEventListener('change', (e)=>{
            const f = e.target.files && e.target.files[0];
            if (f) handleFile(f);
          });

          /**
           * Get CSV template info (URL + folder ID) for a given record name
           * @param {Array<Object>} rows - SuiteQL mapped results; each row should include:
           *   - record_name (string)
           *   - csv_template (number|string) NetSuite File internal ID
           *   - csv_folder (number|string)   NetSuite Folder internal ID
           * @param {string} recordName - Target record name to match (case-insensitive trim)
           * @returns {{ csvTemplateUrl: string|null, csvTemplateId: number|null, csvFolderId: number|null }}
           */
          function getCsvTemplateInfo(rows, recordName) {
            if (!Array.isArray(rows) || !recordName) {
              return { csvTemplateUrl: null, csvTemplateId: null, csvFolderId: null };
            }

            // normalize for robust matching
            const target = String(recordName).trim().toLowerCase();

            // find first matching row by record_name
            const row = rows.find(r => String(r.record_name || '').trim().toLowerCase() === target);
            if (!row) {
              return { csvTemplateUrl: null, csvTemplateId: null, csvFolderId: null };
            }

            // extract IDs
            const csvTemplateId = Number(row.csv_template || 0) || null;
            const csvFolderId   = Number(row.csv_folder   || 0) || null;
            const description    = String(row.description || '').trim();
            const id =  Number(row.record_id || 0) || null;

            // resolve file URL if we have a template id
            let csvTemplateUrl = null;
            if (csvTemplateId) {
              csvTemplateUrl = row.csv_template_url || null;
            }

            return { csvTemplateUrl, csvTemplateId, csvFolderId, description,id };
          }

  
          function handleFile(fileObj){
            if (!fileObj || !/\\.csv$/i.test(fileObj.name)) { meta.textContent = 'Please drop a .csv file.'; return; }
            setError(card, false);
            const spinner = document.createElement('oj-progress-circle');
            spinner.setAttribute('size','xs'); spinner.setAttribute('value','-1'); spinner.setAttribute('aria-label','Parsing');
            meta.innerHTML = '';
            meta.appendChild(spinner);
            meta.appendChild(document.createTextNode(' Parsing CSV...'));
            Papa.parse(fileObj, {
              worker: false,
              header: false,
              skipEmptyLines: 'greedy',
              complete: (res) => {
                const rows = res && res.data ? res.data : [];
                const count = Math.max(0, rows.length - 1);
                st.rowCount = count;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  st.csvText = ev.target.result || '';
                  meta.innerHTML = '<span class="rowcount">'+count.toLocaleString()+'</span> rows detected';
                  btnSave.removeAttribute('disabled');
                  btnCancel.removeAttribute('disabled');
                };
                reader.readAsText(fileObj);
              },
              error: (err) => {
                meta.textContent = 'Parse error: ' + (err && err.message || err);
                setError(card, true, meta.textContent);
              }
            });
          }
  
          btnSave.addEventListener('click', async ()=>{
            if (!st.csvText) return;
            setError(card, false);
            setSaving(card, true);
            btnSave.setAttribute('disabled','disabled');
            btnCancel.setAttribute('disabled','disabled');
            meta.textContent = 'Saving...';
            try {
              const res = await fetch(SL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', recordType: rt, csvText: st.csvText, includeHeader: false, folderId: cardInfo.csvFolderId })
              });
              const json = await res.json();
              if (!json.ok) throw new Error(json.error || 'Unknown error');
              meta.innerHTML = '<span class="rowcount">'+json.rowCount.toLocaleString()+'</span> rows saved';
              await loadStatusIntoCard(rt, card, stats);
              const catEl = card.closest('.cat');
              if (catEl) updateCategorySummary(catEl);
              card.classList.add('is-saved', 'flash-saved');
              setTimeout(()=> card.classList.remove('flash-saved'), 600);
            } catch (e) {
              setError(card, true, e && e.message ? e.message : 'Save failed');
            } finally {
              setSaving(card, false);
              btnSave.removeAttribute('disabled');
              btnCancel.removeAttribute('disabled');
            }
          });
  
          btnCancel.addEventListener('click', ()=>{
            st.csvText = null;
            st.rowCount = null;
            setError(card, false);
            btnSave.setAttribute('disabled','disabled');
            btnCancel.setAttribute('disabled','disabled');
            meta.textContent = 'Awaiting CSV...';
          });
  
          // Initial meta + async status fetch
          meta.innerHTML = '<oj-progress-circle size="xs" value="-1" aria-label="Loading"></oj-progress-circle> Loading status...';
          loadStatusIntoCard(rt, card, stats).then(()=>{
            const catEl = card.closest('.cat');
            if (catEl) updateCategorySummary(catEl);
          }).catch(err=>{
            setError(card, true, err && err.message ? err.message : 'Failed to load status');
          });
  
          // attach hidden file input
          card.appendChild(fileInput);
          return card;
        }

  
        async function loadStatusIntoCard(recType, card, statsEl){
          const meta = card.querySelector('.meta');
          const resp = await fetchStatus(recType);
          if (!resp || !resp.ok) {
            card.classList.remove('is-saved');
            throw new Error(resp && resp.error ? resp.error : 'Status error');
          }
          const { fileCount, totalBytes, headerCols, totalRows } = resp;
  
          // Keep in state for category summaries
          state[recType] = state[recType] || {};
          state[recType].status = { fileCount, totalBytes, headerCols, totalRows };
  
          // Update stats badges
          statsEl.innerHTML = '';
          statsEl.appendChild(el('span', { class: 'stat', text: 'Files: ' + (fileCount||0) }));
          statsEl.appendChild(el('span', { class: 'stat', text: 'Size: ' + bytesToHuman(totalBytes||0) }));
          statsEl.appendChild(el('span', { class: 'stat', text: 'Columns: ' + (headerCols||0) }));
          statsEl.appendChild(el('span', { class: 'stat', text: 'Rows: ' + (totalRows||0).toLocaleString() }));
  
          // Saved/empty visual
          if (fileCount && fileCount > 0) {
            card.classList.add('is-saved');
            meta.textContent = 'Loaded saved data';
          } else {
            card.classList.remove('is-saved');
            meta.textContent = 'Awaiting CSV...';
          }
          card.classList.remove('is-error');
        }
  
        function renderCategory(cat) {
          const title = el('div', { class: 'cat-title', text: cat.category });
          const summary = el('div', { class: 'cat-summary', text: 'Loading…' });
          const toggle = el('button', { class: 'cat-toggle', type: 'button', title: 'Collapse/Expand' }, '▾');
  
          const header = el('div', { class: 'cat-header', role: 'button', tabindex: '0', 'aria-expanded': 'true' }, [toggle, title, summary]);
          const content = el('div', { class: 'cat-content' });
  
          const container = el('div', { class: 'cat', 'data-category': cat.category }, [header, content]);
  
          function setCollapsed(on){
            container.classList.toggle('collapsed', !!on);
            header.setAttribute('aria-expanded', on ? 'false' : 'true');
            toggle.textContent = on ? '▸' : '▾';
          }
          header.addEventListener('click', ()=> setCollapsed(container.classList.contains('collapsed') ? false : true));
          header.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(container.classList.contains('collapsed') ? false : true); }});
  
          // Render cards for each record type in this category
          (cat.record_types || []).forEach(rt => content.appendChild(renderCard(String(rt).trim())));
  
          // Initial summary (will be refreshed as statuses return)
          summary.textContent = '0 of ' + (cat.record_types.length) + ' loaded';
  
          return container;
        }
  
        function updateCategorySummary(catEl){
          const content = catEl.querySelector('.cat-content');
          const recTypes = Array.from(content.querySelectorAll('.csv-card')).map(c => c.getAttribute('data-type'));
          let populated = 0, totalFiles = 0, totalRows = 0;
          recTypes.forEach(rt => {
            const st = state[rt] && state[rt].status;
            if (st) {
              if ((st.fileCount||0) > 0) populated++;
              totalFiles += (st.fileCount||0);
              totalRows += (st.totalRows||0);
            }
          });
          const sumEl = catEl.querySelector('.cat-summary');
        sumEl.textContent = populated + '/' + recTypes.length + ' with files · ' + totalFiles + ' files · ' + totalRows.toLocaleString() + ' rows';
        }
  
        // Render all categories
        DATA_CATEGORIES.forEach(cat => catsRoot.appendChild(renderCategory(cat)));
      })();
    </script>
  </body>
  </html>`;
  
      context.response.write(html);
    }

    function getCategories(){
      let sql = `
              SELECT
                BUILTIN.DF(mrc.custrecord_mdm_recordcategory) record_category,
                BUILTIN.DF(mc.parent) record_category_parent,
                mrc.name record_name,
                mrc.id record_id,
                mrc.custrecord_mdm_csvstagingfolder csv_folder,
                mrc.custrecord_mdm_csvtemplatefile csv_template,
                mrc.custrecord_mdm_controlrecdesc description,
		            f.url csv_template_url
              FROM customrecord_mdm_record_control mrc
              LEFT JOIN file f ON mrc.custrecord_mdm_csvtemplatefile = f.id
              RIGHT JOIN customrecord_mdm_record_category mc ON mrc.custrecord_mdm_recordcategory = mc.id
	            WHERE mrc.isinactive = 'F' 
              ORDER BY BUILTIN.DF(mrc.custrecord_mdm_recordcategory), mrc.name ASC
      `;
              // Transform into the grouped structure
           log.debug('Runtime Script Governance in categories', `Remaining=${runtime.getCurrentScript().getRemainingUsage()}`);     
        const rows = suiteql.runSuiteQLAsMapped(sql, []);
          log.debug('Runtime Script Governance after SQL execution', `Remaining=${runtime.getCurrentScript().getRemainingUsage()}`);
        const grouped = {};
        rows.forEach(function(row) {
          const category = row.record_category;
          const recordName = row.record_name;
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(recordName);
        });

        // Build final array
        const DATA_CATEGORIES = Object.keys(grouped).map(function(category) {
          return {
            category:     category,
            record_types: grouped[category]
          };
        });

      return {categories: DATA_CATEGORIES, fullData: rows};
    }

    function getFolderIdFromRecordType(recordType){
      let sql = `
              SELECT
                mrc.custrecord_mdm_csvstagingfolder csv_folder
              FROM customrecord_mdm_record_control mrc
              WHERE mrc.name = ?
      `;
      let folderId = suiteql.runSuiteQLAsMapped(sql, [recordType])[0]?.csv_folder;
      return folderId;
    }

    function onRequest(context) {
      if (context.request.method === 'POST') {
        return handlePost(context);
      }
      return renderGet(context);
    }
  
    return { onRequest };
  });
  