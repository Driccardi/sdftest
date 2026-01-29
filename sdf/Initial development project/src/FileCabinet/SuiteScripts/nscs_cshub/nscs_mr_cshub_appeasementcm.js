/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data. It is best suited for situations where the data can be divided into small, independent parts. When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * This script will be used for the CS Hub Appeasement. It creates a stand-alone credit memo per case created from the cs hub appeasement.
 *
 * Version          Date                      Author                                Remarks
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record','N/task', './cshub_library'], (runtime, search, record, task, cshub) => {
    let strLogTitle;

    const objScriptParameterIds = Object.freeze({
        savedSearch: 'custscript_cshub_cm_apps_srch',
        actionIdentifier: 'custscript_cshub_cm_apps_act_id',
        transactionType: 'custscript_cshub_trantype',
        associatedLineId: 'custscript_cshub_line_item',
        customForm: 'custscript_cshub_mr_appeasementcmform',
        parentTranID: 'custscript_cshub_mr_appcm_transaction'
    });

    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';

            /*let intSavedSearch = getParameter('custscript_cshub_cm_apps_srch');
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
                objTransactionSearch.filters.push(search.createFilter({
                    name: savedSearchBuilder.filterName,
                    operator: search.Operator.ANYOF,
                    values: savedSearchBuilder.filterValue
                }));
            }
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug("SearchObj result count", objSearchResultCount);
            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit('No data to process', 'No Search Results. Terminating')
                return false;
            }
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            return false;
        }
    }

    const reduce = (context) => {
        let intCaseID;
        try {
            strLogTitle = 'reduce';
            // log.debug(strLogTitle + ' context', context)
            // log.debug(strLogTitle + ' context', context.values)
            for (let i = 0; context.values.length > i; i++) {
                let objSearchResults = JSON.parse(context.values[i]);
                log.debug(strLogTitle + ' objValues', objSearchResults);
                intCaseID = parseInt(objSearchResults.id);
                //setStatusToInProgress
                cshub.caseActionStep.changeCaseActionStepStatus(objSearchResults.id, cshub.caseActionStep.objCaseActionStepStatus.inProgress)
                let intCaseParent = parseInt(objSearchResults.values.custrecord_cshcd_csactn_step_parent_case.value);
                let intParentTran = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
                let intProcessSO = intParentTran ? getProcessedForSO(intParentTran) : null;
                !intProcessSO ? intProcessSO = intParentTran : null;
                let intCustomer = parseInt(objSearchResults.values["company.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE"].value);
                let objTransactionDetail = JSON.parse(objSearchResults.values["custevent_cshub_casedtls_scrpt_use.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE"])[0];
                let strCaseStep = objSearchResults.values["custevent_cshub_casestep_array_ids.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE"];
                let strCurrentActionStep = objSearchResults.values.custrecord_cshub_csactnstep_crntstp_id;
                //2025-03-20 GGNS added custom form
                let transactionForm = getParameter(objScriptParameterIds.customForm);

                let objHeader = {
                    customer: intCustomer,
                    salesOrder: intProcessSO,
                    location:objTransactionDetail.receiptLocation,
                    reason: parseInt(objTransactionDetail.returnReason),
                    refund: objTransactionDetail.refund === "T",
                    customForm: transactionForm,
                    caseActionStep: intCaseID
                }

                let objSublist = {
                    item: parseInt(objTransactionDetail.itemName),
                    quantity: parseInt(objTransactionDetail.quantity),
                    rate: objTransactionDetail.refAmt ? parseFloat(objTransactionDetail.refAmt) : 0.00,
                }

                log.debug(strLogTitle, {
                    Header: objHeader,
                    Sublist: objSublist,
                    strCaseStep: strCaseStep,
                    strCurrentActionStep: strCurrentActionStep
                });


                let idTransaction;
                //try {
                    let recTransaction = createTransaction(objHeader, objSublist)
                    recTransaction.setValue({
                        fieldId: 'custbody_cshub_createdfromcasedetail',
                        value: intCaseID
                    });
                    idTransaction = recTransaction.save({
                        ignoreMandatoryFields: true,
                        enableSourcing: true
                    });
                    log.audit('Transaction Created', ' CM ID: ' + idTransaction);

                    /*record.submitFields({
                        //type: getParameter('custscript_cshub_trantype'),
                        type: record.Type.CREDIT_MEMO,
                        id: parseInt(idTransaction),
                        values:{
                            custbody_cshub_createdfromcasedetail : intCaseID
                        }
                    });*/


                //} catch (e) {
                    /*record.submitFields({
                        type: 'customrecord_cshub_caseactionstep',
                        id: intCaseID,
                        values:{
                            custrecord_cshub_actnstep_stts : 4
                        }
                    });*/
                /*cshub.caseActionStep.changeCaseActionStepStatus(intCaseID, cshub.caseActionStep.objCaseActionStepStatus.error);
				log.error("Error at [" + strLogTitle + "] function",
					'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);*/
               //}

                if (idTransaction) {
                    record.submitFields({
                        //type: 'customrecord_cshub_caseactionstep',
                        type: cshub.general.recordTypes_CSHUB.caseActionStep,
                        id: intCaseID,
                        values:{
                            custrecord_cshcd_csactn_step_crtd_tran : idTransaction,
                            custrecord_cshub_actnstep_stts : 3
                        }
                    });
                    const arrCaseStep = strCaseStep.split(',')
                    cshub.general.executeNextStep(arrCaseStep, strCurrentActionStep);
                }

            }


        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            cshub.caseActionStep.changeCaseActionStepStatus(intCaseID, cshub.caseActionStep.objCaseActionStepStatus.error);
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

    const getParameter = (id) => {
        return runtime.getCurrentScript().getParameter(id);
    }

    const createTransaction = (objHeader, objSublist) => {
        strLogTitle = 'createCreditMemo';

        const recTransaction = record.create({
            //type: getParameter('custscript_cshub_trantype'),
            type: record.Type.CREDIT_MEMO,
            isDynamic: true,
            //2025-03-20 GGNS added defaultValues
            defaultValues: {
                customform: objHeader.customForm
            }
        });

        recTransaction.setValue({
            fieldId: 'entity',
            value: objHeader.customer
        });

        recTransaction.setValue({
            fieldId: 'custbody_br_prcsd_for_so',
            value: objHeader.salesOrder
        });

        recTransaction.setValue({
            fieldId: 'location',
            value: objHeader.location
        });

        // recTransaction.setValue({
        //     fieldId: 'custbody_br_invadj_reason',
        //     value: objHeader.reason
        // });

        recTransaction.setValue({
            fieldId: 'custbody_cshub_dont_refund',
            value: objHeader.refund
        });

        recTransaction.selectLine({
            sublistId: 'item',
            line: 0
        });

        recTransaction.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: objSublist.item,

        });

        recTransaction.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            value: objSublist.quantity,
        });

        recTransaction.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: objSublist.rate,
        });

        recTransaction.commitLine('item')


        return recTransaction
    }


    const getProcessedForSO = (id) => {
        strLogTitle = 'getProcessedForSO';
        let objCreatedFrom = search.lookupFields({
            type: getTransactionType(id),
            id: parseInt(id),
            columns: 'createdfrom'
        });
        return cshub.general.getLookUpValue(objCreatedFrom.createdfrom)
    }

    const getTransactionType = (idTransaction) => {
        strLogTitle = 'getTransactionType';
        let strTranType = search.lookupFields({
            id: parseInt(idTransaction),
            type: search.Type.TRANSACTION,
            columns: ['type']
        }).type[0].text
        log.debug(strLogTitle + ' strType:', strTranType)
        return strTranType.toLowerCase().replace(/\s/g, '');
    }


    // const executeNextStep = (arrCaseStep, strCurrentActionStep) => {
    //     strLogTitle = 'executeNextStep';
    //
    //     let intCurrentStep = arrCaseStep.indexOf(strCurrentActionStep)
    //     log.debug('intCurrentStep', intCurrentStep)
    //
    //     if (intCurrentStep < arrCaseStep.length) {
    //         const intNextStep = arrCaseStep[parseInt(intCurrentStep) + 1]
    //         log.debug('intNextStep', intNextStep)
    //         let objNextStepSrch = search.load('customsearch_cshub_ue_002_caseactionst_2');
    //         objNextStepSrch.filters.push(
    //             search.createFilter({
    //                 name: "custrecord_cshub_csactnstep_crntstp_id",
    //                 operator: search.Operator.IS,
    //                 values: intNextStep,
    //             })
    //         );
    //
    //         let searchResultCount = objNextStepSrch.runPaged().count;
    //         if (searchResultCount > 0) {
    //             let strDeploymentID;
    //             let strScriptID;
    //             let strExpectedRecord;
    //             objNextStepSrch.run().each(function (result) {
    //                 strScriptID = result.getValue('custrecord_cshub_automation_to_trigger');
    //                 strDeploymentID = result.getValue('custrecord_cshub_trigger_script_dep_id');
    //                 strExpectedRecord = result.getText('custrecord_cshcd_csactn_step_exp_tran')
    //             });
    //             log.debug('Result', 'strScriptID: ' + strScriptID + '| strDeploymentID: ' + strDeploymentID + '| strExpectedRecord: ' + strExpectedRecord)
    //
    //             if (strScriptID && strDeploymentID) {
    //                 let objMapReduce = task.create({
    //                     taskType: task.TaskType.MAP_REDUCE,
    //                     scriptId: strScriptID,
    //                     deploymentId: strDeploymentID,
    //                 });
    //                 objMapReduce.submit();
    //                 log.audit('Task Submitted', 'Executing MR Script:' + strScriptID);
    //             } else {
    //                 log.audit('Process Ends', 'No deployment detail to execute on the step');
    //             }
    //         }
    //
    //     }
    // }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
})