/*
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
*  1.00            08/11/2025          riccardi             initial build
*
*/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * File: ns_CS_CTMT_builder.js
 * Project: Catalog Template Factory (CTMT)
 * Purpose:
 *  - On-demand generation of a CSV data-migration template for the current record type.
 *  - Primary metadata source: Records Catalog endpoint (same-origin, "Tim's approach").
 *  - Fallback path: Suitelet (server-side) to fetch metadata and/or save files.
 *  - Saves CSV to File Cabinet (via Suitelet) and triggers a browser download.
 *
 * Button hook (from UE):
 *  - form.addButton({ functionName: 'CTMT_generateTemplate' })
 *
 * UI:
 *  - Updates Redwood-themed progress bar steps via DOM IDs:
 *      ctf-step-collect, ctf-step-analyze, ctf-step-create, ctf-step-save
 */

define(['N/currentRecord', 'N/url', 'N/runtime', 'N/ui/dialog','N/file'], (
    currentRecord,
    url,
    runtime,
    dialog,
    file
  ) => {
  
    const LOG_PREFIX = 'CTMT-CS';
    const JSON_FOLDER_ID = 2292 // replace with script parameter
    const STEP_IDS = {
      collect: 'ctf-step-collect',
      analyze: 'ctf-step-analyze',
      create:  'ctf-step-create',
      save:    'ctf-step-save'
    };
  
    // Adjust to your Suitelet script/deploy IDs once created
    const SUITELET = {
      scriptId: 'customscript_ns_su_ctmt_export',
      deployId: 'customdeploy_ns_su_ctmt_export'
    };
  
    /**
     * pageInit
     * Optionally mark first step as active (UE already sets it). Safe-guards the DOM if needed.
     */
    const pageInit = () => {
      // no-op by default; keep for future options wiring.
      // If the inline HTML wasn't injected for some reason, this won't throw.
      try { setStepState('collect', 'is-active'); } catch (_e) {}
    };
  
    /**
     * Orchestrator: invoked by the form button.
     * 1) Collect metadata → 2) Analyze → 3) Create CSV → 4) Save + Download
     */
    async function CTMT_generateTemplate() {
      let recordType;
      try {
        const cr = currentRecord.get();
        recordType = (cr && cr.type) ? String(cr.type) : '';
        if (!recordType) throw new Error('Unable to determine current record type.');
  
        // 1) Collect metadata
        setStepState('collect', 'is-active');
        const meta = await fetchMetadata(recordType);
        setStepState('collect', 'is-complete');
        console.log(`${LOG_PREFIX} metadata`, meta);
  
        // 2) Analyze/normalize
        setStepState('analyze', 'is-active');
        const schema = normalizeSchema(meta);
        console.log(`${LOG_PREFIX} normalized schema`, schema);
        const bodyFields = (schema && schema.bodyFields) ? schema.bodyFields : [];
        if (!bodyFields.length) {
          throw new Error('No importable body fields were found for this record type.');
        }
        setStepState('analyze', 'is-complete');
  
        // 3) Create CSV text
        setStepState('create', 'is-active');
        const csvText = buildCsv(recordType, bodyFields);
        const filename = makeFileName(recordType);
        setStepState('create', 'is-complete');
  
        // 4) Save to File Cabinet (Suitelet) and trigger browser download
        setStepState('save', 'is-active');
        try {
          await saveViaSuitelet(filename, csvText, recordType);
        } catch (slErr) {
          // Non-fatal: we still deliver browser download even if save fails.
          logError(`${LOG_PREFIX} Suitelet save failed`, slErr);
        }
        triggerBrowserDownload(filename, csvText);
        setStepState('save', 'is-complete');
      } catch (err) {
        logError(`${LOG_PREFIX} generate error`, err);
        // Mark current/next step as error visually
        try {
          const step = inferActiveStep() || 'collect';
          setStepState(step, 'is-error');
        } catch (_e) {}
        await showError(err.message || String(err));
      }
    }
  
    /**
     * Fetch metadata using Records Catalog (primary) with a Suitelet fallback.
     * @param {string} recordType - NetSuite scriptId for the current record type, e.g., 'customer','salesorder'
     * @returns {Promise<object>}
     */
    async function fetchMetadata(recordType) {
      // Primary: call Records Catalog endpoint (in-account, same-origin)
      try {
        const rcUrl = buildRCDetailUrl(recordType);
        logDebug(`${LOG_PREFIX} RC primary URL`, rcUrl);
        const rcRes = await fetch(rcUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (rcRes.ok) {
            logDebug(`${LOG_PREFIX} RC primary response`, rcRes.status);
          const json = await rcRes.json();
          //saveJSONToFileCabinet(`CTMT_${recordType}_metadata.json`, json, recordType);
          saveViaSuitelet(`CTMT_${recordType}_metadata.json`, JSON.stringify(json), recordType);
          if (json) return json;
        }
        // If 403/404 or non-JSON, fall through to Suitelet
        logDebug(`${LOG_PREFIX} RC primary not ok, status: ${rcRes.status}`);
      } catch (e) {
        logDebug(`${LOG_PREFIX} RC primary error`, e);
      }
  
      // Fallback: Suitelet (server-side) to fetch schema via REST metadata-catalog
      try {
        const slUrl = url.resolveScript({
          scriptId: SUITELET.scriptId,
          deploymentId: SUITELET.deployId,
          params: { mode: 'meta', rectype: recordType }
        });
        const slRes = await fetch(slUrl, {
          method: 'GET',
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' }
        });
        if (!slRes.ok) {
          throw new Error(`Suitelet metadata fetch failed (${slRes.status}).`);
        }
        let json =  await slRes.json();
        saveViaSuitelet(`CTMT_${recordType}_metadata.json`, JSON.stringify(json), recordType);
        return json;
      } catch (e) {
        throw new Error(`Unable to retrieve metadata for ${recordType}. ${e.message || e}`);
      }
    }
  
    /**
     * Build Records Catalog "detail" URL (Tim’s approach).
     * Typical call shape observed:
     *   /app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data={scriptId:'salesorder',detailType:'SS_ANAL'}
     * @param {string} recordType
     * @returns {string}
     */
    function buildRCDetailUrl(recordType) {
      const payload = {
        scriptId: recordType,
        detailType: 'SS_ANAL' // analysis-level details include fields/sublists; adjust if needed
      };
      const encoded = encodeURIComponent(JSON.stringify(payload));
      // Absolute path avoids base href surprises
      return `/app/recordscatalog/rcendpoint.nl?action=getRecordTypeDetail&data=${encoded}`;
    }
  
    /**
     * Normalize schema from Records Catalog or Suitelet fallback into a simple structure:
     * { bodyFields: [{id,label,type,required,readOnly,importable}], sublists: { sublistId: [...] } }
     * The function is defensive to accommodate slightly different shapes from primary vs fallback.
     * @param {object} meta
     * @returns {{bodyFields: Array, sublists: Object<string,Array>}}
     */
    function normalizeSchema(meta) {
        meta = meta.data
      const out = { bodyFields: [], sublists: {}, joins: {} , subrecords: {}};
  
      if (!meta || typeof meta !== 'object') return out;
  
      // Candidate field collections in different responses
      const bodyFieldArrays = [
        meta.bodyFields, meta.fields, meta.columns,
        meta.analysis && meta.analysis.bodyFields,
        meta.schema && meta.schema.fields && meta.data.fields
      ].filter(Boolean);
  
      const pickFirstArray = bodyFieldArrays.length ? bodyFieldArrays[0] : [];
      const parsedBody = Array.isArray(pickFirstArray) ? pickFirstArray : [];
      console.log(`${LOG_PREFIX} parsed body fields`, parsedBody);

      parsedBody.forEach((f) => {
        const id = f.scriptId || f.id || f.fieldId || '';
        if (!id) return;
  
        const fieldObj = {
          id,
          label: f.label || f.name || id,
          fieldType: f.fieldType || f.type || 'TEXT',
          features: f.features || [],
          type: (f.dataType || f.type || '').toString().toUpperCase(),
          required: !!(f.mandatory || f.required),
          readOnly: !!(f.readOnly || f.isReadOnly),
          isAvailable: !!(f.isAvailable || f.available),
          isColumn: !!(f.isColumn || f.isColumnField),
          fieldHelp: f.flh || f.fieldHelp || '',
        };
  
        // Basic filter: ignore purely system/computed fields where known
        if (fieldObj.readOnly) fieldObj.importable = false;
  
        out.bodyFields.push(fieldObj);
      });
  
      // Sublists (if needed later): normalize into { sublistId: [fields] }
      const sublistSources = [
        meta.sublists,
        meta.analysis && meta.analysis.sublists
      ].filter(Boolean);
  
      const slTop = sublistSources.length ? sublistSources[0] : {};
      if (Array.isArray(slTop)) {
        // Sometimes sublists comes as an array
        slTop.forEach((sl) => {
          const sid = sl.id || sl.scriptId;
          if (!sid) return;
          const slFields = Array.isArray(sl.fields) ? sl.fields : [];
          out.sublists[sid] = slFields.map((sf) => ({
            id: String(sf.scriptId).toLowerCase || String(sf.id).toLowerCase || '',
            label: sf.label || sf.name || '',
            type: (sf.dataType || sf.type || '').toString().toUpperCase(),
            required: !!(sf.mandatory || sf.required),
            readOnly: !!(sf.readOnly || sf.isReadOnly),
            importable: !sf.readOnly
          })).filter(s => s.id);
        });
      } else if (slTop && typeof slTop === 'object') {
        // Sometimes sublists is an object map
        Object.keys(slTop).forEach((sid) => {
          const sl = slTop[sid] || {};
          const slFields = Array.isArray(sl.fields) ? sl.fields : [];
          out.sublists[sid] = slFields.map((sf) => ({
            id: sf.scriptId || sf.id || '',
            label: sf.label || sf.name || '',
            type: (sf.dataType || sf.type || '').toString().toUpperCase(),
            required: !!(sf.mandatory || sf.required),
            readOnly: !!(sf.readOnly || sf.isReadOnly),
            importable: !sf.readOnly
          })).filter(s => s.id);
        });
      }
  
      // Filter out non-importable body fields
      out.bodyFields = out.bodyFields.filter(b => b.importable !== false);
  
      return out;
    }
  
    /**
     * Build a minimal CSV template:
     *  - Row 1: field IDs
     *  - Row 2: (empty data row for the first record)
     * @param {string} recordType
     * @param {Array<{id:string}>} bodyFields
     * @returns {string}
     */
    function buildCsv(recordType, bodyFields) {
      const availableFields = bodyFields.filter(f => f.isAvailable === true);  
      const ids = csvLine(availableFields.map(f => f.id));
      const types = csvLine(availableFields.map(f => f.type || 'TEXT'));
      const fieldTypes = csvLine(availableFields.map(f => f.fieldType || 'TEXT'));
      const labels = csvLine(availableFields.map(f => f.label || f.id || ''));
      const fieldHelp = csvLine(availableFields.map(f => f.fieldHelp  || ''));
      //const header = csvLine(ids);
      const blankRow = csvLine(availableFields.map(_ => ''));
      // You can add more sample blank rows if desired
      return `  ${labels}
                ${ids}
                ${types}
                ${fieldTypes}
                ${fieldHelp}
                ${blankRow}\n`;
    }
  
    /**
     * Save CSV via Suitelet (File Cabinet) – if Suitelet is not yet deployed, this will fail gracefully.
     * Expects Suitelet to return JSON { fileId, fileUrl }.
     * @param {string} filename
     * @param {string} csvText
     * @param {string} recordType
     */
    async function saveViaSuitelet(filename, csvText, recordType) {
      const slUrl = url.resolveScript({
        scriptId: SUITELET.scriptId,
        deploymentId: SUITELET.deployId,
        params: { mode: 'save', rectype: recordType, filename }
      });
  
      const res = await fetch(slUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        body: csvText
      });
  
      if (!res.ok) {
        throw new Error(`Save Suitelet responded ${res.status}`);
      }
  
      const json = await res.json().catch(() => ({}));
      logDebug(`${LOG_PREFIX} save result`, json);
      return json;
    }
  
    /**
     * Trigger browser download for the generated CSV.
     * @param {string} filename
     * @param {string} csvText
     */
    function triggerBrowserDownload(filename, csvText) {
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const urlObject = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlObject;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(urlObject);
      }, 0);
    }
  
    /**
     * CSV line with proper quoting.
     * @param {string[]} values
     * @returns {string}
     */
    function csvLine(values) {
      return values.map(v => csvEscape(v)).join(',');
    }
  
    function csvEscape(v) {
      if (v == null) v = '';
      v = String(v);
      // Quote if contains quotes, comma, newline
      if (/[",\n]/.test(v)) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    }
  
    /**
     * Create a filename like: CTMT_customer_20250811_1930.csv
     * @param {string} recordType
     * @returns {string}
     */
    function makeFileName(recordType) {
      const pad = (n) => (n < 10 ? '0' + n : '' + n);
      const d = new Date();
      const stamp = [
        d.getFullYear(),
        pad(d.getMonth() + 1),
        pad(d.getDate())
      ].join('') + '_' + pad(d.getHours()) + pad(d.getMinutes());
      return `CTMT_${recordType}_${stamp}.csv`;
    }
  
    /**
     * Update Redwood progress step visual state.
     * @param {'collect'|'analyze'|'create'|'save'} step
     * @param {'is-active'|'is-complete'|'is-error'} state
     */
    function setStepState(step, state) {
      const id = STEP_IDS[step];
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
  
      // Remove all states and set the requested one
      el.classList.remove('is-active', 'is-complete', 'is-error');
      el.classList.add(state);
    }
  
    /**
     * Infer which step is currently active, to mark error appropriately.
     * @returns {'collect'|'analyze'|'create'|'save'|null}
     */
    function inferActiveStep() {
      for (const k of Object.keys(STEP_IDS)) {
        const el = document.getElementById(STEP_IDS[k]);
        if (el && el.classList.contains('is-active')) return /** @type any */(k);
      }
      return null;
    }
  
    /** Lightweight log helpers (avoid hard failures in client context) */
    function logDebug(title, details) {
      try { console && console.log && console.log(title, details || ''); } catch (_e) {}
    }
    function logError(title, details) {
      try { console && console.error && console.error(title, details || ''); } catch (_e) {}
    }
  
    async function showError(message) {
      try {
        await dialog.alert({ title: 'Catalog Template Factory', message: String(message || 'Unexpected error.') });
      } catch (_e) {
        alert(`Catalog Template Factory\n\n${String(message || 'Unexpected error.')}`);
      }
    }

    
  
    // Public exports — NetSuite calls CTMT_generateTemplate from the UE button
    return {
      pageInit,
      CTMT_generateTemplate
    };
  });
  