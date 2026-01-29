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
 * This script will be used as library that will create Item Receipt for the selected transaction in the Customer Service Hub Suitelet
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/13           shekainah.castillo                       Initial Commit
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
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_actn_3_6_search');
            let objTransactionSearch = search.load(intSavedSearch);
            objTransactionSearch = cshub.general.filterByTransactionID(objTransactionSearch, 'custscript_ns_cs_hub_crt_ir_trnsctn')
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

    const map = (context) => {
        try {
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);
            log.debug(strLogTitle + ' objSearchResults:', objSearchResults);
            let strTransaction = objSearchResults.values.custrecord_cshub_casestep_prnt_tran.text;
            let intTranLine = objSearchResults.values.custrecord_cshub_casestep_tran_line_id;
            let intQTY = objSearchResults.values.custrecord_cshub_casestep_qty;
            let intParentCase = parseInt(objSearchResults.values.custrecord_cshcd_csactn_step_parent_case.value);

            let intRecordID = parseInt(runtime.getCurrentScript().getParameter('custscript_ns_parent_tran_type'));
            let objRMADetails = findCaseActionID(intTranLine, intParentCase, intRecordID)

            let idTransaction = parseInt(objRMADetails.objCreatedTrnsctn.value);

            let intAssociatedReason = parseInt(objSearchResults.values['custrecord_cshub_glreasoncode.CUSTRECORD_CSHUB_CASESTEP_RSN_CODE'].value);

            let strType = getTransactionType(idTransaction)
            log.debug(strLogTitle + ' Result Values:', 'idTransaction: ' + idTransaction + ' | strTransaction: ' + objRMADetails.objCreatedTrnsctn.text + ' | strType: ' + strType + ' | intTranLine: ' + intTranLine + ' | intAssociatedReason: ' + intAssociatedReason);

            context.write({
                key: {
                    idTransaction : idTransaction,
                    intParentCase : intParentCase,
                    intTranLine : intTranLine,
                    intAssociatedReason : intAssociatedReason,
                    strType : strType
                },
                //idTransaction +  '_' + intParentCase+  '_' + intTranLine+  '_' + intAssociatedReason+  '_' + strType,
                value: intQTY
            })

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let objKey = JSON.parse(context.key);
            let idTransaction = parseInt(objKey.idTransaction);
            let intTranLine = objKey.intTranLine;
            let intReason = objKey.intReason;
            let strRecType = objKey.strType;
            let intRecordID = parseInt(runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_type_ir'));
            let objCaseDetails = findCaseActionID(intTranLine, parseInt(objKey.intParentCase), intRecordID)
            log.debug('objCaseDetails', objCaseDetails);

            let recTransaction = record.transform({
                fromId: idTransaction,
                fromType: strRecType,
                toType: record.Type.ITEM_RECEIPT,
                isDynamic: true
            });

            // recTransaction.setValue({
            //     fieldId: 'custbody_br_invadj_reason',
            //     value:intReason
            // });

            let intLineCount = recTransaction.getLineCount('item')
            log.debug(strLogTitle + ' intLineCount', intLineCount)

            for(let i=0; intLineCount > i; i++) {
                let intLine = recTransaction.selectLine({
                    sublistId: 'item',
                    line: i
                });

                log.debug(strLogTitle, ' intLine: ' + intLine)
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: true
                });

                recTransaction.commitLine('item');

                log.debug(strLogTitle + ' Result Values:', 'idTransaction: ' + idTransaction + ' | strRecType: ' + strRecType + ' | intTranLine: ' + intTranLine + ' | intAssociatedReason: ' + intReason);
            }

            let idItemReceipt;
            try{
                idItemReceipt = recTransaction.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });

                log.audit('ITEM RECEIPT CREATED', 'Created From: ' + objKey.intParentCase + '| Item Receipt ID: ' + idItemReceipt);

                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: objCaseDetails.idCaseAction,
                    values:{
                        custrecord_cshcd_csactn_step_crtd_tran : idItemReceipt,
                        custrecord_cshub_actnstep_stts : 3
                    }
                });

                record.submitFields({
                    type: record.Type.ITEM_RECEIPT,
                    id: parseInt(idItemReceipt),
                    values:{
                        custbody_br_crtd_case_dtl : objCaseDetails.idCaseAction
                    }
                })

            }catch (e) {
                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: objCaseDetails.idCaseAction,
                    values:{
                        custrecord_cshub_actnstep_stts : 4
                    }
                });
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }

            if(idItemReceipt){
                const arrCaseStep = objCaseDetails.arrCaseStep.split(',')
                executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep)
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
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

    const findCaseActionID = (intTranLine, intParentCase, intRecordID) => {
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
                values: intRecordID,
            })
        );
        let idCaseAction;
        let arrCaseStep;
        let strCurrentActionStep;
        let objCreatedTrnsctn;
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
                strCurrentActionStep = result.getValue('custrecord_cshub_csactnstep_crntstp_id');
                objCreatedTrnsctn = {
                    text:result.getText('custrecord_cshcd_csactn_step_crtd_tran'),
                    value:result.getValue('custrecord_cshcd_csactn_step_crtd_tran')
                }

            });
            log.audit('result', 'idCaseAction: ' + idCaseAction + ' | arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep);

            return {
                idCaseAction: idCaseAction,
                strCurrentActionStep: strCurrentActionStep,
                arrCaseStep: arrCaseStep,
                objCreatedTrnsctn:objCreatedTrnsctn
            };
        } else {
            log.audit('No case action found.');
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
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})