/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * MCP Custom Tool for OpenAI Deep Research integration
 * Implements search and fetch tools per OpenAI MCP specification
 */
define(['N/search', 'N/file', 'N/url', 'N/record', 'N/query', 'N/encode', 'N/log','N/runtime','./nspro_lib_recordtypes'], 
  (search, file, urlMod, record, query, encode, log, runtime, recordTypes) => {
    const LOG_PREFIX = 'OPENAI_MCP';
    const MAX_SEARCH_RESULTS = 100;
    const MAX_TEXT_LENGTH = 50000; // 50k characters for file/record text
    const EXECUTION_TIMEOUT = 10000; // 10 seconds

    // ---- Utility Functions ----

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

    function getCustomRecordTypeName(scriptId) {
      try {
        return recordTypes.getCustomRecordTypeName(scriptId);
      } catch (e) {
        log.debug(`${LOG_PREFIX}:getCustomRecordTypeName`, { scriptId, err: e.message });
      }
      return null;
    }

    function getBaseDomain() {
      return urlMod.resolveDomain({
        hostType: urlMod.HostType.APPLICATION
      });
    }

    function truncateText(text, maxLength) {
      if (!text) return '';
      const str = String(text);
      return str.length > maxLength ? str.substring(0, maxLength) + '...[truncated]' : str;
    }

    // ---- Search Tool ----

    /**
     * Search NetSuite records using global search
     * Returns array of {id, title, url} objects
     */
    function search_tool(args) {
      const startTime = Date.now();
      try {
        if (!args.query || typeof args.query !== 'string') {
          throw new Error('Invalid call: missing query parameter');
        }

        const keyword = args.query.trim();
        if (!keyword) {
          throw new Error('Query parameter cannot be empty');
        }

        log.debug(`${LOG_PREFIX}:search`, { keyword });

        const results = search.global({ keywords: keyword });
        const baseDomain = getBaseDomain();
        const searchResults = [];
        let count = 0;

        results.forEach((r) => {
          if (count >= MAX_SEARCH_RESULTS) return false;
          if (Date.now() - startTime > EXECUTION_TIMEOUT) {
            throw new Error('Execution timeout exceeded');
          }

          const columns = r.columns || [];
          const colMap = {};
          columns.forEach((col) => {
            colMap[col.name] = r.getValue(col);
          });

          const name = colMap.name || r.name || '(no name)';
          const labelType = (colMap.type || r.type || '').toString().toLowerCase();
          const recordTypeId = (r.recordType || '').toString().toLowerCase();
          const idStr = r.id;

          // Skip search/page results
          if (labelType === 'search' || labelType === 'page') {
            return true;
          }

          let toolObj = null;

          // Handle FILES
          if (recordTypeId === 'file' || labelType.indexOf('file') !== -1) {
            try {
              const f = file.load({ id: idStr });
              const typeLabel = colMap.type || r.type || 'File';
              const title = `${typeLabel} - ${name}`;
              const url = baseDomain + (f.url || '');
              toolObj = {
                id: base64Encode(`file|file|${idStr}`),
                title: title,
                url: url
              };
            } catch (e) {
              log.debug(`${LOG_PREFIX}:search:fileLoadFailed`, { id: idStr, err: e.message });
            }
          }
          // Handle RECORDS
          else if (recordTypeId && idStr) {
            let typeDisplay;
            if (/^customrecord/.test(recordTypeId)) {
              const customName = getCustomRecordTypeName(recordTypeId);
              typeDisplay = customName || friendlyRecordTypeName(recordTypeId);
            } else {
              typeDisplay = friendlyRecordTypeName(recordTypeId);
            }

            let recUrl = '';
            try {
              recUrl = urlMod.resolveRecord({
                recordType: recordTypeId,
                recordId: idStr,
                isEditMode: false
              });
            } catch (e) {
              log.debug(`${LOG_PREFIX}:search:resolveRecordFailed`, { recordTypeId, idStr, err: e.message });
            }

            toolObj = {
              id: base64Encode(`record|${recordTypeId}|${idStr}`),
              title: `${typeDisplay} - ${name}`,
              url: baseDomain + (recUrl || '')
            };
          }

          if (toolObj) {
            searchResults.push(toolObj);
            count++;
          }

          return true;
        });

        log.audit(`${LOG_PREFIX}:search:Success`, { keyword, resultsCount: searchResults.length });

        return JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ results: searchResults }) }] });

      } catch (e) {
        log.error(`${LOG_PREFIX}:search:Error`, e.message);
        return JSON.stringify({
          success: false,
          content: null,
          error: e.message
        });
      }
    }

    // ---- Fetch Tool ----

    /**
     * Fetch detailed content for a specific record or file
     * Returns {id, title, text, url, metadata}
     */
    function fetch_tool(args) {
      const startTime = Date.now();
      try {
        if (!args.id || typeof args.id !== 'string') {
          throw new Error('Invalid call: missing id parameter');
        }

        const encodedId = args.id;
        const decodedId = base64Decode(encodedId);
        
        log.debug(`${LOG_PREFIX}:fetch`, { encodedId, decodedId });

        const parts = decodedId.split('|');
        if (parts.length !== 3) {
          throw new Error('Invalid id format: expected base64 encoded "type|recordType|internalId"');
        }

        const type = parts[0]; // 'file' or 'record'
        const recordTypeId = parts[1];
        const internalId = parts[2];

        const baseDomain = getBaseDomain();

        // Handle FILE fetch
        if (type === 'file') {
          const f = file.load({ id: internalId });
          const fileType = f.fileType;

          // Only allow text and CSV files
          const allowedTypes = [
            file.Type.PLAINTEXT,
            file.Type.CSV,
            file.Type.JAVASCRIPT,
            file.Type.JSON,
            file.Type.HTMLDOC,
            file.Type.XMLDOC
          ];

          if (allowedTypes.indexOf(fileType) === -1) {
            throw new Error(`Unsupported file type: ${fileType}. Only text-based files are supported.`);
          }

          const contents = f.getContents();
          const truncatedContents = truncateText(contents, MAX_TEXT_LENGTH);

          return {
            success: true,
            content: [{ 
                  type: 'text' , 
                  text: JSON.stringify( 
                      {   id: encodedId,
                          title: f.name,
                          text: truncatedContents,
                          url: baseDomain + (f.url || ''),
                        metadata: {
                          filesize: f.size,
                          filetype: fileType
                        }
                      }
                    )}]
                    };

        // Handle RECORD fetch
      } else if (type === 'record') {
          const rec = record.load({
            type: recordTypeId,
            id: internalId,
            isDynamic: false
          });

          // Get title from common name fields
          let title = '';
          const nameFields = ['name', 'tranid', 'entityid', 'companyname', 'altname'];
          for (const field of nameFields) {
            try {
              const val = rec.getValue({ fieldId: field });
              if (val) {
                title = String(val);
                break;
              }
            } catch (e) {
              // Field doesn't exist
            }
          }
          if (!title) title = `${recordTypeId} ${internalId}`;

          // Build comprehensive record data structure
          const recordData = {
            fields: [],
            sublists: {},
            subrecords: {}
          };

          // Get all fields
          const fields = rec.getFields();
          fields.forEach((fieldId) => {
            if (Date.now() - startTime > EXECUTION_TIMEOUT) {
              throw new Error('Execution timeout exceeded');
            }

            try {
              const value = rec.getValue({ fieldId: fieldId });
              let text = value;
              try {
                text = rec.getText({ fieldId: fieldId }) || value;
              } catch (e) {
                // Some fields don't support getText
              }

              recordData.fields.push({
                fieldId: fieldId,
                value: value,
                text: text
              });
            } catch (e) {
              log.debug(`${LOG_PREFIX}:fetch:fieldError`, { fieldId, err: e.message });
            }
          });

          // Get all sublists
          const sublists = rec.getSublists();
          sublists.forEach((sublistId) => {
            if (Date.now() - startTime > EXECUTION_TIMEOUT) {
              throw new Error('Execution timeout exceeded');
            }

            try {
              const lineCount = rec.getLineCount({ sublistId: sublistId });
              recordData.sublists[sublistId] = [];

              for (let i = 0; i < lineCount; i++) {
                const lineData = {};
                const sublistFields = rec.getSublistFields({
                  sublistId: sublistId
                });

                sublistFields.forEach((fieldId) => {
                  try {
                    const value = rec.getSublistValue({
                      sublistId: sublistId,
                      fieldId: fieldId,
                      line: i
                    });
                    let text = value;
                    try {
                      text = rec.getSublistText({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        line: i
                      }) || value;
                    } catch (e) {
                      // Some fields don't support getText
                    }
                    lineData[fieldId] = { value: value, text: text };
                  } catch (e) {
                    log.debug(`${LOG_PREFIX}:fetch:sublistFieldError`, { sublistId, fieldId, line: i, err: e.message });
                  }
                });

                recordData.sublists[sublistId].push(lineData);
              }
            } catch (e) {
              log.debug(`${LOG_PREFIX}:fetch:sublistError`, { sublistId, err: e.message });
            }
          });

          // Get subrecords (recursive approach with depth limit)
          const processSubrecord = (parentRec, subrecordId, depth) => {
            if (depth > 2) return null; // Limit recursion depth
            if (Date.now() - startTime > EXECUTION_TIMEOUT) {
              throw new Error('Execution timeout exceeded');
            }

            try {
              const subrec = parentRec.getSubrecord({ fieldId: subrecordId });
              const subData = { fields: [] };

              const subFields = subrec.getFields();
              subFields.forEach((fieldId) => {
                try {
                  const value = subrec.getValue({ fieldId: fieldId });
                  let text = value;
                  try {
                    text = subrec.getText({ fieldId: fieldId }) || value;
                  } catch (e) {
                    // Some fields don't support getText
                  }
                  subData.fields.push({
                    fieldId: fieldId,
                    value: value,
                    text: text
                  });
                } catch (e) {
                  log.debug(`${LOG_PREFIX}:fetch:subrecordFieldError`, { subrecordId, fieldId, err: e.message });
                }
              });

              return subData;
            } catch (e) {
              log.debug(`${LOG_PREFIX}:fetch:subrecordError`, { subrecordId, err: e.message });
              return null;
            }
          };

          // Try common subrecord fields
          const commonSubrecords = ['addressbook', 'billingaddress', 'shippingaddress'];
          commonSubrecords.forEach((subId) => {
            const subData = processSubrecord(rec, subId, 1);
            if (subData) {
              recordData.subrecords[subId] = subData;
            }
          });

          // JSON encode the record data
          const recordText = JSON.stringify(recordData, null, 2);
          const truncatedText = truncateText(recordText, MAX_TEXT_LENGTH);

          // Generate URL
          let recUrl = '';
          try {
            recUrl = urlMod.resolveRecord({
              recordType: recordTypeId,
              recordId: internalId,
              isEditMode: false
            });
          } catch (e) {
            log.debug(`${LOG_PREFIX}:fetch:resolveRecordFailed`, { recordTypeId, internalId, err: e.message });
          }

          // Get date metadata
          const metadata = {};
          const dateFields = ['created', 'lastmodified', 'trandate', 'createddate', 'datecreated'];
          dateFields.forEach((dateField) => {
            try {
              const dateVal = rec.getValue({ fieldId: dateField });
              if (dateVal) {
                metadata[dateField] = dateVal;
              }
            } catch (e) {
              // Field doesn't exist
            }
          });

          log.audit(`${LOG_PREFIX}:fetch:Success`, { recordTypeId, internalId, title });

          return JSON.stringify( {
           // success: true,
            content: [{ 
              type: 'text',
              text: JSON.stringify({ id: encodedId,
              title: title,
              text: truncatedText,
              url: baseDomain + (recUrl || ''),
              metadata: metadata
            })
            }],

          });
        }

        throw new Error(`Unknown type: ${type}`);

      } catch (e) {
        log.error(`${LOG_PREFIX}:fetch:Error`, e.message);
        return JSON.stringify({
          success: false,
          error: e.message
        });
      }
    }

    // Export tool methods
    return {
      search: search_tool,
      fetch: fetch_tool
    };
  });