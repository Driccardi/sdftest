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
*  1.00            2025-08-11          riccardi             MR export w/ subset, REST auto-auth, robust logging
*
*/

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define(['N/runtime', 'N/https', 'N/file', 'N/log'],
    (runtime, https, file, log) => {
      const LOGP = 'RCAT-MR';
      const PARAM_FOLDERID  = 'custscript_rcat_folderid';   // required
      const PARAM_FILENAME  = 'custscript_rcat_filename';   // optional, consolidated
      const PARAM_RECORDS   = 'custscript_rcat_records';    // optional, CSV subset
  
      // ────────────────────────────────────────────────────────────────────────────────
      // Utilities
      // ────────────────────────────────────────────────────────────────────────────────
      const trunc = (s, max = 600) => (s ? (String(s).length > max ? String(s).slice(0, max) + '… [truncated]' : String(s)) : '');
  
      function sanitizeFileName(name) {
        return String(name || 'record')
          .toLowerCase()
          .replace(/[^a-z0-9_.-]+/g, '_')
          .replace(/^_+|_+$/g, '') || 'record';
      }
  
      function saveJsonFile(folderId, name, contents, desc) {
        try {
          const f = file.create({ name, fileType: file.Type.JSON, contents, folder: folderId, description: desc || '' });
          return f.save();
        } catch (e) {
          // Fallback for accounts that don't expose JSON type
          const f = file.create({ name, fileType: file.Type.PLAINTEXT, contents, folder: folderId, description: desc || '' });
          return f.save();
        }
      }
  
      /**
       * Authenticated SuiteTalk REST GET with retries + detailed debug logs.
       * IMPORTANT: requestSuiteTalkRest requires options.url (relative path OK).
       * Explicit guard for FEATURE_DISABLED / permission issues.
       */
      function restGet(urlPath, acceptOrHeaders) {
        const MAX_RETRIES = 3;
        let lastErr;
      
        // Build headers: we accept either a string (Accept) or a headers object.
        const buildHeaders = (h) => {
          if (!h) return {};
          if (typeof h === 'string') return { name:'accept', value: h, name: 'Accept', value: h };
          if (typeof h === 'object') return h;
          if(typeof h === 'array')  return h;
          return {};
        };
      
        const reqHeaders = buildHeaders(acceptOrHeaders);
        log.debug(`${LOGP}:HTTP`, `GET ${urlPath} with headers: ${JSON.stringify(reqHeaders)}`);
      
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            // log the request Accept we’re sending
            log.debug(`${LOGP}:HTTP`, `GET ${urlPath} [attempt ${attempt}] (Headers = ${reqHeaders})`);
      
            const resp = https.requestSuiteTalkRest({
              method: https.Method.GET,
              url: urlPath,
              headers: reqHeaders
            });
      
            log.debug(
              `${LOGP}:HTTP`,
              `GET ${urlPath} → ${resp.code}\nResp Headers: ${JSON.stringify(resp.headers || {})}\nBody: ${trunc(resp.body)}`
            );
            log.debug('Body', `Resp body: ${resp.body}`);
      
            // 403 diagnostics (feature/permission)
            if (resp.code === 403 && resp.body) {
              try {
                const errJson = JSON.parse(resp.body);
                const details = Array.isArray(errJson['o:errorDetails']) ? errJson['o:errorDetails'] : [];
                const featureDisabled = details.some(d => d && d['o:errorCode'] === 'FEATURE_DISABLED');
                const permissionDenied = details.some(d => d && ((d['o:errorCode'] || '').includes('PERMISSION') || /permission/i.test(String(d.detail || ''))));
                if (featureDisabled) {
                  throw new Error("REST Web Services feature is disabled. Enable it at Setup > Company > Enable Features > SuiteCloud > 'REST Web Services'.");
                }
                if (permissionDenied) {
                  throw new Error("Executing role lacks REST Web Services permission. Add 'REST Web Services' permission or run as a role with access.");
                }
              } catch (_) { /* ignore */ }
            }
      
            if (resp.code >= 200 && resp.code < 300) {
              return resp.body ? JSON.parse(resp.body) : {};
            }
      
            // Retry on 429/5xx
            if (resp.code === 429 || (resp.code >= 500 && resp.code <= 599)) {
              lastErr = new Error(`Retryable HTTP ${resp.code} for ${urlPath}`);
              continue;
            }
      
            // Non-retryable
            throw new Error(`HTTP ${resp.code} for ${urlPath}: ${trunc(resp.body, 800)}`);
      
          } catch (e) {
            lastErr = e;
            log.error(`${LOGP}:HTTP_ERR`, `GET ${urlPath} failed (attempt ${attempt}): ${e.message}`);
            if (/feature is disabled|permission/i.test(String(e.message))) break; // don’t spin on hard blocks
          }
        }
        throw lastErr || new Error(`Unknown error requesting ${urlPath}`);
      }
  
      /** Choose the detail href from a catalog item (prefer canonical JSON). */
      function pickDetailHref(item) {
        const links = item && item.links ? item.links : [];
        if (!links.length) return null;
        const canonicalJson = links.find(l => l.rel === 'canonical' && (!l.mediaType || (l.mediaType + '').includes('json')));
        const anyCanonical  = links.find(l => l.rel === 'canonical');
        const first         = links[0];
        const href = (canonicalJson && canonicalJson.href) || (anyCanonical && anyCanonical.href) || (first && first.href) || null;
        return href && href.startsWith('/') ? href : href || null; // relative or absolute accepted
      }
  
      /** Split & normalize CSV list into distinct record names (scriptIds). */
      function parseRecordCsv(csv) {
        if (!csv) return [];
        return csv
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => s.replace(/\s+/g, ''))           // remove spaces within
          .filter((v, i, a) => a.indexOf(v) === i);  // distinct
      }
  
      // ────────────────────────────────────────────────────────────────────────────────
      // Map/Reduce
      // ────────────────────────────────────────────────────────────────────────────────
      const getInputData = () => ['SEED'];
  
      /**
       * MAP:
       * - Validate parameters.
       * - If subset CSV is provided, emit those records directly (href = `/record/v1/metadata-catalog/{name}`) and save a subset list file.
       * - Else, GET `/record/v1/metadata-catalog`, save 'recordtypes.json', fan-out all items (key=name/id, value=href).
       */
      const map = (context) => {
        const script   = runtime.getCurrentScript();
        const folderId = parseInt(script.getParameter({ name: PARAM_FOLDERID }), 10);
        if (!folderId || Number.isNaN(folderId) || folderId <= 0) {
          throw new Error('Folder ID parameter (custscript_rcat_folderid) is required and must be a positive integer.');
        }
  
        const csvParam = script.getParameter({ name: PARAM_RECORDS }) || '';
        const subset   = parseRecordCsv(csvParam);
  
        if (subset.length > 0) {
          log.audit(`${LOGP}:MAP`, `Subset mode: ${subset.length} record(s) from custscript_rcat_records.`);
          // Persist the requested subset list for traceability
          try {
            const fid = saveJsonFile(
              folderId,
              'recordtypes_subset.json',
              JSON.stringify(subset, null, 2),
              `Requested subset list saved ${new Date().toISOString()}`
            );
            log.audit(`${LOGP}:MAP`, `Saved recordtypes_subset.json (File ID ${fid})`);
          } catch (e) {
            log.error(`${LOGP}:MAP`, `Failed saving subset list: ${e.message}`);
          }
  
          // Emit each requested record; build its detail URL directly
          let emitted = 0;
          subset.forEach((name) => {
            const key  = sanitizeFileName(name);
            const href = `/record/v1/metadata-catalog/${encodeURIComponent(name)}`;
            context.write({ key, value: href });
            emitted++;
          });
          log.audit(`${LOGP}:MAP`, `Emitted ${emitted} subset records to Reduce.`);
          return;
        }
  
        // Full catalog mode
        const catalogUrl = '/record/v1/metadata-catalog';
        log.audit(`${LOGP}:MAP`, `Fetching catalog: ${catalogUrl}`);
  
        // old:
        // const catalog = restGet('/record/v1/metadata-catalog');

        // new:
        const catalog = restGet('/record/v1/metadata-catalog', '');

        const items   = Array.isArray(catalog.items) ? catalog.items : [];
        log.audit(`${LOGP}:MAP`, `Catalog contains ${items.length} items`);
  
        // Save the discovered list
        try {
          const listFileId = saveJsonFile(
            folderId,
            'recordtypes.json',
            JSON.stringify(items, null, 2),
            `Records Catalog items saved ${new Date().toISOString()}`
          );
          log.audit(`${LOGP}:MAP`, `Saved recordtypes.json (File ID ${listFileId})`);
        } catch (e) {
          log.error(`${LOGP}:MAP`, `Failed saving recordtypes.json: ${e.message}`);
        }
  
        // Fan out
        let emitted = 0;
        items.forEach((it, idx) => {
          const key  = sanitizeFileName(it.name || it.id || `record_${idx}`);
          const href = pickDetailHref(it);
          if (!href) {
            log.error(`${LOGP}:MAP`, `No detail link for ${key}; skipping`);
            return;
          }
          context.write({ key, value: href });
          emitted++;
        });
        log.audit(`${LOGP}:MAP`, `Emitted ${emitted} keys to Reduce`);
      };
  
      /**
       * REDUCE:
       * - For each recordName, GET its detail from the href (value).
       * - Save individual file `[recordname].json`.
       * - Emit (recordname → fileId) for summarize.
       */
      const reduce = (context) => {
        const script   = runtime.getCurrentScript();
        const folderId = parseInt(script.getParameter({ name: PARAM_FOLDERID }), 10);
        if (!folderId || Number.isNaN(folderId) || folderId <= 0) {
          throw new Error('Folder ID parameter (custscript_rcat_folderid) is required and must be a positive integer.');
        }
      
        const recordName = sanitizeFileName(context.key);
        const href       = (context.values && context.values.length) ? context.values[0] : null;
        if (!href) {
          log.error(`${LOGP}:REDUCE`, `Missing href for ${recordName}; skipping`);
          return;
        }
      
        // 1) Fetch the record’s "index" (name + links) — Accept must be application/json
        log.debug(`${LOGP}:REDUCE`, `Index GET for ${recordName} → ${href}`);
        let indexDoc;
        try {
          indexDoc = restGet(href, '');
        } catch (e) {
          log.error(`${LOGP}:REDUCE`, `Index GET failed for ${recordName}: ${e.message}`);
          return;
        }
      
        const links = Array.isArray(indexDoc && indexDoc.links) ? indexDoc.links : [];
        if (!links.length) {
          log.error(`${LOGP}:REDUCE`, `No links for ${recordName}; payload: ${JSON.stringify(indexDoc).slice(0,600)}…`);
          return;
        }
      
        // Optional: keep the index doc as well
        try {
          const idxId = saveJsonFile(
            folderId,
            `${recordName}.index.json`,
            JSON.stringify(indexDoc, null, 2),
            `Index (links) for ${recordName} generated ${new Date().toISOString()}`
          );
          context.write({ key: `${recordName}.index`, value: String(idxId) });
        } catch (e) {
          log.error(`${LOGP}:REDUCE`, `Failed to save ${recordName}.index.json: ${e.message}`);
        }
      
        // Helper to fetch-and-save a given link with a specific Accept
        const fetchAndSave = (link, accept, suffix) => {
          if (!link || !link.href) return null;
          try {
            const payload = restGet(link.href, [{name:'Accept',value:accept},{ name: 'accept', value: accept}]);
            const fname   = `${recordName}.${suffix}.json`;
            const fileId  = saveJsonFile(
              folderId,
              fname,
              JSON.stringify(payload, null, 2),
              `${suffix} representation for ${recordName} generated ${new Date().toISOString()}`
            );
            log.debug(`${LOGP}:REDUCE`, `Saved ${fname} (File ID ${fileId})`);
            context.write({ key: `${recordName}.${suffix}`, value: String(fileId) });
            return fileId;
          } catch (e) {
            log.error(`${LOGP}:REDUCE`, `[${suffix}] fetch failed for ${recordName} → ${link.href}: ${e.message}`);
            return null;
          }
        };

      
        // Select links
        const canonical = links.find(l => (l.rel || '').toLowerCase() === 'canonical');
        //const swagger   = links.find(l => (l.rel || '').toLowerCase() === 'alternate' && /swagger\+json/i.test(l.mediaType || ''));
        //const schemaAlt = links.find(l => (l.rel || '').toLowerCase() === 'alternate' && /schema\+json/i.test(l.mediaType || ''));
        //const describes = links.find(l => (l.rel || '').toLowerCase() === 'describes');
        var testurl = '/services/rest/record/v1/metadata-catalog'
        const swagger = {href: testurl + '?select=contact'};
        const schemaAlt = {href: testurl + '?select=contact'};
        const describes = {href: testurl + '?select=contact'};
        // 2) Fetch each flavor with an exact Accept
        fetchAndSave(canonical, 'application/json',          'canonical');
        fetchAndSave(swagger,   'application/swagger+json',  'swagger');
        fetchAndSave(schemaAlt, 'application/schema+json',   'alternate');
        fetchAndSave(describes, (describes && describes.mediaType) || 'application/schema+json', 'describes');
      };
      
  
      /**
       * SUMMARIZE:
       * - Collect file IDs emitted from reduce.
       * - Load / parse each JSON; push into array.
       * - Save consolidated JSON using `custscript_rcat_filename` (default 'records_schema.json').
       * - Log errors from each phase.
       */
      const summarize = (summary) => {
        const script        = runtime.getCurrentScript();
        const folderId      = parseInt(script.getParameter({ name: PARAM_FOLDERID }), 10);
        const outputNameRaw = script.getParameter({ name: PARAM_FILENAME }) || 'records_schema.json';
        const outputName    = sanitizeFileName(outputNameRaw);
  
        const consolidated = [];
        const fileIds      = [];
  
        try {
          if (summary.reduceSummary && summary.reduceSummary.output) {
            summary.reduceSummary.output.iterator().each((key, value) => {
              const id = parseInt(value, 10);
              if (!Number.isNaN(id)) fileIds.push(id);
              return true;
            });
          } else {
            log.audit(`${LOGP}:SUM`, `No reduce output available (zero records emitted or earlier error).`);
          }
        } catch (e) {
          log.error(`${LOGP}:SUM`, `Unable to iterate reduce output: ${e.message}`);
        }
  
        log.audit(`${LOGP}:SUM`, `Combining ${fileIds.length} files into ${outputName}`);
  
        for (let i = 0; i < fileIds.length; i++) {
          const fid = fileIds[i];
          try {
            const f = file.load({ id: fid });
            const txt = f.getContents();
            const obj = JSON.parse(txt);
            consolidated.push(obj);
          } catch (e) {
            log.error(`${LOGP}:SUM`, `Failed to load/parse file ${fid}: ${e.message}`);
          }
        }
  
        try {
          const finalId = saveJsonFile(
            folderId,
            outputName,
            JSON.stringify(consolidated, null, 2),
            `Consolidated Records Catalog schema generated ${new Date().toISOString()}`
          );
          log.audit(`${LOGP}:SUM`, `Consolidated schema saved (File ID ${finalId})`);
        } catch (e) {
          log.error(`${LOGP}:SUM`, `Failed to save consolidated file: ${e.message}`);
        }
  
        if (summary.inputSummary && summary.inputSummary.error) {
          log.error(`${LOGP}:SUM`, `Input error: ${summary.inputSummary.error}`);
        }
        try {
          summary.mapSummary && summary.mapSummary.errors.iterator().each((k, e) => {
            log.error(`${LOGP}:MAP_ERR`, `${k}: ${e}`);
            return true;
          });
        } catch (e) {
          log.error(`${LOGP}:MAP_ERR`, `Iterating map errors: ${e.message}`);
        }
        try {
          summary.reduceSummary && summary.reduceSummary.errors.iterator().each((k, e) => {
            log.error(`${LOGP}:REDUCE_ERR`, `${k}: ${e}`);
            return true;
          });
        } catch (e) {
          log.error(`${LOGP}:REDUCE_ERR`, `Iterating reduce errors: ${e.message}`);
        }
  
        log.audit(`${LOGP}:SUM`, 'Done.');
      };
  
      return { getInputData, map, reduce, summarize };
    });
  