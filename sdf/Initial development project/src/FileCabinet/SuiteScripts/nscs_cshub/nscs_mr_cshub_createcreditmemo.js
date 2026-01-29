/**
 *    Copyright (c) 2023, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data. It is best suited for situations where the data can be divided into small, independent parts. When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * This script will be used as library that will create Credit Memo for the selected transaction in the Customer Service Hub Suitelet
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/07           shekainah.castillo                       Initial Commit
 *2.1             2025/04/01           shekainah.castillo                       for each map() instance, run the search from the new                                                                                    search parameter (Saved Search - RMAs to Credit)
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', 'N/task', './cshub_library'], (runtime, search, record, task, cshub) => {
    let strLogTitle;

    const objScriptParameterIds = Object.freeze({
        savedSearch: 'custscript_ns_cs_hub_actn_2_2_search',
        actionIdentifier: 'custscript_cshub_crt_crmemo_action_id',
        transactionType: 'custscript_ns_cshub_case_action_type',
        associatedLineId: 'custscript_ns_cs_hub_etail_field_id_cm',
        customForm: 'custscript_cshub_createcm_customform',
        parentTranID: 'custscript_ns_cs_hub_crt_cm_trnsctn'
    });

    /**
     * @name isEmpty
     * @param value
     * @returns {boolean}
     */
    const isEmpty = (value) => {
        if (value === null)
            return true;
        if (value === undefined)
            return true;
        if (value === 'undefined')
            return true;
        if (value === '')
            return true;
        if (value.constructor === Object && Object.keys(value).length === 0)
            return true;
        if (value.constructor === Array && value.length === 0)
            return true;
        return false;
    }
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            /*let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_actn_2_2_search');
            let objTransactionSearch = search.load(intSavedSearch);
            objTransactionSearch = cshub.general.filterByTransactionID(objTransactionSearch, objScriptParameterIds.parentTranID)*/
            //modified 2024-04-25 for re-execute capability
            let objTransactionSearch;
            let savedSearchBuilder = cshub.general.mrSearchBuilder();
            if (cshub.general.isEmpty(savedSearchBuilder)) {
                throw {
                    name: 'ERR_SEARCH_BUILDER',
                    message: 'mrSearchBuilder returned no result.'
                }
            } else {
                objTransactionSearch = search.load({id: savedSearchBuilder.savedSearchId});
                if (!cshub.general.isEmpty(savedSearchBuilder.filterName) && !cshub.general.isEmpty(savedSearchBuilder.filterValue)) {
                    objTransactionSearch.filters.push(search.createFilter({
                        name: savedSearchBuilder.filterName,
                        operator: search.Operator.ANYOF,
                        values: savedSearchBuilder.filterValue
                    }));
                }
            }
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug("SearchObj result count", objSearchResultCount);

            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit('No data to process', 'Saved search is not getting results')
                return false;
            }
        } catch (e) {
            //2025-06-11 GGNS changed
            /* log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack); */
            log.error({
                title: strLogTitle,
                details: 'Name: ' + ex.name + ';<\/br><\/br>Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack
            });
            return false;
        }
    }

    const map = (context) => {
        try {
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);
            //setStatusToInProgress
            cshub.caseActionStep.changeCaseActionStepStatus(objSearchResults.id, cshub.caseActionStep.objCaseActionStepStatus.inProgress)

            log.debug(strLogTitle + ' objSearchResults:', objSearchResults);
            let idTransaction = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
            let strTransaction = objSearchResults.values.custrecord_cshub_casestep_prnt_tran.text;
            // old:
            // let intTranLine = objSearchResults.values.custcol_celigo_etail_order_line_id;

            //new:
            let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id_cm');
            log.debug(strLogTitle + 'strEtailID', strEtailID);

            // let intTranLine = objSearchResults.values[strEtailID];
            let intTranLine = objSearchResults.values.custrecord_cshub_casestep_tran_line_id;
            log.debug(strLogTitle + 'intTranline', intTranLine);

            //let intAssociatedReason = parseInt(objSearchResults.values['custrecord_cshub_glreasoncode.CUSTRECORD_CSHUB_CASESTEP_RSN_CODE'].value);
            let intAssociatedReason = 0; //ggns 2025-01-16 added for simplicity
            log.debug(strLogTitle + 'intAssociatedReason', intAssociatedReason);



            //04-01-25 change
            // let tempcaseDetail = objSearchResults.values['internalid.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL'];
            // log.debug(strLogTitle + 'tempcaseDetail', JSON.stringify(tempcaseDetail));
            //let intCaseStepID = parseInt(objSearchResults.values['internalid.custbody_cshub_createdfromcasedetail'].value);
            // let intCaseSource = parseInt(objSearchResults.values['custrecord_cshcd_csactn_step_parent_case.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL'].value);

            let intCaseStepID = parseInt(objSearchResults.id);
            log.debug(strLogTitle + 'intCaseStepID', intCaseStepID);
            let intCaseSource = parseInt(objSearchResults.values.custrecord_cshcd_csactn_step_parent_case.value);
            log.debug(strLogTitle + 'intCaseSource', intCaseSource);

            let strType = objSearchResults.recordType;

            log.debug(strLogTitle + ' Result Values:', 'idTransaction: ' + idTransaction + ' | strTransaction: ' + strTransaction + ' | strType: ' + strType + ' | intTranLine: ' + intTranLine + ' | intAssociatedReason: ' + intAssociatedReason + ' | intCaseSource: ' + intCaseSource + ' | intCaseStepID: ' + intCaseStepID + ' | strEtailID: ' + strEtailID);

            //2025-03-20 GGNS added customForm
            let transactionForm = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.customForm});

            /** 04-01-25 change
             * for each map() instance, run the search from the new parameter... add filters for Parent Case and Tran Line Id... both of these values come from the map values
             * iterate over the results from the second search... there should only be 1 result for each execution of the search
             * pass the appropriate values to reduce
             *
             */

            let intSearchRMAtoCredit = runtime.getCurrentScript().getParameter('custscript_cshub_mr_cm_ss_rmatocredit')
            let objMapDetails = {
                idTransaction: idTransaction,
                strType: strType,
                intTranLine: intTranLine,
                strTransaction: strTransaction,
                intCaseStepID: intCaseStepID,
                intCaseSource: intCaseSource,
                customForm: transactionForm
            }
            log.debug(strLogTitle, {objMapDetails})

            if(!isEmpty(intSearchRMAtoCredit)) {
                let objKey = getValuesForReduce(intSearchRMAtoCredit, objMapDetails)
                context.write({
                    key: objKey,
                    value: intAssociatedReason
                })
            }else{
                log.error('Missing Parameter', 'Please input parameter value for Saved Search - RMAs to Credit');
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let objKey = JSON.parse(context.key)//context.key.split('_');
            let idTransaction = parseInt(objKey.idTransaction);
            let strRecType = objKey.strType;
            let intTranLine = objKey.intTranLine;
            let intCaseStepID = parseInt(objKey.intCaseStepID);
            let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id_cm');
            let customForm = objKey.customForm;
            log.debug(strLogTitle, {
                ' intCaseStepID ': intCaseStepID,
                'intTranLine': intTranLine,
                'strEtailID': strEtailID
            })
            let recTransaction;
            log.debug({
                title: 'objDefaultValues',
                details: {customForm}
            });
            if (!cshub.general.isEmpty(customForm)) {
                recTransaction = record.transform({
                    fromId: idTransaction,
                    fromType: strRecType,
                    toType: record.Type.CREDIT_MEMO,
                    isDynamic: true,
                    defaultValues: {
                        customform : customForm
                    }
                });
            } else {
                recTransaction = record.transform({
                fromId: idTransaction,
                fromType: strRecType,
                toType: record.Type.CREDIT_MEMO,
                isDynamic: true,
            });
            }

            let intReason = parseInt(context.values[0]);
            log.debug(strLogTitle + ' intReason', intReason)

            let objCaseDetails = findCaseActionID(intTranLine, parseInt(objKey.intCaseSource))
            //let intCaseStepID = objCaseDetails.idCaseAction;
            log.debug('intCaseStepID', intCaseStepID);
            removeLines(intTranLine, recTransaction, strEtailID)

            let idCM;

            //try {
            //ggns added 2025-02-15 - set field value before save
            recTransaction.setValue({
                fieldId: 'custbody_cshub_createdfromcasedetail',
                value: intCaseStepID,
                ignoreFieldChange: false,
                forceSyncSourcing: true
            });
            //ggns added 2025-02-15 - set account before save if empty
            let intAccountId = recTransaction.getValue({
                fieldId: 'account'
            });
            if (isEmpty(intAccountId)) {
                log.audit({
                    title: strLogTitle,
                    details: 'No AR Account upon transform. Get Default AR account from preferences.'
                });
                let intDefaultAccountId = runtime.getCurrentUser().getPreference({
                    name: 'ARACCOUNT'
                });
                log.debug({
                    title: strLogTitle,
                    details: 'Default AR Account from Preferences: ' + intDefaultAccountId
                });
                if (isEmpty(intDefaultAccountId)) {
                    throw {
                        name: 'ERR_NO_AR_ACCOUNT',
                        message: 'Could not get default AR Account from preferences.'
                    }
                } else {
                    recTransaction.setValue({
                        fieldId: 'account',
                        value: intDefaultAccountId
                    });
                }
            }

            idCM = recTransaction.save({
                ignoreMandatoryFields: true,
                enableSourcing: true
            });
            log.audit('Credit Memo Created', 'Created From: ' + objKey.strTransaction + '| Credit Memo ID: ' + idCM);

            record.submitFields({
                type: 'customrecord_cshub_caseactionstep',
                id: intCaseStepID,
                values: {
                    custrecord_cshcd_csactn_step_crtd_tran: idCM,
                    custrecord_cshub_actnstep_stts: 3
                }
            });
            //} catch (e) {
                /*record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: intCaseStepID,
                    values: {
                        custrecord_cshub_actnstep_stts: 4
                    }
                });
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);*/
            //}

            if (!cshub.general.isEmpty(idCM)) {
                const arrCaseStep = objCaseDetails.arrCaseStep.split(',');
                //executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep)
                let taskId = cshub.general.executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep);
            }
        } catch (e) {
            record.submitFields({
                type: 'customrecord_cshub_caseactionstep',
                id: intCaseStepID,
                values: {
                    custrecord_cshub_actnstep_stts: 4
                }
            });
            log.error({
                title: "Error at [" + strLogTitle + "] function",
                details: 'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack
            });
        }
    }

    const executeNextStep = (arrCaseStep, strCurrentActionStep) => {
        strLogTitle = 'executeNextStep';
        log.debug('params', 'arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep + ' |arrCaseStep.length: ' + arrCaseStep.length)
        let intCurrentStep = arrCaseStep.indexOf(strCurrentActionStep)
        log.debug('intCurrentStep', intCurrentStep)

        if (intCurrentStep < arrCaseStep.length - 1) {
            const intNextStep = arrCaseStep[parseInt(intCurrentStep) + 1]
            log.debug('intNextStep', intNextStep)
            if (intNextStep) {
                let objNextStepSrch = search.load('customsearch_cshub_ue_002_caseactionst_2');
                objNextStepSrch.filters.push(
                    search.createFilter({
                        name: "custrecord_cshub_csactnstep_crntstp_id",
                        operator: search.Operator.IS,
                        values: intNextStep,
                    })
                );

                let searchResultCount = objNextStepSrch.runPaged().count;
                if (searchResultCount > 0) {
                    let strDeploymentID;
                    let strScriptID;
                    let strExpectedRecord;
                    let objMRDetail = {};
                    objNextStepSrch.run().each(function (result) {
                        strScriptID = result.getValue('custrecord_cshub_automation_to_trigger');
                        strDeploymentID = result.getValue('custrecord_cshub_trigger_script_dep_id');
                        strExpectedRecord = result.getText('custrecord_cshcd_csactn_step_exp_tran');
                        objMRDetail.strScriptID = result.getValue('formulatext')
                        objMRDetail.intMRConfigID = result.getValue('custrecord_cas_mr_config')
                    });
                    log.debug('Result', 'strScriptID: ' + strScriptID + '| strDeploymentID: ' + strDeploymentID + '| strExpectedRecord: ' + strExpectedRecord)
                    objMRDetail.intParentTransaction = runtime.getCurrentScript().getParameter(objScriptParameterIds.parentTranID)
                    if (strScriptID && strDeploymentID) {
                        let objMapReduce = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: strScriptID,
                            // deploymentId: strDeploymentID,
                            params : cshub.general.getScriptParameters(objMRDetail.intMRConfigID, objMRDetail.strScriptID, objMRDetail.intParentTransaction)
                        });
                        objMapReduce.submit();
                        log.audit('Task Submitted', 'Executing MR Script to create ' + strExpectedRecord);
                    } else {
                        log.audit('Process Ends', 'No deployment detail to execute on the step');
                    }
                }

            }

        } else {
            log.audit('Process Ends', 'No more succeeding step');
        }
    }

    const findCaseActionID = (intTranLine, intParentCase) => {
        const logTitle = 'findCaseActionID';
        log.debug({
            title: logTitle,
            details: 'intTranLine: ' + intTranLine + '; intParentCase: ' + intParentCase
        });
        try {
            //let intTransactionType = parseInt(runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_type'));
            let intTransactionType = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.transactionType});

            log.debug('intTransactionType', intTransactionType);

            let objSearchCase = search.load({id: 'customsearch_cshub_findactionstepid'});
            objSearchCase.filters.push(
                search.createFilter({
                    name: "custrecord_cshcd_csactn_step_parent_case",
                    operator: search.Operator.ANYOF,
                    values: parseInt(intParentCase),
                }),
                search.createFilter({
                    name: "custrecord_cshub_casestep_tran_line_id",
                    operator: search.Operator.IS,
                    values: intTranLine,
                }),
                search.createFilter({
                    name: "custrecord_cshcd_csactn_step_exp_tran",
                    operator: search.Operator.ANYOF,
                    values: intTransactionType
                })
            );
            //log.debug('Current Search', objSearchCase)
            log.debug({
                title: logTitle,
                details: 'objSearchCase: ' + JSON.stringify(objSearchCase)
            });
            let idCaseAction;
            let arrCaseStep;
            let strCurrentActionStep;
            let searchResultCount = objSearchCase.runPaged().count;
            log.debug("objSearchCase result count", searchResultCount);
            if (searchResultCount > 0) {
                objSearchCase.run().each(function (result) {
                    log.debug('result', result)
                    idCaseAction = result.id;
                    arrCaseStep = result.getValue({
                        name: 'custevent_cshub_casestep_array_ids',
                        join: 'CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE'
                    });
                    strCurrentActionStep = result.getValue('custrecord_cshub_csactnstep_crntstp_id')
                });
                log.audit('result', 'idCaseAction: ' + idCaseAction + ' | arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep);

                return {
                    idCaseAction: idCaseAction,
                    strCurrentActionStep: strCurrentActionStep,
                    arrCaseStep: arrCaseStep
                };
            } else {
                log.audit('No case action found.');
                return 0;
            }
        } catch (ex) {
            log.error({
                title: logTitle,
                details: JSON.stringify(ex)
            });
            return 0;
        }

    }

    const summarize = (summary) => {
        try {
            strLogTitle = 'summarize';

            log.audit(strLogTitle, 'Execution time in seconds: ' + summary.seconds +
                ' | Usage Consumed: ' + summary.usage +
                ' | Usage Consumed: ' + summary.yields +
                ' | Concurrency Number: ' + summary.concurrency
            );
            if (summary.inputSummary.error !== null) {
                log.error('Input Error: ', summary.inputSummary.error);
            }
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error: ', error);
                return true;
            });

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const getValuesForReduce = (intSearchRMAtoCredit, objMapDetails) => {
        strLogTitle = 'getValuesForReduce'
        let objSearch = search.load(intSearchRMAtoCredit)
        objSearch.filters.push(
            search.createFilter({
                name: "custrecord_cshcd_csactn_step_parent_case",
                join: "CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL",
                operator: 'anyof',
                values: objMapDetails.intCaseSource
            }),
            search.createFilter({
                name: 'custrecord_cshub_casestep_tran_line_id',
                join: "CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL",
                operator: 'is',
                values: objMapDetails.intTranLine
            })
        )
        let intSearchCount = objSearch.runPaged().count;
        log.debug(strLogTitle, {intSearchCount})
        //if(parseInt(intSearchCount) === 1){
        if(parseInt(intSearchCount) > 0){
            let objKey = {}
            objSearch.run().each(function (result) {
                objKey = {
                    idTransaction: result.id,
                    strType: result.recordType,
                    intTranLine: objMapDetails.intTranLine,
                    strTransaction: result.getValue('tranid'),
                    intCaseStepID: objMapDetails.intCaseStepID,
                    intCaseSource: objMapDetails.intCaseSource,
                    customForm: objMapDetails.customForm
                }
            });
            log.debug(strLogTitle, {objKey})
            return objKey;
        }
    }


    const getTransactionType = (idTransaction) => {
        strLogTitle = 'getTransactionType';
        let strTranType = search.lookupFields({
            id: idTransaction,
            type: search.Type.TRANSACTION,
            columns: ['type']
        }).type[0].text
        log.debug(strLogTitle + ' strType:', strTranType)
        return strTranType.toLowerCase().replace(/\s/g, '');
    }

    const removeLines = (intTranLine, recTransaction, strEtailID) => {
        strLogTitle = 'removeLines';
        let intLineCount = recTransaction.getLineCount('item')
        log.debug(strLogTitle + ' intLineCount', intLineCount)
        for (let j = intLineCount - 1; j >= 0; j--) {

            let intCurrentTranLine = recTransaction.getSublistValue({
                sublistId: 'item',
                fieldId: strEtailID,
                line: j
            });
            log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine)

            if (intCurrentTranLine !== intTranLine) {
                recTransaction.removeLine({
                    sublistId: 'item',
                    line: j,
                });
                log.debug(strLogTitle, ' intCurrentTranLine' + intCurrentTranLine + '| intTranLine' + intTranLine + ' <\/br><\/br>--LINE ' + j + ' DROPPED--')
            } else {
                log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine + '| intTranLine: ' + intTranLine + ' <\/br><\/br>--LINE ' + j + ' COMMITTED--')
            }
        }

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})