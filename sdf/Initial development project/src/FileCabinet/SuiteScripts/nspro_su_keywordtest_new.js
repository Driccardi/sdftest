/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/url', 'N/file', 'N/query','N/encode','./nspro_lib_recordtypes','./nspro_ct_openaisf'], (
  serverWidget,
  search,
  log,
  urlMod,
  fileMod,
  query,
  encode,
  recordTypes,
  openAiSearchFetch
) => {
  const KEYWORD_FIELD_ID = 'custpage_keyword';
  const SUBLIST_ID = 'custpage_results';
  const MAX_LINES = 100; // cap for static LIST sublist
  const MAX_TEXT_LEN = 6000; // allow generous JSON strings in textarea
  const CACHE_NAME = 'customrecordtype_map';
  const CACHE_KEY  = 'v1_all_types'; // bump this if schema/logic changes
  const CACHE_TTL  = 60 * 60;        // seconds (1 hour). Adjust as needed.

  const toSafeText = (val) => {
    const s = val == null ? '' : String(val);
    return s.length > MAX_TEXT_LEN ? s.substring(0, MAX_TEXT_LEN) : s;
  };

  function addForm(request) {
    const form = serverWidget.createForm({ title: 'Global Search Tester' });

    const keywordField = form.addField({
      id: KEYWORD_FIELD_ID,
      type: serverWidget.FieldType.TEXT,
      label: 'Keyword'
    });
    keywordField.isMandatory = true;

    if (request && request.parameters && request.parameters[KEYWORD_FIELD_ID]) {
      keywordField.defaultValue = request.parameters[KEYWORD_FIELD_ID];
    }

    form.addSubmitButton({ label: 'Search' });
    return form;
  }
    function base64Encode(input) {
    if (!input) return '';
    return encode.convert({
      string: input,
      inputEncoding: encode.Encoding.UTF_8,
      outputEncoding: encode.Encoding.BASE_64
    });
  }
    function base64Decode(base64Str) {
    if (!base64Str) return '';
    return encode.convert({
      string: base64Str,
      inputEncoding: encode.Encoding.BASE_64,
      outputEncoding: encode.Encoding.UTF_8
    });
  }

  function addResultsSublist(form) {
    const sublist = form.addSublist({
      id: SUBLIST_ID,
      type: serverWidget.SublistType.LIST,
      label: 'Search Results'
    });

    // Keep your quick columns
    sublist.addField({ id: 'custpage_name', type: serverWidget.FieldType.TEXT, label: 'Name' });
    sublist.addField({ id: 'custpage_type', type: serverWidget.FieldType.TEXT, label: 'Type' });
    sublist.addField({ id: 'custpage_info1', type: serverWidget.FieldType.TEXT, label: 'Info 1' });
    sublist.addField({ id: 'custpage_info2', type: serverWidget.FieldType.TEXT, label: 'Info 2' });

    // Add two new JSON views
    sublist.addField({
      id: 'custpage_rawjson',
      type: serverWidget.FieldType.TEXTAREA,
      label: 'Raw Result (JSON)'
    });

    sublist.addField({
      id: 'custpage_tooljson',
      type: serverWidget.FieldType.TEXTAREA,
      label: 'MCP Tool Output (JSON)'
    });

    return sublist;
  }

  /**
   * Title-case a record type id like "sales_order" or "vendor" -> "Sales Order" / "Vendor"
   */
  function friendlyRecordTypeName(scriptId) {
    if (!scriptId) return '(Unknown Type)';
    return scriptId
      .toString()
      .replace(/^_+|_+$/g, '')
      .split('_')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * For custom record types, fetch the display name from customrecordtype
   */
  function getCustomRecordTypeName(scriptId) {
    try {
        return recordTypes.getCustomRecordTypeName(scriptId);
    } catch (e) {
      log.debug('Custom Record Type name lookup failed', { scriptId, err: e.message });
    }
    return null;
  }

  /**
   * Build { id, title, url } per your rules, or return null if we’re ignoring this result.
   */
  function buildToolItem(r,values) {
    if (!r) return null;
    const baseDomain = urlMod.resolveDomain({
      hostType: urlMod.HostType.APPLICATION
    });
    // Global Search results may arrive in a couple shapes:
    // - { recordType, id, values: { name, type, info1, info2 } }
    // - { id, type/name on root } ...etc.
    const labelType = (values.type || r.type || '').toString().toLowerCase(); // human label like "Search", "Page", "CSV File"
    const recordTypeId = (r.recordType || '').toString().toLowerCase();       // scriptId for records, "file" for files
    const idStr = (r.id);

    // Ignore Search & Page hits for the tool output
    if (labelType === 'search' || labelType === 'page') {
      return null;
    }

    // FILES
    if (recordTypeId === 'file' || labelType.indexOf('file') !== -1) {
      try {
        const f = fileMod.load({ id: idStr });
        const fileName = values.name || r.name || '(no name)';
        const typeLabel = values.type || r.type || 'File';
        const title = `${typeLabel} - ${fileName}`;
        const url = baseDomain + f.url || '';
        return {
          id: base64Encode(`file|file|${idStr}`),
          title,
          url
        };
      } catch (e) {
        log.debug('File load failed for tool output', { id: idStr, err: e.message });
        return null;
      }
    }

    // RECORDS (Core & Custom)
    if (recordTypeId && idStr) {
      const recordName = values.name || r.name || '(no name)';

      // Determine display type name
      let typeDisplay;
      if (/^customrecord/.test(recordTypeId)) {
        // Look up custom record type name
        const customName = getCustomRecordTypeName(recordTypeId);
        typeDisplay = customName || friendlyRecordTypeName(recordTypeId);
      } else {
        typeDisplay = friendlyRecordTypeName(recordTypeId);
      }

      // Build URL to the record's view
      let recUrl = '';
      try {
        recUrl = urlMod.resolveRecord({
          recordType: recordTypeId, // NetSuite accepts string scriptId for custom; standard ids also work
          recordId: idStr,
          isEditMode: false
        });
      } catch (e) {
        log.debug('resolveRecord failed', { recordTypeId, idStr, err: e.message });
      }

      return {
        id: base64Encode(`record|${recordTypeId}|${idStr}`),
        title: `${typeDisplay} - ${recordName}`,
        url: baseDomain + recUrl || ''
      };
    }

    // If we can't classify, skip tool output
    return null;
  }

  function onRequest(context) {
    const request = context.request;
    const isGet = request.method === 'GET';

    const form = addForm(request);

    if (isGet) {
      context.response.writePage(form);
      return;
    }

    // POST
    const keyword = (request.parameters[KEYWORD_FIELD_ID] || '').trim();
    form.addField({
          id: 'custpage_response',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Response'
        }).defaultValue = JSON.stringify(openAiSearchFetch.search({query: keyword}));

   /*  const sublist = addResultsSublist(form);

    if (!keyword) {
      context.response.writePage(form);
      return;
    }

    let results = [];
    try {
      results = search.global({ keywords: keyword }) || [];
    } catch (e) {
      log.error('Global search failed', e);
      results = [];
    }

    const total = results.length;
    const slice = results.slice(0, MAX_LINES);
    try{
    slice.forEach((r, i) => {
      // Normalize quick columns
      const values = r.values || {};
      const columns = r.columns || [];
      //log.debug('Processing Result (values)', values);
      //log.debug('Processing Result (root)', r);
      //log.debug('Processing Result (id)', r.getValue('name'));
      //log.debug('columns', r.columns);
      var colMap = {};
        columns.forEach((col) => {
            colMap[col.name] = r.getValue(col);
        });
      //log.debug('colMap', colMap);
      const name = toSafeText(colMap.name || values.name || r.name || '(no name)');
      const type = toSafeText(colMap.type || values.type || r.type || r.recordType || '(no type)');
      const info1 = toSafeText(colMap.info1 || values.info1 || r.info1 || '(no info1)');
      const info2 = toSafeText(colMap.info2 || values.info2 || r.info2 || '(no info2)');


      // Build the tool output (or null if ignored)
      const toolObj = buildToolItem(r, colMap);

      // Always set columns to create the line
      sublist.setSublistValue({ id: 'custpage_name', line: i, value: name });
      sublist.setSublistValue({ id: 'custpage_type', line: i, value: type });
      sublist.setSublistValue({ id: 'custpage_info1', line: i, value: info1 });
      sublist.setSublistValue({ id: 'custpage_info2', line: i, value: info2 });

      // JSON columns
      const rawStr = toSafeText(JSON.stringify(r));
      sublist.setSublistValue({ id: 'custpage_rawjson', line: i, value: rawStr });

      const toolStr = toolObj ? JSON.stringify(toolObj) : '';
      sublist.setSublistValue({
        id: 'custpage_tooljson',
        line: i,
        value: toSafeText(toolStr)
      });

      log.debug('Global Search Result', rawStr);
      if (toolObj) log.debug('MCP Tool Output', toolStr);
    });

    if (total > slice.length) {
      const note = form.addField({
        id: 'custpage_note',
        type: serverWidget.FieldType.INLINEHTML,
        label: 'Note'
      });
      note.defaultValue =
        '<div style="color:#6B6B6B;margin-top:8px;">' +
        'Showing ' +
        slice.length +
        ' of ' +
        total +
        ' results (truncated).</div>';
    }
    } catch (e) {
        log.error('Error processing results for sublist', e);
        form.addField({
          id: 'custpage_error',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Error'
        }).defaultValue =
          '<div style="color:red;margin-top:8px;">' +
          `An error occurred while processing results.<code>${JSON.stringify(e)}</code></div>`;
    } */

    context.response.writePage(form);
  }

  return { onRequest };
});
