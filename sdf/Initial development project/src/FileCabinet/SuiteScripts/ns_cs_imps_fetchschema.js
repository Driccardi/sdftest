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
*  1.00            2025-09-23          riccardi             initial build: fetch schema → field; CSV helper; window hooks
*
*/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define([
    'N/currentRecord',
    'N/ui/dialog',
    'N/log',
    // Adjust the module path/id below to where you saved the library file:
    './ns_lib_mdmschema' // exposes getRecordSchema, getRecordSchemaSync
  ], function (currentRecord, dialog, log, mdm) {
    'use strict';
  
    const LPFX = 'CS:IMPS';
  
    /**
     * Page init — attach window functions and support mdmAction=fetchSchema auto-run.
     * (Fire-and-forget per your snippet; no await.)
     */
    function pageInit() {
      try {
        const params = new URLSearchParams(window.location.search || '');
        // Make the functions visible to the button click handler
        if (typeof window !== 'undefined') {
          window.fetchSchema = fetchSchema;
          window.getMetadata = fetchSchema;              // alias requested
          window.schemaToCSVmetadata = schemaToCSVmetadata;
        }
        if (params.get('mdmAction') === 'fetchSchema') {
          // fire and forget; no blocking
          fetchSchema();
        }
      } catch (e) {
        // no-op
      }
    }
  
    /**
     * Read the record script id from custrecord_ns_impspk_restenum (current record).
     * Returns a trimmed string or ''.
     */
    function readRecordScriptId() {
      try {
        const cr = currentRecord.get();
        const v = cr.getValue({ fieldId: 'custrecord_ns_impspk_restenum' });
        return (v == null) ? '' : String(v).trim();
      } catch (e) {
        return '';
      }
    }
  
    /**
     * Write text into custrecord_ns_impspk_schema.
     * Best-effort; alerts on failure.
     * @param {string} text
     */
    function writeSchemaField(text) {
      try {
        const cr = currentRecord.get();
        cr.setValue({ fieldId: 'custrecord_ns_impspk_schema', value: String(text || '') });
      } catch (e) {
        showError(`Failed to set schema field: ${e && e.message ? e.message : e}`);
      }
    }
  
    /**
     * Show an error via dialog.alert, falling back to window.alert.
     * @param {string} message
     */
    function showError(message) {
      try {
        dialog.alert({ title: 'Schema Fetch Error', message: String(message || 'Unknown error') });
      } catch (_ignore) {
        // Some contexts may not load N/ui/dialog; use plain alert
        try { window.alert(String(message || 'Unknown error')); } catch (_e) { /* no-op */ }
      }
    }
  
    /**
     * Fetch the NetSuite metadata schema for the record script id found in
     * custrecord_ns_impspk_restenum and write it to custrecord_ns_impspk_schema.
     *
     * Library note: the provided library expects an array in some code paths.
     * We pass [scriptId, scriptId.toUpperCase()] to satisfy both usages.
     *
     * Fire-and-forget safe: returns immediately; writes field when done.
     *
     * @example
     * // invoked from button:
     * window.fetchSchema();
     */
    async function fetchSchema() {
      const scriptId = readRecordScriptId();
      if (!scriptId) {
        showError('Please populate the Record Type (custrecord_ns_impspk_restenum) before fetching schema.');
        return;
      }
  
      // Immediately clear/placeholder to show activity
      writeSchemaField('{"status":"Fetching schema..."}');
  
      try {
        const res = await mdm.getRecordSchema([scriptId, scriptId.toUpperCase()], {
          // detailTypes optional: library defaults to ['SS_ANAL','DESC']
          // endpoint optional: library defaults to '/app/recordscatalog/rcendpoint.nl'
        });
  
        if (!res || !res.schema) {
          writeSchemaField('{"ok":false,"error":"No schema returned"}');
          showError('No schema was returned from the Records Catalog endpoint.');
          return;
        }
  
        const pretty = JSON.stringify(res.schema, null, 2);
        writeSchemaField(pretty);
        log.audit({ title: `${LPFX} schema fetched`, details: `${scriptId} fields=${(res.schema.fields||[]).length}` });
      } catch (e) {
        writeSchemaField(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }, null, 2));
        showError(e && e.message ? e.message : e);
      }
    }
  
    /**
     * Convert the JSON stored in custrecord_ns_impspk_schema into a CSV of field metadata.
     * If the field contains valid schema JSON, prompts the browser to download a CSV file.
     *
     * CSV Columns: scriptId,label,type,dataType,isList,selectRecordId,ssMandatory,ssType,ssSublistId,source
     *
     * @example
     * // invoked from button:
     * window.schemaToCSVmetadata();
     */
    function schemaToCSVmetadata() {
      try {
        const cr = currentRecord.get();
        const raw = cr.getValue({ fieldId: 'custrecord_ns_impspk_schema' }) || '';
        let schema;
        try {
          schema = JSON.parse(String(raw));
        } catch (e) {
          showError('Schema field does not contain valid JSON.');
          return;
        }
        const fields = Array.isArray(schema.fields) ? schema.fields : [];
        if (!fields.length) {
          showError('No fields found in schema.');
          return;
        }
  
        const cols = [
          'scriptId','label','type','dataType','isList','selectRecordId',
          'ssMandatory','ssType','ssSublistId','source'
        ];
  
        const lines = [cols.join(',')];
        for (const f of fields) {
          const row = [
            csv(f.scriptId),
            csv(f.label),
            csv(f.type),
            csv(f.dataType),
            csv(bool(f.isList)),
            csv(f.selectRecordId),
            csv(bool(f.ssMandatory)),
            csv(f.ssType),
            csv(f.ssSublistId),
            csv(f.source)
          ];
          lines.push(row.join(','));
        }
  
        const csvText = lines.join('\r\n');
        downloadText(csvText, 'schema_metadata.csv', 'text/csv');
      } catch (e) {
        showError(e && e.message ? e.message : e);
      }
    }
  
    // ---------- small client-side helpers ----------
  
    function csv(v) {
      const s = (v == null) ? '' : String(v);
      if (/[",\r\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }
  
    function bool(v) { return v ? 'true' : 'false'; }
  
    function downloadText(text, filename, mime) {
      try {
        const blob = new Blob([text], { type: mime || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download.txt';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      } catch (e) {
        // Fall back: just put the CSV into the field so user can copy
        writeSchemaField(text);
        showError('Download blocked by browser. CSV was written into the schema field instead.');
      }
    }
  
    return {
      pageInit: pageInit,
      // Exported for testing/invocation if needed
      fetchSchema: fetchSchema,
      schemaToCSVmetadata: schemaToCSVmetadata
    };
  });
  