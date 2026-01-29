/**
 * Copyright (c) 1998-2017 Netsuite, Inc.
 * All rights reserved
 *
 * This software is the confidential and proprietary of Netsuite, Inc. (Confidential Information)
 *
 *
 *
 *  Version          Date                   Author                 Remark
 *  1.0           18 Sep 2024   Sravan Teja Panjala    Initial Commit
 *  2.0           8/5/2025      Heeju Park
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(["N/runtime", "N/search", "N/record", '/SuiteScripts/_nscs/Library/NSUtilvSS2.js'],
    function (runtime, search, record, NSUtil) {
        // Use the getInputData function to return two strings.

        function getInputData() {
            try {
                // Getting transaction type and id from the script parameter
                return search.load({
                    id: runtime.getCurrentScript().getParameter("custscript_ns_txn_search"),
                });
            } catch (e) {
                log.error("Error", JSON.stringify(e));
            }
        }


        // Updated on 8/28/25 - getting the Source Record Type to pass it to the Transformation Dataflow Mapping search
        function getSourceRecType(idSourceRec){
            let arrSearchFilters = [
                search.createFilter({
                    name: 'custrecord_ps_trans_nsrec_type',
                    operator: search.Operator.IS,
                    values: idSourceRec
                })
            ];
            let arrSearchColumns = [
                search.createColumn({name: "internalid", label: "Internal ID"})
            ]

            let objSourceRecTypeSearchResult = NSUtil.search('customrecord_ps_trans_nsrec', null, arrSearchFilters, arrSearchColumns);

            if(!NSUtil.isEmpty(objSourceRecTypeSearchResult[0])){
                return objSourceRecTypeSearchResult[0].getValue({
                    name: "internalId"
                })

            } else {
                log.error(`No Transformation NetSuite Record found based on the given value: ${idSourceRec}.`)
                return null;
            }

        }

        function map(context) {
            try {
                const objData = JSON.parse(context.value);
                log.debug("objData", objData);
                let intTransId = objData.id;
                let strTransType = objData.recordType;
                log.debug("intTransId: ", intTransId);
                log.debug("strTransType: ", strTransType);

                // Load the transaction
                let objTransRec = record.load({
                    type: strTransType,
                    id: intTransId
                });
                let idProject = objTransRec.getValue('job');
                let strProject = "";
                let objProjectRec;



                // Setting the values to idProject
                let projectSearchId = runtime.getCurrentScript().getParameter("custscript_ns_project_mapping_search");

                let projectMappingSearchObj = search.load({
                    id: projectSearchId
                });

                let idSourceRecType = getSourceRecType(strTransType);
                let filters = [];
                filters.push("AND",
                    ["custrecord_ps_trandf_sourcetype",search.Operator.ANYOF,idSourceRecType]);

                projectMappingSearchObj.filterExpression = projectMappingSearchObj.filterExpression.concat(filters);


                let objProjMappingResults = getSearchResults(projectMappingSearchObj);

                let strTargetRecordType = objProjMappingResults[0].getValue({ name: "custrecord_ps_trans_nsrec_type", join: "CUSTRECORD_PS_TRANDF_TARGETTYPE"});

                if (NSUtil.isEmpty(idProject)) {
                    strProject = objTransRec.getValue('custbody_new_project');

                    log.debug("strProject: ", strProject);
                    // Creating the idProject
                    objProjectRec = record.create({
                        type: strTargetRecordType,
                        isDynamic: true
                    });
                    objProjectRec.setValue('companyname', strProject);

                } else {
                    objProjectRec = record.load({
                        type: strTargetRecordType,
                        id: idProject,
                        isDynamic: true
                    });
                }

                if (objProjMappingResults.length > 0) {
                    for (let i = 0; i < objProjMappingResults.length; i++) {
                        let strSourceFieldId = objProjMappingResults[i].getValue({ name: "custrecord_ps_trans_dfmap_source_id", join: "CUSTRECORD_PS_TRANS_DFMAP_TRANSDF"});
                        let strTargetVal = objTransRec.getValue(strSourceFieldId);
                        let strTargetFieldId = objProjMappingResults[i].getValue({ name: "custrecord_ps_trans_dfmap_target_id", join: "CUSTRECORD_PS_TRANS_DFMAP_TRANSDF"});
                        objProjectRec.setValue(strTargetFieldId, strTargetVal);
                    }
                } else {
                    throw "Project Mappings are not available.";
                }
                idProject = objProjectRec.save(true, true);

                log.debug("idProject: ", idProject);


                // Making search on the idProject task mapping record and adding the mappings to object
                let idProjTaskSearch = runtime.getCurrentScript().getParameter("custscript_ns_proj_task_mapping_search");

                let projTaskMappingSearchObj = search.load({
                    id: idProjTaskSearch
                });

                projTaskMappingSearchObj.filterExpression = projTaskMappingSearchObj.filterExpression.concat(filters);

                // Project Task
                let objProjTaskMappingResults = getSearchResults(projTaskMappingSearchObj);


                strTargetRecordType = objProjTaskMappingResults[0].getValue({ name: "custrecord_ps_trans_nsrec_type", join: "CUSTRECORD_PS_TRANDF_TARGETTYPE"});
                let objProjTaskMapping = {}
                if (objProjTaskMappingResults.length > 0) {

                    for (let i = 0; i < objProjTaskMappingResults.length; i++) {
                        let stSourceId = objProjTaskMappingResults[i].getValue({ name: "custrecord_ps_trans_dfmap_source_id", join: "CUSTRECORD_PS_TRANS_DFMAP_TRANSDF"});
                        let stTargetId = objProjTaskMappingResults[i].getValue({ name: "custrecord_ps_trans_dfmap_target_id", join: "CUSTRECORD_PS_TRANS_DFMAP_TRANSDF"});
                        // objProjectRec.setValue(stTargetId, stTargetValue);
                        objProjTaskMapping[stTargetId] = stSourceId;
                    }
                }

                let intItemLineCount = objTransRec.getLineCount('item');

                for (let j = 0; j < intItemLineCount; j++) {

                    let shouldUpsertProjTask = objTransRec.getSublistValue('item', 'custcol_include_in_project_task', j);
                    if (shouldUpsertProjTask === true || shouldUpsertProjTask === "T") {
                        let objTransItem = {
                            projectTaskId: objTransRec.getSublistValue('item', 'custcol_ns_related_project_task', j) || "",
                            project: idProject,
                            lineId: objTransRec.getSublistValue('item', 'line', j),
                            lineType: objTransRec.getSublistValue('item', 'custcol_line_type', j),
                            data: {}
                        }
                        for (let key in objProjTaskMapping) {
                            objTransItem.data[key] = objTransRec.getSublistValue('item', objProjTaskMapping[key], j);
                        }
                        // objLinesToUpdate.push(objTransItem);
                        context.write(`${strTransType},${intTransId},${strTargetRecordType}`, JSON.stringify(objTransItem));
                    }

                }

                if (!NSUtil.isEmpty(idProject)) {
                    objTransRec.setValue('job', idProject);
                    objTransRec.setValue('custbody_new_project', "");
                    objTransRec.setValue('custbody_ns_create_update_proj_task',false)
                    objTransRec.save(true, true);
                }

            } catch (e) {
                log.error("Error", JSON.stringify(e));
            }

        }

        function reduce(context) {
            try {
                log.debug("context - reduce",JSON.stringify(context));
                let objTransRec = context.key;
                objTransRec = objTransRec.split(",");

                let strTransType = objTransRec[0];
                let intTransId = objTransRec[1];
                let strProjTaskType = objTransRec[2];

                for (let i = 0; i < context.values.length; i++) {
                    let objData = JSON.parse(context.values[i]);
                    log.debug("objData", objData);

                    let objProjTask = {};
                    let isCreate  = false;
                    if (!NSUtil.isEmpty(objData.projectTaskId)) {
                        objProjTask = record.load({
                            type: strProjTaskType,
                            id: objData.projectTaskId
                        });

                        let idLineTypeCO = runtime.getCurrentScript().getParameter("custscript_ns_line_type_co");
                        for (let key in objData.data) {
                            if (key === "plannedwork" && objData.lineType === idLineTypeCO) {

                                let plannedWork = objProjTask.getValue(key);
                                plannedWork = parseInt(plannedWork, 10) + parseInt(objData.data[key], 10);

                                objProjTask.setValue(key, plannedWork);
                            } else {
                                objProjTask.setValue(key, objData.data[key]);
                            }

                        }

                    } else {
                        isCreate = true;
                        objProjTask = record.create({
                            type: strProjTaskType,
                            isDynamic: true
                        });
                        objProjTask.setValue('company', objData.project);
                        for (let key in objData.data) {
                            objProjTask.setValue(key, objData.data[key]);
                        }

                    }

                    let projectTaskId = objProjTask.save(true, true);
                    log.debug(`projectTaskId`, projectTaskId)

                    // Load the transaction
                    let objTransRec = record.load({
                        type: strTransType,
                        id: intTransId,
                        isDynamic: true
                    });


                    if(isCreate === true) {
                        // Updating on the Txn

                        let lineNumber = objTransRec.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            value: objData.lineId
                        });

                        objTransRec.selectLine('item', lineNumber);
                        objTransRec.setCurrentSublistValue('item', 'custcol_ns_related_project_task', projectTaskId);
                        objTransRec.commitLine('item');

                    }

                    objTransRec.setValue('custbody_ns_create_update_proj_task',false)
                    objTransRec.save(true, true);
                }
            } catch (e) {
                log.error("Error", JSON.stringify(e));
            }
        }

        // The summarize stage is a serial stage, so this function is invoked only one
        // time.
        function summarize(summaryContext) {
            log.audit("Script Summary", ' | Usage Consumed = ' + summaryContext.usage +
                ' | Concurrency Number = ' + summaryContext.concurrency +
                ' | Number of Yields = ' + summaryContext.yields);
        }

        function getSearchResults(searchObj) {
            let results_array = [];
            let page = searchObj.runPaged({
                pageSize: 4000
            });
            for (let i = 0; i < page.pageRanges.length; i++) {
                let pageRange = page.fetch({
                    index: page.pageRanges[i].index
                });
                results_array = results_array.concat(pageRange.data);
            }
            return results_array;
        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize,
        };
    });
