/**
* Copyright (c) 1998-2023 Oracle NetSuite, Inc.
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
*  1.00            2025-09-06          riccardi             initial build
*
*/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * ns_cs_fgmd_rc_schema.js
 * Record Control client actions: fetch NetSuite record schema and store JSON.
 */
define([
    'N/currentRecord',
    'N/search',
    'N/ui/dialog',
    'N/runtime',
    'N/url',
    'N/https',
    'N/log',
    'N/record',
    '/SuiteScripts/mdm/lib/mdm_lib_schema.js',
    'N/file'
  ], (currentRecord, search, dialog, runtime, url,https,log,record,schemaLib,file) => {

    const LP = '[FGMD:RC:Schema]';
    const MAP_VERSION_RT = 'customrecord_mdm_mapversion';
    const F_ACTIVE_MAP   = 'custrecord_mdm_activemap';
    const F_MAP_TARGET   = 'custrecord_mdm_maptarget';
    const F_MAP_SCRIPTTYPE = 'custrecord_mdm_targettypescript';
    const F_SCHEMA_JSON  = 'custrecord_mdm_metadatamodel';
    const F_REC_NAME =     'custrecord_mdm_modelrecname';
    const EVAL_PROMPT_SCRIPT = 'custprompt_fgmd_record_schema';
    const EVAL_PROMPT_DEPLOY = 'customdeploy_fgmd_record_schema';
    //const PROMPT_CSVMETA =     'custprompt_mdm_metatocsv';
    const PROMPT_CSVMETA =     '3';
    const CSV_HEADERS = 'custrecord_mdm_csvheaders';
    const FLD_RECNAME  = 'custrecord_mdm_modelrecname';
    const FLD_MODEL    = 'custrecord_mdm_metadatamodel';
    const FLD_OUT_JSON = 'custrecord_mdm_csvdatamodel';
    const FLD_CSV_TEMPLATE = 'custrecord_mdm_csvtemplatefile';
    const EXCLUDED_FIELDS_FOR_CSV = ['internalid','id','createddate','lastmodifieddate','lastmodifiedby','createdby','owner'];
    const DEFAULT_CSV_FOLDER = runtime.getCurrentScript().getParameter({ name: 'custscript_mdm_folderid' }) || '';
    const FILEMAKER_SUITELET = {
      scriptId: 'customscript_ns_mdm_su_filemaker',
      deploymentId: 'customdeploy_ns_mdm_su_filemaker'
    };
  
    /** Resolve the schema helper, whether loaded as AMD or global */
    function getSchemaHelper() {
      if (schemaLib && typeof schemaLib.getRecordSchema === 'function') return schemaLib;
      if (typeof window !== 'undefined' && window.FGMD_Schema) return window.FGMD_Schema;
      return null;
    }
  
    /**
     * Safe getter for a lookupFields result (handles text/string/array forms).
     * @param {any} obj
     * @returns {string} value
     */
    function coerceFieldValue(obj) {
      if (obj == null) return '';
      if (Array.isArray(obj)) {
        // lookupFields for select/multiselect commonly returns [{value:'', text:''}]
        if (obj.length === 0) return '';
        const first = obj[0];
        return (first && (first.value || first.text)) || '';
      }
      if (typeof obj === 'object') {
        // Sometimes returns { value:'', text:'' }
        return obj.value || obj.text || '';
      }
      return String(obj);
    }
  
    /**
     * Lookup the map target (record script id) from the active mapping version.
     * @param {number|string} mapVersionId
     * @returns {string} recordScriptId (e.g., 'customer', 'vendor', 'salesorder')
     */
    function getMapTarget(recordVersionId) {
      const res = search.lookupFields({
        type: MAP_VERSION_RT,
        id: String(recordVersionId),
        columns: [F_MAP_TARGET, F_MAP_SCRIPTTYPE]
      });
      return [coerceFieldValue(res[F_MAP_TARGET]).toLowerCase(),coerceFieldValue(res[F_MAP_SCRIPTTYPE]).toLowerCase()];
    }
  
    /**
     * Public: fetch schema & write to custrecord_mdm_metadatamodel.
     * Bind this as a button handler or call from pageInit as needed.
     */
    async function fetchSchema() {
      try {
        showWorkingOverlay('Initializing…', { showProgress: true });
        setWorkingTitle('Retrieving Schema');
        const cr = currentRecord.get();
        const activeMapId = cr.getValue({ fieldId: F_ACTIVE_MAP });
        if (!activeMapId) {
          await dialog.alert({ title: 'Missing Active Map', message: 'Please select an Active Map version first.' });
          hideWorkingOverlay();
          return;
        }
        appendWorkingLine('Getting target type.');
        const targetType = getMapTarget(activeMapId);
        if (!targetType) {
          await dialog.alert({ title: 'Missing Target Type', message: 'The selected map version has no target record type (custrecord_mdm_maptarget).' });
          hideWorkingOverlay();
          return;
        }
        appendWorkingLine(`Target type: ${targetType[0]} (Script Type: ${targetType[1]})`);
        const helper = getSchemaHelper();
        if (!helper) {
          await dialog.alert({ title: 'Schema Library Not Found', message: 'mdm_lib_schema.js not loaded. Check the client script dependency path.' });
          hideWorkingOverlay();
          return;
        }
        appendWorkingLine('Fetching schema from NetSuite Record Catalog…');
        // Fetch schema (async recommended)
        const { schema, raw } = await helper.getRecordSchema(targetType);
        appendWorkingLine('Done.');
        setWorkingTitle('Complete');
    
        const jsonOut = JSON.stringify( schema, null, 2);
        cr.setValue({ fieldId: F_REC_NAME, value: schema.id || targetType[0] });
        cr.setValue({ fieldId: F_SCHEMA_JSON, value: jsonOut });
        hideWorkingOverlay();
        await dialog.alert({
          title: 'Schema Retrieved',
          message: `Fetched schema for “${schema.id || targetType[0]}”.\nFields: ${schema.fields.length}\nSubRecords: ${schema.subRecords.length}\n\nRemember to Save the record to persist changes.`
        });
  
      } catch (e) {
        log.error(LP, e);
        try {
          await dialog.alert({ title: 'Schema Retrieval Failed', message: String(e && e.message || e) });
          console.log(LP + ' fetchSchema error', e);
          hideWorkingOverlay();
        } catch (_) { /* ignore dialog errors */ }
      }
    }

  /**
   * Call this from a button or any entry point.
   * @param {{ scriptId: string, deploymentId: string, promptId: string }} suitelet
   */
    async function createCSVmodel() {
      const rec = currentRecord.get(); // client-side handle to active record. :contentReference[oaicite:1]{index=1}

      const recordName = (rec.getValue(FLD_RECNAME) || '').toString().trim();
      const metaModel  = (rec.getValue(FLD_MODEL)   || '').toString();

      if (!recordName || !metaModel) {
        await dialog.alert({
          title: 'Missing inputs',
          message: `Both ${FLD_RECNAME} and ${FLD_MODEL} must be populated first.`
        }); // N/ui/dialog sample usage. :contentReference[oaicite:2]{index=2}
        return false;
      }

      try {
        const parsed = JSON.parse(metaModel);
        // Generate CSV metadata
        const csvMeta = schemaLib.buildImportHeaderCSV(parsed, EXCLUDED_FIELDS_FOR_CSV);
        // Store in output field
        rec.setValue({ fieldId: FLD_OUT_JSON, value: csvMeta});
        rec.setValue({ fieldId: CSV_HEADERS, value: csvMeta});

        await dialog.alert({
          title: 'Generated',
          message: `CSV data model created for ${recordName}. Review the CSV Headers and create the CSV file.`
        });

        return true;

      } catch (err) {
        log.error(LP + ' createCSVmodel error', err);
        console.error(LP + ' createCSVmodel error', err);
        await dialog.alert({
          title: 'Error',
          message: (err && err.message) || String(err)
        });
        return false;
      }
    }

  
    /**
     * Optional: auto-run if a URL param mdmAction=fetchSchema is present.
     */
    function pageInit() {
      try {
        const params = new URLSearchParams(window.location.search || '');
        if (params.get('mdmAction') === 'fetchSchema') {
          // fire and forget; no blocking
          fetchSchema();
        }
            // Make the function visible to the button click handler
        if (typeof window !== 'undefined') {
            window.fetchSchema = fetchSchema;
            window.getMetadata = fetchSchema;
            window.createCSVmodel = createCSVmodel;
            window.createSubFolder = createSubFolder;
            window.createCSVFile = createCSVFile;
            window.createCSVTemplate = createCSVFile;
        }
        // add style to head
        const style = document.createElement('style');
          style.textContent = `
          .redwood-button {
            display: inline-block;
            background-color: #36677d;          /* Redwood accent blue */
            color: #fff;
            font-family: "Oracle Sans", "Helvetica Neue", Arial, sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 8px;                 /* Redwood rounded corner */
            border: none;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: background-color 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            user-select: none;
            margin-top: 2px;
          }

          .redwood-button:hover {
            background-color: #5eb2d7;          /* darker hover tone */
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }

          .redwood-button:active {
            background-color: #004080;          /* pressed state */
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
          }

          .redwood-button:disabled,
          .redwood-button[disabled] {
            background-color: #e0e3e8;
            color: #8b8d90;
            cursor: not-allowed;
            box-shadow: none;
          }
        `;
        //append to head
        document.head.appendChild(style);
      } catch (e) { /* no-op */ }
    }

    /**
     * Create or retrieve a subfolder within a parent folder
     * @param {string} folderName - The name of the new folder
     * @param {number} parentFolderId - Internal ID of the parent folder
     * @returns {{ id: number, name: string, created: boolean }} - The folder internal ID and a flag if newly created
     */
    function createSubFolder(folderName, parentFolderId) {

      const rec = currentRecord.get(); //
      folderName = folderName || rec.getValue('name');
      parentFolderId = parentFolderId || runtime.getCurrentScript().getParameter({ name: 'custscript_mdm_folderid' });

      if (!folderName || !parentFolderId) {
        throw new Error('Both folderName and parentFolderId are required.');
        alert('Both folderName and parentFolderId are required.');
      }

      // 🔍 1. Check if folder already exists under this parent
      const existing = search.create({
        type: 'folder',
        filters: [
          ['name', 'is', folderName],
          'and',
          ['parent', 'anyof', parentFolderId]
        ],
        columns: ['internalid']
      }).run().getRange({ start: 0, end: 1 });

      if (existing && existing.length > 0) {
        const existingId = existing[0].getValue({ name: 'internalid' });
        log.debug('Folder already exists', { name: folderName, id: existingId });
        alert('Folder already exists');
        rec.getField({ fieldId: 'custrecord_mdm_csvstagingfolder' }).isDisabled = true;
        return { id: Number(existingId), name: folderName, created: false };
      }

      // 📁 2. Create new folder
      const newFolder = record.create({ type: 'folder' });
      newFolder.setValue({ fieldId: 'name', value: folderName });
      newFolder.setValue({ fieldId: 'parent', value: parentFolderId });

      const folderId = newFolder.save();
      rec.setValue({ fieldId: 'custrecord_mdm_csvstagingfolder', value: folderId });
      log.audit('Folder created', { name: folderName, id: folderId, parent: parentFolderId });
      rec.getField({ fieldId: 'custrecord_mdm_csvstagingfolder' }).isDisabled = true;

      return { id: folderId, name: folderName, created: true };
    }

    //create csv template file from the generated csv headers
    async function _createCSVFile(fileName, folderId, csvHeaders) {
      if (!fileName || !folderId || !csvHeaders) {
        throw new Error('fileName, folderId, and csvHeaders are required to create CSV file.');
      }
      const fileObj = await createFileFromClient({
        fileName: fileName,
        fileType: 'CSV',
        contents: csvHeaders,
        folderId: folderId,
        scriptId: FILEMAKER_SUITELET.scriptId,
        deploymentId: FILEMAKER_SUITELET.deploymentId
      });
      console.log('CSV file created', { fileObj });

      return { id: fileObj.fileId, name: fileName, url: fileObj.fileUrl };
    }
    async function createCSVFile() {
      const rec = currentRecord.get();
      const recordName = (rec.getValue(FLD_RECNAME) || '').toString().trim() + '_CSV_Import_Template.csv';
      const csvHeaders = (rec.getValue(CSV_HEADERS) || '').toString();
      const folderId = DEFAULT_CSV_FOLDER;
      if (!recordName || !csvHeaders) {
        alert('Both Record Name and CSV Headers must be populated first.');
        return;
      }
      try {
      const fileObj = await _createCSVFile(recordName, folderId, csvHeaders);
      rec.setValue({ fieldId: FLD_CSV_TEMPLATE, value: fileObj.id });
      rec.getField({ fieldId: FLD_CSV_TEMPLATE }).isDisabled = true;
      let downloadHTML = `<a href="${fileObj.url}" target="_blank" rel="noopener noreferrer">Download CSV Template</a>`;
      rec.setValue({ fieldId: 'custrecord_mdm_createtemplatefile', value: downloadHTML });
      } catch (err) {
        log.error(LP + ' createCSVFile error', err);
        console.error(LP + ' createCSVFile error', err);
        alert((err && err.message) || String(err));
      }
    }
    /**
 * Create a file in NetSuite via a proxy Suitelet
 * @param {Object} opts
 * @param {string} opts.fileName - Desired filename (e.g., 'chunk_001.xml')
 * @param {string} opts.fileType - File type (e.g., 'XML', 'CSV', 'PLAINTEXT')
 * @param {string} opts.contents - File contents as text
 * @param {number} opts.folderId - Internal ID of target folder
 * @param {string} opts.scriptId - Suitelet script ID
 * @param {string} opts.deploymentId - Suitelet deployment ID
 * @returns {Promise<{success:boolean,fileId?:number,fileName?:string,fileUrl?:string,error?:string}>}
 */
async function createFileFromClient(opts) {
  const { fileName, fileType, contents, folderId, scriptId, deploymentId } = opts || {};

  if (!fileName || !fileType || !folderId) {
    throw new Error('fileName, fileType, and folderId are required.');
  }

  // Resolve Suitelet URL using N/url
  const suiteletUrl = url.resolveScript({
    scriptId: scriptId || FILEMAKER_SUITELET.scriptId,
    deploymentId: deploymentId || FILEMAKER_SUITELET.deploymentId,
    returnExternalUrl: false
  });

  // POST request
  const resp = await fetch(suiteletUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileName,
      fileType: fileType,
      contents: contents || '',
      folderId: folderId
    })
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} - Failed to reach file creation Suitelet`);
  }

  const result = await resp.json();
  if (!result.success) {
    throw new Error(result.error || 'File creation failed with unknown error.');
  }
  console.log('File created via Suitelet', result);
  return result;
}

// --- Modal Overlay Utilities (Redwood-styled) ---

const OVERLAY_ID = 'nsx-working-overlay';
const PANEL_ID   = 'nsx-working-panel';
const LOG_ID     = 'nsx-working-log';
const PROG_WRAP  = 'nsx-working-progress-wrap';
const PROG_BAR   = 'nsx-working-progress-bar';

function ensureOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;

  // Styles (scoped, lightweight Redwood look)
  const style = document.createElement('style');
  style.textContent = `
    #${OVERLAY_ID}{
      position:fixed; inset:0; background:rgba(0,0,0,0.35);
      display:flex; align-items:center; justify-content:center;
      z-index: 9999; /* above NS UI */
    }
    #${PANEL_ID}{
      min-width: 420px; max-width: 780px;
      background:#fff; border-radius:12px; padding:16px 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      font-family: "Oracle Sans","Helvetica Neue",Arial,sans-serif;
      color:#323338;
    }
    #${PANEL_ID} h3{
      margin:0 0 10px; font-size:1.05rem; font-weight:700; color:#434d69; /* Redwood Lilac 140 */
    }
    #${LOG_ID}{
      max-height: 280px; overflow:auto; border:1px solid #e0e3e8; border-radius:8px;
      padding:10px; background:#f8f9fb; font-size:.92rem; line-height:1.35rem;
    }
    #${LOG_ID} .line{ margin: 0 0 6px; white-space: pre-wrap; }
    #${PROG_WRAP}{ margin-top:10px; height:10px; background:#eef0f3; border-radius:8px; overflow: hidden; }
    #${PROG_BAR}{ height:100%; width:0%; background:#0066cc; transition: width .2s ease; } /* Redwood accent blue */
    .nsx-muted{ color:#6b6e75; font-size:.86rem; margin:8px 0 0; }
    .nsx-actions{ margin-top:12px; text-align:right; }
    .nsx-btn{
      display:inline-block; background:#f4f6f8; color:#323338; border:1px solid #c5c7ca;
      padding:6px 12px; border-radius:8px; font-weight:600; cursor:pointer; text-decoration:none;
    }
    .nsx-btn:hover{ background:#eef0f3; }
  `;
  document.head.appendChild(style);

  // DOM
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <h3>Working…</h3>
    <div id="${LOG_ID}" aria-live="polite" aria-atomic="false"></div>
    <div id="${PROG_WRAP}" aria-hidden="true"><div id="${PROG_BAR}"></div></div>
    <div class="nsx-muted">You can keep this window open; status updates will appear here.</div>
    <div class="nsx-actions" style="display:none;">
      <a class="nsx-btn" onclick="document.getElementById('${OVERLAY_ID}')?.remove()">Close</a>
    </div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function showWorkingOverlay(initialMessage, { showProgress = false } = {}) {
  ensureOverlay();
  const log = document.getElementById(LOG_ID);
  if (log && initialMessage) {
    appendWorkingLine(initialMessage);
  }
  // toggle progress
  const wrap = document.getElementById(PROG_WRAP);
  if (wrap) wrap.style.display = showProgress ? 'block' : 'none';
}

function appendWorkingLine(text) {
  ensureOverlay();
  const log = document.getElementById(LOG_ID);
  if (!log) return;
  const div = document.createElement('div');
  div.className = 'line';
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function setWorkingProgress(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const bar = document.getElementById(PROG_BAR);
  if (bar) bar.style.width = p + '%';
}

function setWorkingTitle(text) {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const h3 = panel.querySelector('h3');
  if (h3) h3.textContent = text || 'Working…';
}

function hideWorkingOverlay({ allowManualClose = false } = {}) {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  if (allowManualClose) {
    const actions = overlay.querySelector('.nsx-actions');
    if (actions) actions.style.display = 'block';
  } else {
    overlay.remove();
  }
}



    return {
      pageInit,
      fetchSchema, 
      getMetadata: fetchSchema,
      createCSVmodel,
      createSubFolder,
      createCSVFile
    };
  });
  