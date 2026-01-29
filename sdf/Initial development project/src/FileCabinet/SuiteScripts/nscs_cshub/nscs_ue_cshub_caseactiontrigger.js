/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/task', 'N/runtime', 'N/error', './cshub_library'],
    /**
     * @param {record} record
     */
    function (record, search, task, runtime, error, cshub) {
        let strLogTitle;

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            strLogTitle = 'afterSubmit'
            // try {
            let recCase = scriptContext.newRecord;
            if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.XEDIT) {
                validateCaseType(recCase)
            }
            // }catch (e) {
            //     log.error("Error at [" + strLogTitle + "] function",
            //         'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            // }
        }

        function afterSubmit(scriptContext) {
            strLogTitle = 'afterSubmit'
            try {
                log.debug("------afterSubmit--------")
                // check if the record type is a case and triggered by create/edit
                let caseRecord = scriptContext.newRecord
                let triggerType = scriptContext.type
                let executionType = runtime.executionContext
                let caseTransactionID = caseRecord.getValue({fieldId: "custevent_cshub_case_tran"});
                let strLegacyTransaction = caseRecord.getValue({fieldId: "custevent_cshub_legacy_transaction"});
                let bManualEntry = isEmpty(caseTransactionID) && !isEmpty(strLegacyTransaction);
                //fetch values
                let bAmountUpdated = caseRecord.getValue({fieldId: "custevent_cshub_amountupdated"})
                let fltAppeasementAmt = caseRecord.getValue({fieldId: "custevent_cshub_appeasementamount"})
                let objCaseDetails = caseRecord.getValue({fieldId: 'custevent_cshub_casedtls_scrpt_use'})
                let actionStepCB = caseRecord.getValue({fieldId: "custevent_cshub_act_stps_ctrd"}) //case action step created
                let status = caseRecord.getValue({fieldId: "status"})
                let caseType = caseRecord.getValue({fieldId: "custevent_cshub_case_type"})
                let nextDeploys = caseRecord.getValue({fieldId: "custevent_cshub_casestep_array_ids"})
                let conditionThreeCB = caseRecord.getValue({fieldId: "custevent_cshub_scrpt_trgr_cond3"})
                log.debug("triggerType", triggerType)
                log.debug("executionType", executionType)

                if ((caseRecord.type === record.Type.SUPPORT_CASE) && ((triggerType === scriptContext.UserEventType.EDIT) || (triggerType === scriptContext.UserEventType.CREATE)) || (triggerType === scriptContext.UserEventType.XEDIT)) {

                    //2025-05-05 GG moving fetch values to outside if statement
                    /* //fetch values
                    let bAmountUpdated = caseRecord.getValue({fieldId: "custevent_cshub_amountupdated"})
                    let fltAppeasementAmt = caseRecord.getValue({fieldId: "custevent_cshub_appeasementamount"})
                    let objCaseDetails = caseRecord.getValue({fieldId: 'custevent_cshub_casedtls_scrpt_use'})
                    let actionStepCB = caseRecord.getValue({fieldId: "custevent_cshub_act_stps_ctrd"}) //case action step created
                    let status = caseRecord.getValue({fieldId: "status"})
                    let caseType = caseRecord.getValue({fieldId: "custevent_cshub_case_type"})
                    let nextDeploys = caseRecord.getValue({fieldId: "custevent_cshub_casestep_array_ids"})
                    let conditionThreeCB = caseRecord.getValue({fieldId: "custevent_cshub_scrpt_trgr_cond3"}) */
                    if (triggerType === scriptContext.UserEventType.XEDIT) {
                        let caseLookup = search.lookupFields({
                            type: record.Type.SUPPORT_CASE,
                            id: caseRecord.id,
                            columns: ['custevent_cshub_act_stps_ctrd', 'custevent_cshub_case_tran', 'custevent_cshub_case_type', 'custevent_cshub_casestep_array_ids', 'status', 'custevent_cshub_scrpt_trgr_cond3', 'custevent_cshub_amountupdated', 'custevent_cshub_appeasementamount', 'custevent_cshub_casedtls_scrpt_use']
                        })
                        if (!objCaseDetails) {
                            objCaseDetails = caseLookup.custevent_cshub_casedtls_scrpt_use
                        }
                        bAmountUpdated = caseLookup.custevent_cshub_amountupdated
                        fltAppeasementAmt = caseLookup.custevent_cshub_appeasementamount
                        actionStepCB = caseLookup.custevent_cshub_act_stps_ctrd
                        status = caseLookup.status[0].value
                        caseTransactionID = caseLookup.custevent_cshub_case_tran[0].value
                        caseType = caseLookup.custevent_cshub_case_type[0].value
                        nextDeploys = caseLookup.custevent_cshub_casestep_array_ids
                        conditionThreeCB = caseLookup.custevent_cshub_scrpt_trgr_cond3
                    }

                    let bEnableAmtInput = search.lookupFields({
                        type: 'customrecord_cshub_caseactions',
                        id: parseInt(caseType),
                        columns: 'custrecord_cshub_caseactn_enbl_qty_inpt'
                    }).custrecord_cshub_caseactn_enbl_qty_inpt
                    log.debug('Values', {
                        bAmountUpdated: bAmountUpdated,
                        fltAppeasementAmt: fltAppeasementAmt,
                        bEnableAmtInput: bEnableAmtInput,
                        actionStepCB: actionStepCB,
                        status: status,
                        caseTransactionID: caseTransactionID,
                        caseID: caseRecord.id,
                        caseType: caseType,
                        nextDeploys: nextDeploys,
                        conditionThreeCB: conditionThreeCB,
                    })

                    if (triggerType !== scriptContext.UserEventType.CREATE) {
                        const recOldCase = scriptContext.oldRecord
                        objCaseDetails = JSON.parse(objCaseDetails)
                        //updates item to the JSON object for the "CSHUB Case Details For Script Use" Field
                        editItemInCaseType(caseRecord, recOldCase, objCaseDetails)

                        //updates appeasement amount to the JSON object for the "CSHUB Case Details For Script Use" Field
                        if (!bAmountUpdated && fltAppeasementAmt && bEnableAmtInput) {
                            log.debug('EDIT ARRAY', objCaseDetails)
                            for (let i = 0; i < objCaseDetails.length; i++) {
                                log.debug('EDIT ARRAY', objCaseDetails[i])
                                objCaseDetails[i].refAmt = fltAppeasementAmt
                            }
                            log.debug('EDIT ARRAY objCaseDetails', objCaseDetails)
                            let strCaseDetail = JSON.stringify(objCaseDetails)
                            // Updates the Case Details on edit of Appeasement
                            record.submitFields({
                                type: record.Type.SUPPORT_CASE,
                                id: caseRecord.id,
                                values: {
                                    custevent_cshub_casedtls_scrpt_use: strCaseDetail
                                }
                            })
                        }
                        if (!actionStepCB && nextDeploys) {
                            /**
                             * i.	Creates new CSHUB Case Action Step records according to the Case Step IDs Array
                             * ii.	Check the CSHUB Action Steps Created check box
                             * iii.	For all CSHUB Case Action Step records linked to the case but NOT included in the Case Step IDs Array, update the Case Action Step record and set the status to COMPLETED
                             */
                            let strMRCreateCaseActionDeploy = runtime.getCurrentScript().getParameter('custscript_ns_cshub_mr_crease_case_actn')
                            let mrScriptId = runtime.getCurrentScript().getParameter("custscript_nsts_cond_one_mr_id");
                            let scheduledTaskOne = task.create({ //TODO: parse caseId to m/r script
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: mrScriptId,
                                // deploymentId: strMRCreateCaseActionDeploy
                                params: {
                                    custscript_cshub_mr_createactionstep_cid: caseRecord.id
                                }
                            });
                            let myTaskOne = scheduledTaskOne.submit();
                            log.debug("Create new Tasks - task status,", task.checkStatus(myTaskOne))
                            let strSearch = runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_stp_srch');
                            if (strSearch) {
                                //sets case action steps that are NOT part of the CSHUB Case Step IDs Array to COMPLETED
                                log.debug("Setting Status to Complete", 'sets case action steps that are NOT part of the CSHUB Case Step IDs Array to COMPLETED')
                                let objSearchExtraIDs = search.load(strSearch)
                                let arrSteps = nextDeploys.split(',')
                                for (let i = 0; i < arrSteps.length; i++) {
                                    objSearchExtraIDs.filters.push(
                                        search.createFilter({
                                            name: 'custrecord_cshub_csactnstep_crntstp_id',
                                            operator: 'isnot',
                                            values: arrSteps[i]
                                        })
                                    )
                                }
                                objSearchExtraIDs.filters.push(
                                    search.createFilter({
                                        name: 'custrecord_cshcd_csactn_step_parent_case',
                                        operator: 'anyof',
                                        values: caseRecord.id
                                    })
                                )

                                let searchResultCount = objSearchExtraIDs.runPaged().count;
                                log.debug("supportcaseSearchObj result count", searchResultCount);
                                if (searchResultCount > 0) {
                                    objSearchExtraIDs.run().each(function (result) {
                                        // .run().each has a limit of 4,000 results
                                        // log.debug('result', result)
                                        record.submitFields({
                                            type: 'customrecord_cshub_caseactionstep',
                                            id: result.id,
                                            values: {
                                                custrecord_cshub_actnstep_stts: 6 //completed
                                            }
                                        })
                                        return true;
                                    });
                                }
                            }
                            return;

                        }

                        //Setting Manual Steps to Complete on Update of Sales Order
                        setManualStepstoComplete(nextDeploys, caseRecord, recOldCase, scriptContext, bManualEntry, caseTransactionID)
                        return;
                    }

                }
                let nextDeployId;
                if (nextDeploys.indexOf(",") > -1) {
                    nextDeployId = nextDeploys.substring(0, nextDeploys.indexOf(","))
                } else {
                    nextDeployId = nextDeploys
                }

// Script change 03-07-24

                // Initial
                // If case type == return&replace or return&refund then type=invoice
                // let caseTransactionType;
                // if(parseInt(caseType) === 3 ||parseInt(caseType) === 5 ||parseInt(caseType) === 8){
                //     caseTransactionType = record.Type.INVOICE
                // }else{
                //     caseTransactionType = record.Type.SALES_ORDER
                // }
                let caseTransactionType
                if (bManualEntry === false) {
                    caseTransactionType = getTransactionType(caseTransactionID)
                    log.debug('caseTransactionType', caseTransactionType)
                }
// Script change 03-07-24


                // get lock value from the associated transaction record
                if ((triggerType === scriptContext.UserEventType.CREATE) && (executionType === "SUITELET") && bManualEntry === false) {
                    record.submitFields({
                        type: caseTransactionType,
                        id: parseInt(caseTransactionID),
                        values: {
                            custbody_ns_lock_record: true
                        }
                    })
                }
                let lockLookup;
                if (!isEmpty(caseTransactionID) && bManualEntry === false) {
                    lockLookup = search.lookupFields({
                        type: caseTransactionType,
                        id: parseInt(caseTransactionID),
                        columns: ['custbody_ns_lock_record']
                    })
                }

                let lockCB;
                if (!isEmpty(lockLookup)) {
                    lockCB = lockLookup.custbody_ns_lock_record
                }
                if (bManualEntry === true) {
                    lockCB = true
                }

                // get all values
                log.debug({
                    title: "values",
                    details: {
                        status: status,
                        actionStepCheckbox: actionStepCB,
                        caseTransaction: caseTransactionID,
                        lockCheckBox: lockCB,
                        caseType: caseType,
                        caseTransactionType: caseTransactionType,
                        nextDeploy: nextDeploys,
                        nextDeployId: nextDeployId,
                        caseId: caseRecord.id,
                        conditionThreeCB: conditionThreeCB
                    }
                })

                //status == in progress then check further conditions
                if (parseInt(status) === 2) {
                    triggerScript(caseRecord.id, actionStepCB, lockCB, caseTransactionType, caseTransactionID, nextDeployId, conditionThreeCB, bManualEntry)
                } else {
                    log.debug("status not equal to [ In Progress ], current status:", status)
                }

            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            }
        }

        // Script change 03-07-24
        function getTransactionType(idTransaction) {
            strLogTitle = 'getTransactionType'
            let strTranType = search.lookupFields({
                id: parseInt(idTransaction),
                type: search.Type.TRANSACTION,
                columns: ['type']
            }).type[0].text
            log.debug(' strType:', strTranType)
            return strTranType.toLowerCase().replace(/\s/g, '');
        }

// Script change 03-07-24


        function triggerScript(caseID, actionStepCB, lockCB, caseTransactionType, caseTransactionID, nextDeployId, conditionThreeCB, bManualEntry) {
            strLogTitle = 'triggerScript'
            let strMRCreateCaseActionDeploy = runtime.getCurrentScript().getParameter('custscript_ns_cshub_mr_crease_case_actn')
            log.debug("triggerScript", {
                caseID: caseID,
                actionStepCB: actionStepCB,
                lockCB: lockCB,
                caseTransactionType: caseTransactionType,
                caseTransactionID: caseTransactionID,
                nextDeployId: nextDeployId,
                conditionThreeCB: conditionThreeCB
            })


            if ((actionStepCB === false) && (lockCB === true)) {
                // condition 1: run specific map/reduce script
                log.debug("condition #1 start")

                let objScriptParams = runtime.getCurrentScript();
                let mrScriptId = objScriptParams.getParameter("custscript_nsts_cond_one_mr_id");
                let scheduledTaskOne = task.create({ //TODO: parse caseId to m/r script
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrScriptId,
                    // deploymentId: strMRCreateCaseActionDeploy
                    params: {
                        custscript_cshub_mr_createactionstep_cid: caseID
                    }
                });
                let myTaskOne = scheduledTaskOne.submit();
                log.debug("condition #1 end - task status,", task.checkStatus(myTaskOne))


            } else if ((actionStepCB === true) && (lockCB === true)) {
                // condition #2: change lock and save
                log.debug("condition #2 start")

                if (bManualEntry === false) {
                    record.submitFields({
                        type: caseTransactionType,
                        id: caseTransactionID,
                        values: {
                            custbody_ns_lock_record: false
                        }
                    })
                    let lockSearch = search.lookupFields({
                        type: caseTransactionType,
                        id: caseTransactionID,
                        columns: ['custbody_ns_lock_record']
                    })
                } else {
                    lockCB = false
                }
                /*let objrecord = record.load({
                    type: record.Type.SUPPORT_CASE,
                    id: caseID
                });
                objrecord.save()*/
                log.debug("condition #2 - lock checkbox changed to:  ", lockSearch.custbody_ns_lock_record)
                // trigger the condition again to move to condition 3
                if ((bManualEntry === false && !isEmpty(lockSearch) && (lockSearch.custbody_ns_lock_record === false)) || (bManualEntry === true && lockCB === false)) {
                    lockCB = lockSearch.custbody_ns_lock_record
                    log.debug("recursive call to condition function")
                    triggerScript(caseID, actionStepCB, lockCB, caseTransactionType, caseTransactionID, nextDeployId, conditionThreeCB, bManualEntry)
                }
                log.debug("condition #2 end")


            } else if ((actionStepCB === true) && (lockCB === false) && (conditionThreeCB === false)) {
                // condition 3: run script based on saved search and get deployID and script ID
                log.debug("condition #3 start")

                let currDeployId, currScriptId, currDeploy, actionStepType;
                let intCaseActionStepSrch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_case_action_trigger')
                let caseActionSearchObj = search.load(intCaseActionStepSrch);
                caseActionSearchObj.filters.push(
                    search.createFilter({
                        name: "custrecord_cshub_csactnstep_crntstp_id",
                        operator: "is",
                        values: nextDeployId
                    })
                )
                let caseActionSearchCount = caseActionSearchObj.runPaged().count;
                log.debug("caseActionSearchCount result count", caseActionSearchCount);
                if (caseActionSearchCount === 1) {
                    caseActionSearchObj.run().each(function (result) {
                        currScriptId = result.getValue({name: "custrecord_cshub_automation_to_trigger"})
                        currDeployId = result.getValue({name: "custrecord_cshub_trigger_script_dep_id"})
                        actionStepType = result.getValue({name: "custrecord_cshub_actnstep_type"})
                        currDeploy = result.getValue({name: "custrecord_cshub_csactnstep_crntstp_id"})
                        let strScriptID = result.getValue('formulatext')
                        let intMRConfigID = result.getValue('custrecord_cas_mr_config')
                        let objParams = cshub.general.getScriptParameters(intMRConfigID, strScriptID, caseTransactionID)
                        log.debug({
                            title: "saved search result",
                            details: {
                                currScriptId: currScriptId,
                                currDeployId: currDeployId,
                                actionStepType: actionStepType,
                                currDeploy: currDeploy,
                                caseID: caseID
                            }
                        })
                        if (!isEmpty(currScriptId)) {
                            log.debug("deployment not empty")
                            //TODO: parse caseId to m/r script
                            let scheduledTaskTwo = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: currScriptId,
                                // deploymentId: currDeployId
                                params: objParams
                            });
                            let myTaskTwo = scheduledTaskTwo.submit();
                            log.debug('condition #3 end - task status', task.checkStatus(myTaskTwo));
                            record.submitFields({
                                type: record.Type.SUPPORT_CASE,
                                id: caseID,
                                values: {
                                    custevent_cshub_scrpt_trgr_cond3: true
                                }
                            })
                        }
                        return true;
                    });
                } else {
                    let custom_error = error.create({
                        name: 'UNIQUE_ID_NOT_FOUND',
                        message: 'error: unique result not found for CASE STEP ARRAY IDS saved search',
                        notifyOff: false
                    });
                    throw custom_error
                }
                log.debug("condition #3 end")
            }
        }

        function isEmpty(value) {
            let emptyValue = ((value === '' || value === null || value === undefined)
                || (value.constructor === Array && value.length === 0)
                || (value.constructor === Object && (function (v) {
                    for (let k in v) return false;
                    return true;
                })(value)));
            return emptyValue
        }

        const setManualStepstoComplete = (nextDeploys, caseRecord, recPreviousCase, scriptContext, bManualEntry, caseTransactionID) => {
            strLogTitle = 'setManualStepstoComplete';
            let intPreviousCaseStatus = recPreviousCase.getValue('custevent_cshub_casesubstatus');
            let intNewCaseStatus = caseRecord.getValue('custevent_cshub_casesubstatus')
            let intParentTransaction = caseRecord.getValue('custevent_cshub_case_tran')
            log.debug('setManualStepstoComplete', {intPreviousCaseStatus, intNewCaseStatus})
            if (scriptContext.type === scriptContext.UserEventType.XEDIT) {
                intNewCaseStatus = search.lookupFields({
                    type: search.Type.SUPPORT_CASE,
                    id: caseRecord.id, //id of new record
                    columns: 'custevent_cshub_casesubstatus'
                }).custevent_cshub_casesubstatus;
                intNewCaseStatus = intNewCaseStatus[0] ? intNewCaseStatus[0].value : null;
            }

            if (!isEmpty(intPreviousCaseStatus) && !isEmpty(intNewCaseStatus)) {
                // let intActionStep = caseRecord.getValue('custrecord_casestatus_actionstep')
                let objAutomation = search.lookupFields({
                    type: 'customrecord_cshub_casestatus',
                    id: intNewCaseStatus,
                    columns: ['custrecord_casestatus_actionstep.custrecord_cshub_automation_to_trigger', 'custrecord_casestatus_actionstep.custrecord_cshub_trigger_script_dep_id', 'custrecord_casestatus_actionstep.custrecord_cshub_csactnstep_crntstp_id', 'custrecord_casestatus_closepriorsteps', 'custrecord_casestatus_actionstep.custrecord_cas_mr_config']
                });
                let strAutomationTrigger = objAutomation["custrecord_casestatus_actionstep.custrecord_cshub_automation_to_trigger"];
                let strDeployment = objAutomation["custrecord_casestatus_actionstep.custrecord_cshub_trigger_script_dep_id"];
                let strCurrentStepId = objAutomation["custrecord_casestatus_actionstep.custrecord_cshub_csactnstep_crntstp_id"];
                let bClosePriorSteps = objAutomation.custrecord_casestatus_closepriorsteps;
                let intMRConfigID = cshub.general.getLookUpValue(objAutomation["custrecord_casestatus_actionstep.custrecord_cas_mr_config"]);
                let arrSteps = nextDeploys.split(',');


                log.debug('strAutomationTrigger', {
                    objAutomation: objAutomation,
                    strAutomationTrigger: strAutomationTrigger,
                    strDeployment: strDeployment,
                    strCurrentStepId: strCurrentStepId,
                    bClosePriorSteps: bClosePriorSteps,
                    nextDeploys: nextDeploys,
                    index: arrSteps.indexOf(strCurrentStepId)
                })

                if (!isEmpty(strAutomationTrigger)) {
                    let objMRTask = task.create({ //TODO: parse caseId to m/r script
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: strAutomationTrigger,
                        // deploymentId: strDeployment,
                        params: cshub.general.getScriptParameters(intMRConfigID, strAutomationTrigger, caseTransactionID)
                    });
                    let myTaskOne = objMRTask.submit();
                    log.debug("Create new Tasks - task status,", task.checkStatus(myTaskOne))
                }
                let strSearch = runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_stp_srch')
                if (!isEmpty(strSearch) && !isEmpty(caseRecord.id) && !isEmpty(strCurrentStepId)) {
                    let objSearchExtraIDs = search.load(strSearch)
                    objSearchExtraIDs.filters.push(
                        // search.createFilter({
                        //     name: 'custrecord_cshub_csactnstep_crntstp_id',
                        //     operator: 'is',
                        //     values: strCurrentStepId
                        // }),
                        search.createFilter({
                            name: 'custrecord_cshcd_csactn_step_parent_case',
                            operator: 'anyof',
                            values: caseRecord.id
                        })
                    )
                    if (bClosePriorSteps === true) {
                        log.debug(strLogTitle, 'Closing all prior steps')
                        let arrFilterExpression = [];
                        log.debug({
                            title: strLogTitle,
                            details: 'strCurrentStepId: ' + strCurrentStepId
                        });
                        let arrStepsLength = arrSteps.indexOf(strCurrentStepId);
                        log.debug({
                            title: strLogTitle,
                            details: 'arrStepsLength: ' + arrStepsLength
                        });
                        if (!isEmpty(strAutomationTrigger)) {
                            arrStepsLength -= 1
                        }
                        log.debug({
                            title: strLogTitle,
                            details: 'After if condition, arrStepsLength: ' + arrStepsLength
                        });
                        //2025-05-05 added to resolve issue with auto-closing ALL steps when nextDeploys is for a new case type
                        //and the index of the currentStepId is 0, i.e. first element of stepID array
                        //in this case, use nextDeploys as filter in search
                        if (arrStepsLength == -1 && arrSteps.length > 0) {
                            for (let i = 0; i < arrSteps.length; i++) {
                                if (i === 0) {
                                    arrFilterExpression.push(["custrecord_cshub_csactnstep_crntstp_id", "isnot", arrSteps[i]]);
                                } else {
                                    arrFilterExpression.push("AND", ["custrecord_cshub_csactnstep_crntstp_id", "isnot", arrSteps[i]]);
                                }
                            }
                        } else {
                        for (let i = 0; i <= arrStepsLength; i++) {

                            if (i === 0) {
                                arrFilterExpression.push(["custrecord_cshub_csactnstep_crntstp_id", "is", arrSteps[i]])
                            } else {
                                arrFilterExpression.push("OR", ["custrecord_cshub_csactnstep_crntstp_id", "is", arrSteps[i]])
                            }
                        }
                        }

                        let arrFilter = ["AND", arrFilterExpression];
                        log.debug({
                            title: strLogTitle,
                            details: 'arrFilter: ' + arrFilter
                        });
                        log.debug({
                            title: strLogTitle,
                            details: 'objSearchExtraIDs.filterExpression: ' + objSearchExtraIDs.filterExpression
                        });
                        if (!cshub.general.isEmpty(arrFilterExpression)) {
                            objSearchExtraIDs.filterExpression = objSearchExtraIDs.filterExpression.concat(arrFilter);
                        }
                        log.debug({
                            title: strLogTitle,
                            details: objSearchExtraIDs.filterExpression
                        });
                    } else {
                        log.debug(strLogTitle, 'Closing current steps');

                        if (isEmpty(strAutomationTrigger)) {
                            objSearchExtraIDs.filters.push(
                                search.createFilter({
                                    name: 'custrecord_cshub_csactnstep_crntstp_id',
                                    operator: 'is',
                                    values: strCurrentStepId
                                })
                            )
                        }
                    }
                    if (bClosePriorSteps === true || isEmpty(strAutomationTrigger)) {
                        let searchResultCount = objSearchExtraIDs.runPaged().count;
                        log.debug("supportcaseSearchObj result count", searchResultCount);

                        if (searchResultCount > 0) {
                            objSearchExtraIDs.run().each(function (result) {
                                log.debug("setManualStepstoComplete", result)
                                // .run().each has a limit of 4,000 results
                                // log.debug('result', result)
                                if (!isEmpty(result.id)) {
                                    record.submitFields({
                                        type: 'customrecord_cshub_caseactionstep',
                                        id: result.id,
                                        values: {
                                            custrecord_cshub_actnstep_stts: 6
                                        }
                                    });

                                    log.audit('setManualStepstoComplete', result.getValue('custrecord_cshub_csactnstep_crntstp_id') + ' is now complete')
                                }
                                return true;
                            });
                        }
                    }
                }


            }


        }

        const editItemInCaseType = (caseRecord, recOldCase, objCaseDetails) => {
            strLogTitle = 'editItemInCaseType'
            let intNewCaseType = caseRecord.getValue('custevent_cshub_case_type');
            let intPreviousCaseType = recOldCase.getValue('custevent_cshub_case_type');
            log.debug('editItemInCaseType', {intNewCaseType, intPreviousCaseType})
            if (intNewCaseType !== intPreviousCaseType && !isEmpty(intNewCaseType)) {
                let objItem = search.lookupFields({
                    type: 'customrecord_cshub_caseactions',
                    id: intNewCaseType,
                    columns: 'custrecord_cshub_caseactn_apps_type'
                }).custrecord_cshub_caseactn_apps_type
                let intItem = objItem[0] ? objItem[0].value : null
                log.debug('editItemInCaseType', {'intItem': intItem, 'objItem': objItem})
                if (isEmpty(intItem)) {
                    return;
                }
                log.debug('EDIT ARRAY', objCaseDetails)
                for (let i = 0; i < objCaseDetails.length; i++) {
                    log.debug('EDIT ARRAY', objCaseDetails[i])
                    objCaseDetails[i].itemName = intItem
                }
                log.debug('EDIT ARRAY objCaseDetails', objCaseDetails)
                let strCaseDetail = JSON.stringify(objCaseDetails)
                if (!isEmpty(caseRecord.id)) {
                    record.submitFields({
                        type: record.Type.SUPPORT_CASE,
                        id: caseRecord.id,
                        values: {
                            custevent_cshub_casedtls_scrpt_use: strCaseDetail
                        }
                    })
                }
            }
        }

        const validateCaseType = (recCase) => {
            strLogTitle = 'validateCaseType';
            let intCaseType = recCase.getValue('custevent_cshub_case_type');
            let intOriginalCaseType = recCase.getValue('custevent_cshub_originalcasetype');
            if (isEmpty(intOriginalCaseType) || isEmpty(intCaseType)) return;

            let intCaseParent = search.lookupFields({
                type: 'customrecord_cshub_caseactions',
                id: intCaseType,
                columns: 'parent'
            }).parent[0]
            intCaseParent = intCaseParent ? intCaseParent.value : null

            if (parseInt(intCaseType) === parseInt(intOriginalCaseType) || (!isEmpty(intCaseParent) && (parseInt(intCaseParent) === parseInt(intOriginalCaseType)))) {
                return;
            } else {
                let objError = error.create({
                    name: 'WRONG_CASE_TYPE',
                    message: 'Selected case type is not a child of the original case type.',
                    notifyOff: false
                });

                // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
                log.error('Error: ' + objError.name, objError.message);
                throw objError;
            }

        }
        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };
    });

/***
 *
 * TODO
 * - move to aftersubmit
 * - make it edit/create
 * */