/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * MCP Custom Tool for OpenAI integration: global search and record fetch
 */
define(['N/search', 'N/record', 'N/url', 'N/file', 'N/runtime', 'N/log'], 
  (s, record, url, file, runtime, log) => {
    const LOG_PREFIX = 'OPENAI_MCP';
    const MAX_RESULTS = 50;
    const EXECUTION_TIMEOUT = 5000; // 5 seconds in ms

    /**
     * Perform global search across NetSuite records
     * Returns up to 50 results with id, title, and url
     */
    function searchRecords(args) {
      const startTime = Date.now();
      try {
        if (!args.query || typeof args.query !== 'string') {
          throw new Error('Invalid call: missing query parameter');
        }

        log.debug(`${LOG_PREFIX}:searchRecords`, { query: args.query });

        const results = s.global({
          keywords: args.query
        });

        const searchResults = [];
        let count = 0;

        results.forEach((result) => {
          if (count >= MAX_RESULTS) return false; // Stop processing
          if (Date.now() - startTime > EXECUTION_TIMEOUT) {
            throw new Error('Execution timeout exceeded');
          }

          // Extract required columns
          const columns = result.columns;
          let name = '', type = '', info1 = '', info2 = '';

          columns.forEach((col) => {
            const label = col.label.toLowerCase();
            if (label === 'name') name = result.getValue(col) || '';
            else if (label === 'type') type = result.getValue(col) || '';
            else if (label === 'info1') info1 = result.getValue(col) || '';
            else if (label === 'info2') info2 = result.getValue(col) || '';
          });

          // Verify we have required columns
          if (!type) {
            throw new Error('Search result missing required column: type');
          }

          const recordType = result.recordType;
          const recordId = result.id;
          const uniqueId = `${recordType}|${recordId}`;

          // Build title from available fields
          const titleParts = [name, type, info1, info2].filter(p => p);
          const title = titleParts.join(' | ') || recordType;

          // Generate URL - try record URL first, fallback to base domain
          let recordUrl = '';
          try {
            recordUrl = url.resolveRecord({
              recordType: recordType,
              recordId: recordId,
              isEditMode: false
            });
          } catch (urlError) {
            // Fallback to account domain
            const accountId = runtime.accountId.toLowerCase().replace('_', '-');
            recordUrl = `https://${accountId}.app.netsuite.com/app/common/search/searchresults.nl`;
          }

          searchResults.push({
            id: uniqueId,
            title: title,
            url: recordUrl
          });

          count++;
          return true;
        });

        log.audit(`${LOG_PREFIX}:searchRecords:Success`, { 
          query: args.query, 
          resultsCount: searchResults.length 
        });

        return {
          success: true,
          count: searchResults.length,
          results: searchResults
        };

      } catch (e) {
        log.error(`${LOG_PREFIX}:searchRecords:Error`, e.message);
        return {
          success: false,
          error: e.message
        };
      }
    }

    /**
     * Fetch detailed record or file contents
     * Returns structured data based on record type
     */
    function fetchRecord(args) {
      const startTime = Date.now();
      try {
        if (!args.id || typeof args.id !== 'string') {
          throw new Error('Invalid call: missing id parameter');
        }

        // Parse the composite ID
        const parts = args.id.split('|');
        if (parts.length !== 2) {
          throw new Error('Invalid id format: expected "recordType|internalId"');
        }

        const recordType = parts[0];
        const recordId = parts[1];

        log.debug(`${LOG_PREFIX}:fetchRecord`, { recordType, recordId });

        // Generate URL
        let recordUrl = '';
        try {
          recordUrl = url.resolveRecord({
            recordType: recordType,
            recordId: recordId,
            isEditMode: false
          });
        } catch (urlError) {
          const accountId = runtime.accountId.toLowerCase().replace('_', '-');
          recordUrl = `https://${accountId}.app.netsuite.com/`;
        }

        let title = '';
        let text = '';
        let metadata = {};

        // Handle file records differently
        if (recordType === 'file') {
          const fileObj = file.load({ id: recordId });
          
          // Only process text/csv files
          const fileType = fileObj.fileType;
          if (fileType !== file.Type.PLAINTEXT && 
              fileType !== file.Type.CSV &&
              fileType !== file.Type.JAVASCRIPT &&
              fileType !== file.Type.JSON) {
            throw new Error(`Unsupported file type: ${fileType}. Only text and CSV files are supported.`);
          }

          title = fileObj.name;
          text = fileObj.getContents();

          metadata = {
            type: 'file',
            fileType: fileType,
            size: fileObj.size
          };

          if (fileObj.created) metadata.created = fileObj.created;
          if (fileObj.lastModified) metadata.lastModified = fileObj.lastModified;

        } else {
          // Handle regular records
          const rec = record.load({
            type: recordType,
            id: recordId,
            isDynamic: false
          });

          // Get title from common name fields
          const nameFields = ['name', 'tranid', 'entityid', 'companyname', 'altname'];
          for (const field of nameFields) {
            try {
              const val = rec.getValue({ fieldId: field });
              if (val) {
                title = String(val);
                break;
              }
            } catch (e) {
              // Field doesn't exist, continue
            }
          }

          if (!title) title = `${recordType} ${recordId}`;

          // Get all fields and their values
          const fields = rec.getFields();
          const fieldData = [];

          for (const fieldId of fields) {
            if (Date.now() - startTime > EXECUTION_TIMEOUT) {
              throw new Error('Execution timeout exceeded');
            }

            try {
              const value = rec.getValue({ fieldId: fieldId });
              const text = rec.getText({ fieldId: fieldId });

              fieldData.push({
                fieldname: fieldId,
                value: value,
                text: text || value
              });
            } catch (e) {
              // Some fields may not support getText, skip
              fieldData.push({
                fieldname: fieldId,
                value: rec.getValue({ fieldId: fieldId }),
                text: rec.getValue({ fieldId: fieldId })
              });
            }
          }

          text = JSON.stringify(fieldData, null, 2);

          // Add metadata
          metadata = { type: recordType };

          // Try to get common date fields
          const dateFields = ['created', 'lastmodified', 'trandate', 'createddate', 'datecreated'];
          for (const dateField of dateFields) {
            try {
              const dateVal = rec.getValue({ fieldId: dateField });
              if (dateVal) {
                metadata[dateField] = dateVal;
              }
            } catch (e) {
              // Field doesn't exist
            }
          }
        }

        log.audit(`${LOG_PREFIX}:fetchRecord:Success`, { 
          recordType, 
          recordId,
          title 
        });

        return {
          success: true,
          id: args.id,
          title: title,
          text: text,
          url: recordUrl,
          metadata: metadata
        };

      } catch (e) {
        log.error(`${LOG_PREFIX}:fetchRecord:Error`, e.message);
        return {
          success: false,
          error: e.message
        };
      }
    }

    // Export tool methods
    return {
      search: searchRecords,
      fetch: fetchRecord
    };
  });