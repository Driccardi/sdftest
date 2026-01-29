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
 * @NScriptType Suitelet
 * @NModuleScope Public
 *
 * File: ns_SU_CTMT_export.js
 * Project: Catalog Template Factory (CTMT)
 *
 * Responsibilities:
 *  - GET mode=meta&rectype={type}:
 *      Returns metadata (JSON) for a given record type using REST `metadata-catalog`
 *      with Token-Based Authentication (TBA). Optional caching to reduce chattiness.
 *  - POST mode=save&rectype={type}&filename={name}:
 *      Saves posted CSV text to File Cabinet and returns { fileId, fileUrl }.
 *  - GET download=1&fileId={id}:
 *      Streams a CSV file back to the browser as an attachment.
 */

define(['N/runtime', 'N/https', 'N/url', 'N/file', 'N/cache'], (
    runtime,
    https,
    url,
    file,
    cache
  ) => {
    const LOG_PREFIX = 'CTMT-SU';
  
    // ---- Script Parameter IDs (configure in deployment) ----
    const PARAMS = {
      FOLDER_ID:        'custscript_ctmt_folder',        // default save folder (numeric)
      OAUTH_CK:         'custscript_ctmt_oauth_ck',
      OAUTH_CS:         'custscript_ctmt_oauth_cs',
      OAUTH_TK:         'custscript_ctmt_oauth_tk',
      OAUTH_TS:         'custscript_ctmt_oauth_ts',
      META_ACCEPT:      'custscript_ctmt_meta_accept',    // default: application/schema+json
      META_TTL_MINUTES: 'custscript_ctmt_meta_ttl'        // integer minutes (e.g., 120)
    };
  
    /**
     * Suitelet entry point.
     * @param {Object} context
     * @param {ServerRequest} context.request
     * @param {ServerResponse} context.response
     */
    const onRequest = (context) => {
      try {
        const { request, response } = context;
  
        if (request.method === 'GET') {
          const { mode, rectype, download, fileId } = request.parameters || {};
  
          if (String(download) === '1' && fileId) {
            return streamFile(response, Number(fileId));
          }
  
          if (mode === 'meta' || mode === 'schema') {
            if (!rectype) return sendJson(response, 400, { error: 'Missing rectype' });
            const json = getMetadata(rectype,mode);
            return sendJson(response, 200, json);
          }
  
          // Default GET response
          return sendJson(response, 200, { ok: true, message: 'CTMT Suitelet ready' });
        }
  
        if (request.method === 'POST') {
            const { mode, rectype, filename } = request.parameters || {};
          
            if (mode === 'save') {
              if (!filename) return sendJson(context.response, 400, { error: 'Missing filename' });
          
              const bodyText = request.body || '';
              let result;
          
              if (/\.csv$/i.test(filename)) {
                // Save as CSV
                result = saveCsvToFileCabinet(filename, bodyText, rectype);
                return sendJson(context.response, 200, result);
              }
          
              if (/\.json$/i.test(filename)) {
                // Save as JSON (string or object both supported by helper)
                result = saveJSONToFileCabinet(filename, bodyText, rectype);
                return sendJson(context.response, 200, result);
              }
          
              return sendJson(context.response, 400, {
                error: `Unsupported file extension for filename "${filename}". Use .csv or .json.`
              });
            }
          
            return sendJson(context.response, 400, { error: `Unsupported POST mode: ${mode || ''}` });
          }
  
        return sendJson(context.response, 405, { error: `Unsupported method: ${request.method}` });
      } catch (e) {
        logError('onRequest error', e);
        return safeSend(context.response, 500, 'application/json', JSON.stringify({ error: toMessage(e) }));
      }
    };
  
    /**
     * Fetch record metadata via REST metadata-catalog with TBA.
     * Applies optional caching by record type.
     * @param {string} recordType
     * @returns {Object}
     */
    function getMetadata(recordType,mode = 'meta') {
      const ttlMin = getIntParam(PARAMS.META_TTL_MINUTES, 120);
      const cacheKey = `ctmt_meta_${recordType}`;
      let cached = null;
  
      if (ttlMin > 0) {
        try {
          const c = cache.getCache({ name: 'ctmt_meta_cache', scope: cache.Scope.PUBLIC });
          cached = c.get({
            key: cacheKey,
            loader: () => {
                let payload = {};
                switch (mode) {
                case 'meta':   payload = callMetadataCatalog(recordType); break;
                case 'schema': payload = getSchemaData(recordType); break;
                default:
                    throw new Error(`Unsupported mode: ${mode}`);
                }

                // Attempt to read from cache
                const cachedData = c.get({ key: cacheKey });
              
                
                if(!payload || Object.keys(payload).length === 0) {
                 // throw new Error(`No metadata found for record type: ${recordType} with getSchemaData`);
                 //backup to REST call
                 payload = callMetadataCatalog(recordType);
                }
                saveJSONToFileCabinet(`ctmt_meta_${recordType}.json`, payload, recordType);
                return JSON.stringify(payload || {});
            }
          });
          return JSON.parse(cached || '{}');
        } catch (e) {
          logDebug('cache read error (continuing without cache)', e);
          return e;
          // fall through
        }
      }
  
      // No cache or cache disabled
      return callMetadataCatalog(recordType);
    }
  
    /**
 * Perform the REST call to /services/rest/record/v1/metadata-catalog/{type}
 * using N/https.requestSuiteTalkRest() (auth & domain handled by the platform).
 * @param {string} recordType
 * @returns {Object}
 */
function callMetadataCatalog(recordType) {
    const accept = getTextParam(PARAMS.META_ACCEPT, 'application/swagger+json');
    log.debug({ title: `${LOG_PREFIX} fetching metadata`, details: `recordType=${recordType}, accept=${accept}` });
    // NOTE: requestSuiteTalkRest() expects a path RELATIVE to /services/rest
    const path = `/services/rest/record/v1/metadata-catalog/${encodeURIComponent(recordType)}`;
  
    let res;
    try {
      res = https.requestSuiteTalkRest({
        method: https.Method.GET,
        url: path,
        headers: [
            {name : 'Accept', value: accept},
            {name: 'Content-Type', value: accept},
            {name: 'accept', value: accept},
            {'Accept': accept},
            
        ]
        
      });
    } catch (e) {
      throw new Error(`requestSuiteTalkRest failed: ${toMessage(e)}`);
    }
  
    if (res.code < 200 || res.code >= 300) {
      throw new Error(`metadata-catalog HTTP ${res.code} – ${truncate(res.body, 300)}`);
    }
  
    try {
      return JSON.parse(res.body || '{}');
    } catch (_e) {
      throw new Error('Unexpected response format from metadata-catalog');
    }
  }

    function getSchemaData(recordType) {
        const domain = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        const rcEndpoint = '/app/recordscatalog/rcendpoint.nl';
        const action = 'getRecordTypeDetail';
	    let data = encodeURI( JSON.stringify( { scriptId: recordType, detailType: 'SS_ANAL' } ) );
	    let fullUrlString = 'https://' + domain + rcEndpoint + '?action=' + action + '&data=' + data;
        log.debug('getMetaData', `Requesting metadata for ${recordType} from ${fullUrlString}`);
        const res = https.get({ url: fullUrlString });
  
        if (res.code < 200 || res.code >= 300) {
          throw new Error(`getMetaData HTTP ${res.code} – ${truncate(res.body, 300)}`);
          return {};
        }
        try {
          const json = JSON.parse(res.body || '{}');    
            log.debug('getMetaData', `Received metadata for ${recordType}`);
            return json;
        } catch (e) {
            log.error('getMetaData', `Error parsing metadata for ${recordType}: ${e.message}`);
            return {};
        }
    }
  
    /**
     * Save CSV text to the File Cabinet.
     * @param {string} filename
     * @param {string} csvText
     * @param {string} recordType
     * @returns {{fileId:number, fileUrl:string, filename:string, folderId:number, recordType?:string}}
     */
    function saveCsvToFileCabinet(filename, csvText, recordType) {
      const folderId = getIntParam(PARAMS.FOLDER_ID, null);
      const csvFile = file.create({
        name: filename,
        fileType: file.Type.CSV,
        contents: csvText
      });
  
      if (folderId) csvFile.folder = folderId;
  
      const fileId = csvFile.save();
      const saved = file.load({ id: fileId }); // to get URL
  
      return {
        fileId,
        fileUrl: saved.url || '',
        filename,
        folderId: folderId || 0,
        recordType
      };
    }

    /**
 * Save JSON to the File Cabinet.
 * @param {string} filename             - Base filename; ".json" appended if missing.
 * @param {Object|string} jsonPayload   - JS object or JSON string.
 * @param {string} [recordType]
 * @returns {{fileId:number, fileUrl:string, filename:string, folderId:number, recordType?:string}}
 */
function saveJSONToFileCabinet(filename, jsonPayload, recordType) {
    const folderId = getIntParam(PARAMS.FOLDER_ID, null);
  
    // Ensure filename ends with .json
    if (!/\.json$/i.test(filename)) {
      filename += '.json';
    }
  
    // Normalize payload to a JSON string; pretty-print for readability
    let jsonText = '';
    try {
      jsonText = (typeof jsonPayload === 'string')
        ? jsonPayload
        : JSON.stringify(jsonPayload || {}, null, 2);
    } catch (e) {
      throw new Error(`Invalid JSON payload: ${toMessage(e)}`);
    }
  
    const jsonFile = file.create({
      name: filename,
      fileType: file.Type.PLAINTEXT,     // No explicit JSON type; PLAINTEXT with .json extension
      contents: jsonText,
      encoding: file.Encoding.UTF8
    });
  
    if (folderId) jsonFile.folder = folderId;
  
    const fileId = jsonFile.save();
    const saved = file.load({ id: fileId }); // to get URL
  
    return {
      fileId,
      fileUrl: saved.url || '',
      filename,
      folderId: folderId || 0,
      recordType
    };
  }
  
    /**
     * Stream an existing CSV file as an attachment to the browser.
     * @param {ServerResponse} response
     * @param {number} fileId
     */
    function streamFile(response, fileId) {
      const f = file.load({ id: fileId });
      response.addHeader({
        name: 'Content-Type',
        value: 'text/csv; charset=utf-8'
      });
      response.addHeader({
        name: 'Content-Disposition',
        value: `attachment; filename="${f.name}"`
      });
      response.write(f.getContents());
    }
  
    // -------------------- Helpers --------------------
  
    function sendJson(response, status, obj) {
      return safeSend(response, status, 'application/json', JSON.stringify(obj || {}));
    }
  
    function safeSend(response, status, contentType, body) {
      try {
        response.addHeader({ name: 'Content-Type', value: contentType });
        //response.setStatus({ code: status });
        response.write(body || '');
      } catch (e) {
        logError('safeSend error', e);
      }
    }
  
    function getIntParam(id, fallback) {
      const v = runtime.getCurrentScript().getParameter({ name: id });
      if (v === null || v === '' || typeof v === 'undefined') return fallback;
      const n = parseInt(String(v), 10);
      return isNaN(n) ? fallback : n;
    }
  
    function getTextParam(id, fallback) {
      const v = runtime.getCurrentScript().getParameter({ name: id });
      if (v === null || typeof v === 'undefined' || v === '') return fallback;
      return String(v);
    }
  
    function validateOauth(oauth) {
      const missing = [];
      ['consumerKey', 'consumerSecret', 'token', 'tokenSecret'].forEach((k) => {
        if (!oauth[k]) missing.push(k);
      });
      if (missing.length) {
        throw new Error(`Missing OAuth parameters: ${missing.join(', ')}`);
      }
    }
  
    function toMessage(e) {
      return (e && (e.message || e.name)) ? `${e.name || 'Error'}: ${e.message}` : String(e);
    }
  
    function truncate(s, n) {
      if (!s) return '';
      s = String(s);
      return s.length > n ? s.slice(0, n) + '…' : s;
    }
  
    function logDebug(title, details) {
      try { log.debug({ title: `${LOG_PREFIX} ${title}`, details }); } catch (_e) {}
    }
  
    function logError(title, details) {
      try { log.error({ title: `${LOG_PREFIX} ${title}`, details }); } catch (_e) {}
    }
  
    return { onRequest };
  });
  