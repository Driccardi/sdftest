/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 *
 * Copyright (c) 1998-2023 Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * Version          Date                Author               Remarks
 * 1.00            2025-07-11           riccardi             initial build – RAG version
 */

define([
    'N/runtime',
    'N/log',
    './ns_li_wfll_utils'
], function (runtime, log, wfllUtils) {

    /**
     * Workflow Action: Prompt Merge with Dataset‑based RAG
     * 1. Fetch Prompt Studio prompt by ID
     * 2. Substitute {{token}} placeholders using mergeMap param + record values
     * 3. Optionally attach up to 3 Dataset/Workbook docs (with optional conditions)
     * 4. Call wfllUtils.runPromptWithRAG and return LLM response
     *
     * Script Parameters expected at deployment:
     *  - custscript_wfll_prompt_id         (Text)   – Prompt Studio ID
     *  - custscript_wfll_merge_map         (LongTxt)– JSON { token: fieldId }
     *  - custscript_wfll_ds1_id            (Text)   – Dataset/Workbook ID #1 (opt)
     *  - custscript_wfll_ds1_cond          (LongTxt)– Condition JSON string (opt)
     *  - custscript_wfll_ds2_id            (Text)   – Dataset/Workbook ID #2 (opt)
     *  - custscript_wfll_ds2_cond          (LongTxt)– Condition JSON string (opt)
     *  - custscript_wfll_ds3_id            (Text)   – Dataset/Workbook ID #3 (opt)
     *  - custscript_wfll_ds3_cond          (LongTxt)– Condition JSON string (opt)
     *  - custscript_wfll_log_activity      (Checkbox) – Enable prompt logging
     */
    function onAction(context) {
        const boolLogActivity = true; 
        try {
            const rec = context.newRecord;
            const script = runtime.getCurrentScript();
            const docs = []; // Array to hold dataset and file cabinet documents

            /* ---------- Parameters ---------- */
            const promptId      = script.getParameter({ name: 'custscript_wfll_prompt_id2' });
            const bodyFieldsListCSV= runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_bodyfieldlist2' });
            const arrBodyFieldsList = bodyFieldsListCSV ? bodyFieldsListCSV.split(',') : [];
            const strSublist = runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_sublist2' });

            /* ---------- Logging Setup ---------- */
            if(boolLogActivity) {
                log.debug('Logging Enabled', 'Activity logging is enabled for this action');
                wfllUtils.LOGPROMPTS = true; // Enable logging for this action
            } else {    
                log.debug('Logging Disabled', 'Activity logging is disabled for this action');
                wfllUtils.LOGPROMPTS = false; // Disable logging for this action
            }

            // Dataset IDs & conditions
            const dsIds   = [
                script.getParameter({ name: 'custscript_wfll_ds1_id' }),
                script.getParameter({ name: 'custscript_wfll_ds2_id' }),
                script.getParameter({ name: 'custscript_wfll_ds3_id' })
            ];
            const dsConds = [
                script.getParameter({ name: 'custscript_wfll_ds1_cond' }),
                script.getParameter({ name: 'custscript_wfll_ds2_cond' }),
                script.getParameter({ name: 'custscript_wfll_ds3_cond' })
            ];
            



            /* ---------- Build Dataset RAG Documents ---------- */

            dsIds.forEach(function (id, idx) {
                if (id) {
                    log.debug('Dataset ID', `Processing dataset ${id} with condition ${dsConds[idx]}`);
                    try {
                        const condStr = dsConds[idx];
                        const condObj = condStr ? JSON.parse(condStr) : null;
                        const doc = wfllUtils.createDatasetDoc(id, condObj);
                        docs.push(doc);
                    } catch (e) {
                        log.error('DatasetDoc Error', `Dataset ${id}: ${e.message}`);
                    }
                }
            });

            /* ---------- Build File Cabinet RAG Documents ---------- */
            // get file cabinet document list from a csv parameter.  This will be good as a static account parameter
            // File Cabinet RAG document parameters
            const fileCabinetDocIds = [
                            script.getParameter({ name: 'custscript_wfll_file1_id' }),
                            script.getParameter({ name: 'custscript_wfll_file2_id' }),
                            script.getParameter({ name: 'custscript_wfll_file3_id' })
                        ];
             fileCabinetDocIds.push(
               ... script.getParameter({ name: 'custscript_wfll_filelist' }).split(',')
            );

            const fileCabinetDocs = fileCabinetDocIds.map(id => {
                if (id) {
                    try {
                        return wfllUtils.createFileCabinetDoc(id);
                    } catch (e) {
                        log.error('File Cabinet Doc Error', `File ID ${id}: ${e.message}`);
                        return null; // Skip this file if there's an error
                    }
                }
                return null; // Skip if no ID provided
            }).filter(doc => doc !== null); // Filter out any nulls
            if (fileCabinetDocs.length === 0) {
                log.debug('RAG', 'No file cabinet documents provided – proceeding without docs');
            } else {
                log.debug('RAG', `Loaded ${fileCabinetDocs.length} file cabinet documents`);
            }


            /* ---------- Build Saved Search RAG Documents ---------- */
            // TODO: Implement saved search RAG documents if needed
            let savedSearchDocs = [];

            /* ---------- Build SuiteQL RAG Documents ---------- */
            // TODO: Implement SuiteQL RAG documents if needed
            let suiteQLDocs = [];


            /* ---------- Combine All RAG Documents ---------- */
            // Combine all documents into the docs array
            docs.push(  ...fileCabinetDocs, 
                        ...savedSearchDocs, 
                        ...suiteQLDocs
                    );

            /* ---------- Merge Variables ---------- */
            // create input variables for prompt from the body fields
            let variables = {};
            arrBodyFieldsList.forEach(function(fieldId) {  
                let fieldValue = rec.getValue({ fieldId: fieldId });
                if (fieldValue !== null && fieldValue !== undefined) {
                    variables[fieldId] = fieldValue;
                }else {
                    // If the field is not set, we can either skip it or set it to an empty string
                    variables[fieldId] = '';
                }
                return true; 
            });
            // always include the user variables
            const currentUser = runtime.getCurrentUser();   // User object
            variables['user'] = JSON.stringify(currentUser);          // User ID

            // If a sublist is specified, create a list of field value pairs for each line and add it as a JSON string variable labeled with the sublist ID
            // This allows the prompt to access sublist data as well
            if (strSublist) {
                let sublistValues = [];
                let lineCount = rec.getLineCount({ sublistId: strSublist });
                let sublistFields = rec.getSublistFields({ sublistId: strSublist });
                if (lineCount === 0) {
                    log.debug('Sublist Empty', 'No lines found in sublist: ' + strSublist);
                    return '[ERROR: Sublist is empty]';
                }else{
                    log.debug('Sublist Line Count', 'Found ' + lineCount + ' lines in sublist: ' + strSublist);
                    log.debug('Sublist Fields', 'Fields in sublist: ' + sublistFields.join(', '));
                }
                for (let i = 0; i < lineCount; i++) {
                    let lineObj = {};
                    sublistFields.forEach(function(fieldId) {
                        let fieldValue = rec.getSublistValue({
                            sublistId: strSublist,
                            fieldId: fieldId,
                            line: i
                        });
                        if (fieldValue !== null && fieldValue !== undefined) {
                            lineObj[fieldId] = fieldValue;
                        } else {
                            lineObj[fieldId] = '';
                        }
                    });
                    sublistValues.push(lineObj);
                }
                variables[strSublist] = JSON.stringify(sublistValues);
            }






            if (docs.length === 0) {
                log.debug('RAG', 'No dataset documents provided – proceeding without docs');
            }

            /* ---------- Execute Prompt w/ RAG ---------- */
            wfllUtils.LOGPROMPTS = boolLogActivity; // Set logging based on script parameter
            const resp = wfllUtils.runPromptWithRAG(promptId, docs, variables, null);
            return resp.text || '[ERROR: No response]';
        } catch (err) {
            log.error({ title: 'Prompt‑Merge‑RAG Fail', details: err });
            return '[ERROR: ' + err.message + ']';
        }
    }

    return { onAction: onAction };
});
