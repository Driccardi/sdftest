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
 * This script will be used as library that replace the sales order selected in the Customer Service Hub Suitelet
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/08           shekainah.castillo                       Initial Commit
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
        savedSearch: 'custscript_ns_cs_hub_actn_3_3_search',
        actionIdentifier: 'custscript_cshub_crt_rplc_action_id',
        transactionType: 'custscript_ns_cshub_case_action_type_so',
        associatedLineId: 'custscript_ns_cs_hub_etail_field_id_so',
        genericItem: 'custscript_cshub_mr_so_item',
        defaultStatus: 'custscript_cshub_mr_repso_defstatus',
        customForm: 'custscript_cshub_mr_repso_form',
        searchCAS: 'custscript_cshub_mr_so_actionstep_srch',
        parentTranID: 'custscript_ns_cs_hub_so_rplc_trnsctn'
    });

    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';

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
                objTransactionSearch.filters.push(search.createFilter({
                    name: savedSearchBuilder.filterName,
                    operator: search.Operator.ANYOF,
                    values: savedSearchBuilder.filterValue
                }));
            }
            /*objTransactionSearch = search.load({id: currentParameterIds.param_caseActionStepSearch});
            if(!cshub.general.isEmpty(intParentTranId)){
                objTransactionSearch.filters.push(
                    search.createFilter({
                        //name: 'custrecord_cshub_casestep_prnt_tran',
                        name: filterName,
                        operator: search.Operator.ANYOF,
                        values: intParentTranId
                    })
                );
            }*/
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug({
                title: strLogTitle,
                details: 'objSearchResultCount: ' + objSearchResultCount
            });
            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit({
                    title: strLogTitle,
                    details: 'Saved search returned no results. No data to process.'
                });
                return false;
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            return false;
        }
    }

    const map = (context) => {
        try {
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);

            //setStatusToInProgress
            cshub.caseActionStep.changeCaseActionStepStatus(objSearchResults.id, cshub.caseActionStep.objCaseActionStepStatus.inProgress)

            log.debug(strLogTitle + ' objSearchResults:', objSearchResults)
            let idTransaction = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
            log.debug(strLogTitle + 'idTransaction:', idTransaction);
            //verify that the created from is sales order
            let intCreatedFromID = getCreatedFrom(idTransaction)
            if (intCreatedFromID) {
                let strType = getTransactionType(intCreatedFromID)
                if (strType === record.Type.SALES_ORDER) {
                    getValuesAndPassToReduce(context, objSearchResults, intCreatedFromID, idTransaction, strType)
                }
            }


        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let objKey = JSON.parse(context.key)//.split('_');
            let idTransaction = parseInt(objKey.idCreatedFrom);
            let strCurrentStep = objKey.strCurrentStep
            let intTranLine = objKey.lineId;
            let intParentCase = parseInt(objKey.parentCase);
            log.debug(strLogTitle + ' Keys', context.key)
            log.debug(strLogTitle + ' context', context.values)
            let objCaseDetails = findCaseActionID(intTranLine, intParentCase, strCurrentStep)
            let idCaseAction = parseInt(objCaseDetails.idCaseAction);
            let intCaseID = objKey.intCaseID
            log.debug('VALUES LENGTH', context.values.length)
            //2025-03-20 GGNS added customForm
            let transactionForm = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.customForm});
            for (let i = 0; context.values.length > i; i++) {
                let objValues = JSON.parse(context.values[i]);
                let intQTY = objValues.intQty;
                let intLocation = objValues.intLocation
                let intAssociatedReason = objValues.intAssociatedReason
                let strTransaction = objValues.strTransaction
                let intTransactionSource = objValues.intTransactionSource
                log.debug(strLogTitle + ' Record Copy Values', {idTransaction, intCaseID, strTransaction})
                let recTransaction = record.copy({
                    id: idTransaction,
                    type: record.Type.SALES_ORDER,
                    isDynamic: true,
                    defaultValues: {
                        customform: transactionForm
                    }
                });
                cshub.general.removeSuitePromotions(recTransaction)
                let intStatus = runtime.getCurrentScript().getParameter('custscript_cshub_mr_repso_defstatus')
                if(!isEmpty(intStatus)){
                    log.debug('intStatus',intStatus)
                    recTransaction.setValue({
                        fieldId: 'orderstatus',
                        value: getSOEnumStatus(intStatus)
                    });
                }

                if(!isEmpty(intCaseID)){
                    recTransaction.setValue({
                        fieldId: 'custbody_cshub_createdfromcasedetail',
                        value: intCaseID
                    });
                    log.debug('intCaseID',intCaseID)
                }

                recTransaction.setValue({
                    fieldId: 'custbody_cshub_replacementof',
                    value: intTransactionSource
                });
                log.debug('intTransactionSource',intTransactionSource)


                removeLines(intTranLine, recTransaction, intQTY, intLocation)
                strLogTitle = 'Saving SO'
                let idSO;
                try {
                    let headerFieldsCleared = cshub.general.clearHeaderFields(recTransaction);
                    log.debug({
                        title: 'headerFieldsCleared',
                        details: headerFieldsCleared
                    });
                    idSO = recTransaction.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true
                    });

                    log.audit('SO COPY CREATED', 'Created From: ' + strTransaction + '| SO ID: ' + idSO);

                    record.submitFields({
                        type: 'customrecord_cshub_caseactionstep',
                        id: idCaseAction,
                        values: {
                            custrecord_cshcd_csactn_step_crtd_tran: idSO,
                            custrecord_cshub_actnstep_stts: 3
                        }
                    });

                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: parseInt(idSO),
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

                if (idSO) {
                    const arrCaseStep = objCaseDetails.arrCaseStep.split(',');
                    //executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep)
                    let taskId = cshub.general.executeNextStep(arrCaseStep, objCaseDetails.strCurrentActionStep);
                }
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const findCaseActionID = (intTranLine, intParentCase, strCurrentStep) => {
        let intRecordID = parseInt(runtime.getCurrentScript().getParameter('custscript_ns_cshub_case_action_type_so'));
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
            }),
            search.createFilter({
                name:'custrecord_cshub_csactnstep_crntstp_id',
                operator: search.Operator.IS,
                values: strCurrentStep
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
                    } else {
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

    const getValuesAndPassToReduce = (context, objSearchResults, intCreatedFromID, idTransaction, strType) => {
        let intTranLine = objSearchResults.values.custrecord_cshub_casestep_tran_line_id;
        let intAssociatedReason = parseInt(objSearchResults.values.custrecord_cshub_casestep_rsn_code.value);
        let strCurrentStep =objSearchResults.values.custrecord_cshub_csactnstep_crntstp_id;
        let intQty = parseInt(objSearchResults.values.custrecord_cshub_casestep_qty);
        let intLocation = parseInt(objSearchResults.values.custrecord_cshub_actnstep_intrns_rec_loc)
        let strTransaction = objSearchResults.values.custrecord_cshub_casestep_prnt_tran.text;
        let intTransactionSource = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
        let intParentCase = parseInt(objSearchResults.values.custrecord_cshcd_csactn_step_parent_case.value);
        let intCaseID = objSearchResults.id
        log.debug(strLogTitle + ' Result Values:', 'idTransaction: ' + idTransaction + ' | strType: ' + strType + ' | intTranLine: ' + intTranLine + ' | intAssociatedReason: ' + intAssociatedReason + ' | intQty: ' + intQty + ' | intLocation: ' + intLocation + ' | strTransaction: ' + strTransaction + ' | intTransactionSource: ' + intTransactionSource + ' | intParentCase: ' + intParentCase + ' | current step: ' + strCurrentStep);

        context.write({
            key: {
                idCreatedFrom: intCreatedFromID,
                lineId: intTranLine,
                parentCase: intParentCase,
                intCaseID: intCaseID,
                strCurrentStep: strCurrentStep
            },
            //intCreatedFromID + '_' + intTranLine + '_' + intParentCase,
            value: {
                intAssociatedReason: intAssociatedReason,
                intQty: intQty,
                strTransaction: strTransaction,
                intTransactionSource: intTransactionSource,
                intLocation: intLocation
            }
        })
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

    const getCreatedFrom = (idTransaction) => {
        strLogTitle = 'getCreatedFrom';
        let objCreatedFrom = search.lookupFields({
            id: idTransaction,
            type: search.Type.TRANSACTION,
            columns: ['createdfrom']
        })
        log.debug(strLogTitle + ' Created From ID:', objCreatedFrom)
        if (objCreatedFrom.createdfrom[0]) {
            let intID = objCreatedFrom.createdfrom[0].value
            log.debug(strLogTitle + ' Created From ID:', intID)
            return intID;
        }
    }

    const removeLines = (intTranLine, recTransaction, intQTY, intLocation) => {
        strLogTitle = 'removeLines';
        let intLineCount = recTransaction.getLineCount('item')
        log.debug(strLogTitle + ' intLineCount', intLineCount);
        log.debug(strLogTitle, ' intTranLine: ' + intTranLine);
        let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id_so');
        log.debug('Associted Line Id Field: ', strEtailID)
        let intGenericItem = runtime.getCurrentScript().getParameter('custscript_cshub_mr_so_item');
        for (let j = intLineCount - 1; j >= 0; j--) {
            recTransaction.selectLine({
                sublistId: 'item',
                line: j,
            });
            let intCurrentTranLine = recTransaction.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: strEtailID,
                line: j
            });

            let fltAmount = recTransaction.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: j
            });

            log.debug(strLogTitle, ' fltAmount: ' + fltAmount);
            log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine);

            if(isEmpty(intGenericItem) && intCurrentTranLine === intTranLine){
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: intQTY
                    // line: j,
                });

                //set location value
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: intLocation
                    // line: j,
                });

                if(!isEmpty(intGenericItem)){
                    recTransaction.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: intGenericItem,
                        // line: j,
                    });
                }else{
                    let intItem = recTransaction.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                    });
                    cshub.general.removeInventoryDetail(intItem, recTransaction);
                }

                //2025-06-05 GGNS Commented based on test issue 531 - need amount to be rate * qty
                // recTransaction.setCurrentSublistValue({
                //     sublistId: 'item',
                //     fieldId: 'amount',
                //     value: fltAmount
                //     // line: j,
                // });

                recTransaction.commitLine('item')
                log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine + '| intTranLine: ' + intTranLine + ' <\/br><\/br>--LINE ' + j + ' COMMITTED--')
            }else{
                recTransaction.removeLine({
                    sublistId: 'item',
                    line: j,
                    // ignoreRecalc: true
                });
            }
        }
        if (!isEmpty(intGenericItem)) {
            log.debug(strLogTitle, "Committing Generic Item: " + intGenericItem)
            recTransaction.selectNewLine({
                sublistId: "item",
                // line: 0
            })
            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: intGenericItem
            });

            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                value: intLocation
            });

            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: 1
            });

            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: strEtailID,
                value: intTranLine
            });
            let fltAmount = recTransaction.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
            });
            if(!isEmpty(fltAmount)) {
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: 0.00
                    // line: j,
                });
            }
            recTransaction.commitLine("item")
            log.debug(strLogTitle, "Generic Item Committed")
        }

    }

    const isEmpty = (stValue) => {
        return ((stValue === '' || stValue == null || stValue == undefined)
            || (stValue.constructor === Array && stValue.length == 0)
            || (stValue.constructor === Object && (function (v) {
                for (var k in v) return false;
                return true;
            })(stValue)));
    };

    const getSOEnumStatus = (intStatus) => {
        intStatus = parseInt(intStatus)
        let objSOStatus = {
            11 : 'A', //pending approval
            12 : 'B', //pending fulfillment
            13 : 'C', //cancelled
            14 : 'D', //partially fulfilled
            15 : 'E', //pending billing/partially fulfilled
            16 : 'F', //pending billing
            17 : 'G', //billed
            18 : 'H', //closed
        }
        return objSOStatus[intStatus]
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})