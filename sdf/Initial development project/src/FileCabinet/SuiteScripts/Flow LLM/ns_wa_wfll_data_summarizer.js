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
 * 1.00            2025-07-08           manuel.teodoro       initial build
 */

define( //using require instead for better module loading especially for the have dependencies.
    function (require)
    {
        const llm = require('N/llm');
        const workflow = require('N/workflow');
        const runtime = require('N/runtime');
        const log = require('N/log');
        const record = require('N/record');
        const search = require('N/search');

        //Custom modules
        const NSUtil = require ('../Library/NSUtilvSS2');
        const wfllUtils = require('./ns_li_wfll_utils');

        const Format = {
            JSON: 'JSON',
            XML: 'XML',
            HTML: 'HTML',
            TEXT: 'TEXT'
        };

        //Script parameter definition
        //Usage: PARAM_DEF = {parameter1:{id:'custcript_etc', optional:true}}
        const PARAM_DEF = {
            promptid: { id: 'wfll_prompt_ds_id', optional: true },
            logactivity: { id: 'wfll_logallactivity', optional: true },
            dataset1: { id: 'wfll_dataset1', optional: true },
            datasetcond1: { id: 'wfll_dataset1_condition', optional: true },
            dataset2: { id: 'wfll_dataset2', optional: true },
            datasetcond2: { id: 'wfll_dataset2_condition', optional: true },
            dataset3: { id: 'wfll_dataset3', optional: true },
            datasetcond3: { id: 'wfll_dataset3_condition', optional: true },
            files: { id: 'wfll_filecabinet', optional: true },
            bodyfields: { id: 'wfll_bodyfields', optional: true },
            attachments: { id: 'wfll_attachments', optional: true },
        };

        var EntryPoint = (typeof EntryPoint === 'undefined') ? {} : EntryPoint;
        var Helper = {};

        /**
         * Merges a Prompt Studio prompt with current record field values
         * Replaces {{fieldId}} tokens in the prompt with actual field values
         * @param {{ newRecord: Record, workflowContext: Object }} context
         * @returns {string} response from LLM
         */
        EntryPoint.onAction = function (context)
        {
            let stLogTitle = 'EntryPoint.onAction';
            log.debug(stLogTitle, '**** Starting prompt data summarizer action ****');

            try
            {
                const params = NSUtil.getParameters(PARAM_DEF, true);
                log.debug(stLogTitle, 'params:'+JSON.stringify(params));

                const rec = context.newRecord;
                const docs = [];
                const objVariables = {};

                if (params.logactivity) {
                    log.debug('Logging Enabled', 'Activity logging is enabled for this action');
                    wfllUtils.LOGPROMPTS = true; // Enable logging for this action
                } else {
                    log.debug('Logging Disabled', 'Activity logging is disabled for this action');
                    wfllUtils.LOGPROMPTS = false; // Disable logging for this action
                }

                Helper.createRagDocsFromFileCabinet(params,docs); // Create RAG document from File Cabinet
                Helper.createRagDocsFromField(rec,params,docs); // Create RAG document from File Cabinet
                Helper.createDataSet(params,docs); // Create dataset from Workbook/SQL/Saved Search
                log.debug(stLogTitle, 'docs:'+JSON.stringify(docs));
                Helper.createInputVariable(rec,params,objVariables); // Create Input Variable

                let promptObj = wfllUtils.runPromptWithRAG(params.promptid, docs,  objVariables, null, Format.TEXT);

                if (!promptObj || !promptObj.text)
                {
                    log.error('Prompt Merge Action Failed', 'No valid response from prompt ID: ' + params.promptid);
                    return '[ERROR: No valid response from prompt]';
                }
                log.debug(stLogTitle, 'Response length: ' + promptObj.text.length+' | Token size: ' + wfllUtils.tokenCountString(promptObj.text)+' | Action: '+promptObj.text);

                return promptObj.text;

            } catch (e) {
                log.error('Prompt Merge Action Failed', e);
                return '[ERROR: ' + e.message + ']';
            }
        }

        Helper.createInputVariable = function (rec,params,objVariables)
        {
            let stLogTitle = 'Helper.createInputVariable';
            log.debug(stLogTitle);

            const currentUser = runtime.getCurrentUser();
            const arrBodyFieldsList = params.bodyfields ? params.bodyfields.split(',') : [];

            arrBodyFieldsList.forEach(function(fieldId) {
                let fieldValue = rec.getValue({ fieldId: fieldId });
                if (fieldValue !== null && fieldValue !== undefined) {
                    objVariables[fieldId] = fieldValue;
                }else {
                    // If the field is not set, we can either skip it or set it to an empty string
                    objVariables[fieldId] = '';
                }
                return true;
            });
            objVariables.user = JSON.stringify(currentUser);
            log.debug(stLogTitle, 'objVariables:'+JSON.stringify(objVariables))
        }

        Helper.createRagDocsFromField = function (rec,params,docs)
        {
            let stLogTitle = 'Helper.createRagDocsFromField';
            log.debug(stLogTitle);

            const fileCabinetDocIds = [];
            fileCabinetDocIds.push(
                ...params.attachments.split(',')
            );

            const fileCabinetDocs = fileCabinetDocIds.map(id => {
                if (id) {
                    try {
                        let fieldValue = rec.getValue({ fieldId: id });
                        return wfllUtils.createFileCabinetDoc(fieldValue);
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

            docs.push(  ...fileCabinetDocs
            );
        }

        Helper.createRagDocsFromFileCabinet = function (params,docs)
        {
            let stLogTitle = 'Helper.createRagDocsFromFileCabinet';
            log.debug(stLogTitle);

            const fileCabinetDocIds = [];

            fileCabinetDocIds.push(
                ...params.files.split(',')
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

            docs.push(  ...fileCabinetDocs
            );
        }

        Helper.createDataSet = function (params,docs)
        {
            let stLogTitle = 'Helper.createDataSet';
            log.debug(stLogTitle);

            // Dataset IDs & conditions
            const dsIds   = [
                params.dataset1,
                params.dataset2,
                params.dataset3
            ];
            const dsConds = [
                params.datasetcond1,
                params.datasetcond2,
                params.datasetcond3
            ];

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

            return docs;
        }

        Helper.buildSavedSearch = function (params,docs)
        {
            let stLogTitle = 'Helper.buildSavedSearch';
            log.debug(stLogTitle);

            const arrDocs = [];
            const objSearch = search.load({
                id: params.searchid
            });
            const arrFilters = [
                search.createFilter({ //create new filter
                    name: 'name',
                    operator: search.Operator.ANYOF,
                    values: params.recordid
                }),
                search.createFilter({ //create new filter
                    name: 'mainline',
                    operator: search.Operator.IS,
                    values: 'F'
                }),
                search.createFilter({ //create new filter
                    name: 'taxline',
                    operator: search.Operator.IS,
                    values: 'F'
                }),
                search.createFilter({ //create new filter
                    name: 'shipping',
                    operator: search.Operator.IS,
                    values: 'F'
                }),
                search.createFilter({ //create new filter
                    name: 'cogs',
                    operator: search.Operator.IS,
                    values: 'F'
                })
            ];
            const arrSearchResults = wfllUtils.createSearchDoc(objSearch, arrFilters);

            const doc = wfllUtils.createSearchResultDoc(objSearch, arrFilters);
            arrDocs.push(doc);

            return arrDocs;
        }

        return EntryPoint;
    });