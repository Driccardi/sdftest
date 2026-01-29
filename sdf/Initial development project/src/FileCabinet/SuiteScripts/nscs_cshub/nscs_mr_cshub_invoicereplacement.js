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
 * This script will be used as library that will create Invoices for the selected transaction in the Customer Service Hub Suitelet
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/07           shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', 'N/task'], (runtime, search, record, task) => {
    let strLogTitle;
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_actn_3_4_1_search');
            let objTransactionSearch = search.load(intSavedSearch);
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug("SearchObj result count", objSearchResultCount);

            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit('No data to process', 'Saved search is not getting results')
                return false;
            }
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }


    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let objSearchResults = JSON.parse(context.values);
            log.debug(strLogTitle + ' objSearchResults:', objSearchResults);
            let idTransaction = objSearchResults.id;
            let strRecType = getTransactionType(idTransaction)
            let intTranLine = objSearchResults.values['custrecord_cshub_casestep_tran_line_id.CUSTBODY_BR_CRTD_CASE_DTL'];
            let intParentCase = objSearchResults.values['custrecord_cshcd_csactn_step_parent_case.CUSTBODY_BR_CRTD_CASE_DTL'].value;
            log.debug(strLogTitle + ' objSearchResults:', 'idTransaction: ' + idTransaction + ' | intTranLine: ' + intTranLine + ' | intParentCase: ' + intParentCase)
            let objCaseDetails = findCaseActionID(intTranLine, intParentCase)
            let idCaseAction = parseInt(objCaseDetails.idCaseAction);


            let idInvoice
            try {
                idInvoice = transformToInvoice(idTransaction, strRecType)
                log.audit('Invoice Created', 'Created From: ' + idTransaction + '| Invoice ID: ' + idInvoice);

                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: idCaseAction,
                    values: {
                        custrecord_cshcd_csactn_step_crtd_tran: idInvoice,
                        custrecord_cshub_actnstep_stts: 3
                    }
                });

                record.submitFields({
                    type: record.Type.INVOICE,
                    id: parseInt(idInvoice),
                    values: {
                        custbody_br_crtd_case_dtl: idCaseAction
                    }
                });

            } catch (e) {
                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: idCaseAction,
                    values: {
                        custrecord_cshub_actnstep_stts: 4
                    }
                });
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }

            if(idInvoice){
                const arrCaseStep = objCaseDetails.arrCaseStep.split(',')
                executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep)
            }


        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const findCaseActionID = (intTranLine, intParentCase) => {
        let intRecordID = parseInt(runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_type_inv'));
        let objSearchCase = search.load({id: 'customsearch_br_cshub_find_actn_step_id'});
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
                values: intRecordID,
            })
        );
        log.debug('Current Search', objSearchCase)
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
                    objNextStepSrch.run().each(function (result) {
                        strScriptID = result.getValue('custrecord_cshub_automation_to_trigger');
                        strDeploymentID = result.getValue('custrecord_cshub_trigger_script_dep_id');
                        strExpectedRecord = result.getText('custrecord_cshcd_csactn_step_exp_tran')
                    });
                    log.debug('Result', 'strScriptID: ' + strScriptID + '| strDeploymentID: ' + strDeploymentID + '| strExpectedRecord: ' + strExpectedRecord)

                    if (strScriptID && strDeploymentID) {
                        let objMapReduce = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: strScriptID,
                            deploymentId: strDeploymentID,
                        });
                        objMapReduce.submit();
                        log.audit('Task Submitted', 'Executing MR Script to create ' + strExpectedRecord);
                    }else{
                        log.audit('Process Ends', 'No deployment detail to execute on the step');
                    }

                }

            }

        } else {
            log.audit('Process Ends', 'No more succeeding step');
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


    const transformToInvoice = (idTransaction, strRecType) => {
        strLogTitle = 'getTransactionType';
        let recInvoice = record.transform({
            fromId: idTransaction,
            fromType: strRecType,
            toType: record.Type.INVOICE,
            isDynamic: true
        });
        recInvoice.save({
            ignoreMandatoryFields: true
        })
        return recInvoice.id;
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


    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
})