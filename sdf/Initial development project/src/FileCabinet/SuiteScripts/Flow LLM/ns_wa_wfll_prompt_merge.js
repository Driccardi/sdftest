/**
 * @NApiVersion 2.1
 * @NScriptType workflowactionscript
 * @NModuleScope Public
 *
 * Copyright (c) 1998-2023 Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * Version          Date                Author               Remarks
 * 1.00            2025-07-08           riccardi             initial build
 */

define(['N/workflow', 'N/runtime', 'N/log', 'N/record', 'N/search', './ns_li_wfll_utils'],
    function(workflow, runtime, log, record, search, wfllUtils) {
    
        /**
         * Merges a Prompt Studio prompt with current record field values
         * Replaces {{fieldId}} tokens in the prompt with actual field values
         * @param {{ newRecord: Record, workflowContext: Object }} context
         * @returns {string} response from LLM
         */
        function onAction(context) {
            log.debug('Prompt Merge Action', 'Starting prompt merge action');
            try {
                const rec = context.newRecord;
                const promptId = runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_prompt_id' });
                const bodyFieldsListCSV= runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_bodyfieldlist' });
                const arrBodyFieldsList = bodyFieldsListCSV ? bodyFieldsListCSV.split(',') : [];
                const strSublist = runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_sublist' });
                const boolLogActivity = runtime.getCurrentScript().getParameter({ name: 'custscript_wfll_log_activity' });
                if(boolLogActivity) {
                    log.debug('Logging Enabled', 'Activity logging is enabled for this action');
                    wfllUtils.LOGPROMPTS = true; // Enable logging for this action
                } else {    
                    log.debug('Logging Disabled', 'Activity logging is disabled for this action');
                    wfllUtils.LOGPROMPTS = false; // Disable logging for this action
                }

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
    
                let promptObj = wfllUtils.runPromptById(promptId, variables);
                if (!promptObj || !promptObj.text) {
                    log.error('Prompt Merge Action Failed', 'No valid response from prompt ID: ' + promptId);
                    return '[ERROR: No valid response from prompt]';
                }
                // Log the prompt and response if logging is enabled
                log.debug('Prompt Response Length', 'Response length: ' + promptObj.text.length);
                log.debug('Prompt Response Token Size', 'Token size: ' + wfllUtils.tokenCountString(promptObj.text));
                log.debug('Prompt Merge Action', promptObj.text);
                return promptObj.text;
   
            } catch (e) {
                log.error('Prompt Merge Action Failed', e);
                return '[ERROR: ' + e.message + ']';
            }
        }
    
        return {
            onAction: onAction
        };
    });