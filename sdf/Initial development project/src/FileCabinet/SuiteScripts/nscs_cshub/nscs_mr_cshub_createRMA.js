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
 * This script will be used as library that will create RMA for the selected transaction in the Customer Service Hub Suitelet
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

define(['N/runtime', 'N/search', 'N/record', 'N/task', './cshub_library'], (runtime, search, record, task, cshub) => {
    let strLogTitle;

    const objScriptParameterIds = Object.freeze({
        savedSearch: 'custscript_ns_cs_hub_actn_2_1_search',
        searchLineUniqueKey: 'custscript_ns_br_unique_etail_search_2_1',
        actionIdentifier: 'custscript_cshub_crt_rma_action_id',
        associatedLineId: 'custscript_ns_cs_hub_etail_field_id_rma',
        genericItem: 'custscript_cshub_mr_rma_item',
        customForm: 'custscript_cshub_mr_customform_rma',
        parentTranID: 'custscript_ns_cs_hub_crt_rma_trnsctn'
    });

    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            /*let intSavedSearch = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.savedSearch});
            let objTransactionSearch = search.load({id: intSavedSearch});
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
                log.audit('No data to process', 'Saved search is not getting results')
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
            log.debug('Search Result', objSearchResults)
            let intCaseID = parseInt(objSearchResults.id);

            //setStatusToInProgress
            cshub.caseActionStep.changeCaseActionStepStatus(intCaseID, cshub.caseActionStep.objCaseActionStepStatus.inProgress);

            let idTransaction = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
            let strTransaction = objSearchResults.values.custrecord_cshub_casestep_prnt_tran.text;
            let intTranLine = objSearchResults.values.custrecord_cshub_casestep_tran_line_id;
            let intReason = parseInt(objSearchResults.values.custrecord_cshub_casestep_rsn_code.value);
            let intAssociatedReason = parseInt(objSearchResults.values["custrecord_cshub_glreasoncode.CUSTRECORD_CSHUB_CASESTEP_RSN_CODE"].value);
            let arrCaseStep = objSearchResults.values["custevent_cshub_casestep_array_ids.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE"];
            let intItem = objSearchResults.values.custrecord_cshub_actnstep_item.value;
            let strCurrentActionStep = objSearchResults.values.custrecord_cshub_csactnstep_crntstp_id;
            // set of quantity
            let intQuantity = objSearchResults.values.custrecord_cshub_casestep_qty;
            //set of location
            let intLocation = objSearchResults.values.custrecord_cshub_actnstep_intrns_rec_loc;
            let boolDoNotRefund = objSearchResults.values.custrecord_cshub_actnstep_dntrfnd_flag;
            let strType = getTransactionType(idTransaction)
            log.debug(strLogTitle + ' Result Values:', 'idTransaction: ' + idTransaction + ' | strTransaction: ' + strTransaction + ' | strType: ' + strType + ' | intTranLine: ' + intTranLine + ' | intReason: ' + intReason + ' | intAssociatedReason: ' + intAssociatedReason + ' | intCaseID: ' + intCaseID + '| arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep + '--Quantity-- ' + intQuantity + '---Location---' + intLocation + '---Refund?---' + boolDoNotRefund + '| intItem' + intItem);


            context.write({
                key: {
                    id: idTransaction,
                    type: strType,
                    lineId: intTranLine,
                    documentNumber: strTransaction,
                    case: intCaseID,
                    caseStep: arrCaseStep,
                    currentStep: strCurrentActionStep,
                    quantity: intQuantity,
                    location: intLocation,
                    doNotRefund: boolDoNotRefund,
                    intItem: intItem
                },//idTransaction + '_' + strType + '_' + intTranLine+ '_' + strTransaction + '_'+intCaseID+ '_' + arrCaseStep + '_'+strCurrentActionStep + '_' + intQuantity + '_' + intLocation + '_' + boolDoNotRefund,
                value: intAssociatedReason
            });

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            cshub.caseActionStep.changeCaseActionStepStatus(intCaseID, cshub.caseActionStep.objCaseActionStepStatus.error);
        }
    }

    const reduce = (context) => {
        let objKey = JSON.parse(context.key)//.split('_');
        try {
            strLogTitle = 'reduce';
            let idTransaction = parseInt(objKey.id);
            let strRecType = objKey.type;
            let intTranLine = objKey.lineId;
            let intCaseID = objKey.case;
            let intQuantity = objKey.quantity;
            let intLocation = objKey.location;
            let intItem = objKey.intItem
            let boolDontRef = objKey.doNotRefund === "T";
            let intReason = parseInt(context.values[0]);
            let transactionForm = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.customForm});
            let recTransaction;
            if (!cshub.general.isEmpty(transactionForm)) {
                recTransaction = record.transform({
                    fromId: idTransaction,
                    fromType: strRecType,
                    toType: record.Type.RETURN_AUTHORIZATION,
                    isDynamic: true,
                    defaultValues: {
                        customform: transactionForm
                    }
                });
            } else {
                recTransaction = record.transform({
                    fromId: idTransaction,
                    fromType: strRecType,
                    toType: record.Type.RETURN_AUTHORIZATION,
                    isDynamic: true
                });
            }

            log.debug(strLogTitle + ' intReason', intReason)
            /*let recTransaction = record.transform({
                fromId: idTransaction,
                fromType: strRecType,
                toType: record.Type.RETURN_AUTHORIZATION,
                isDynamic: true,
                defaultValues: objDefaultValues
            });*/

            recTransaction.setValue({
                fieldId: 'custbody_cshub_dont_refund',
                value: boolDontRef
            });


            let idRMA;
            //try{
            removeLines(intTranLine, recTransaction, intQuantity, intLocation, intItem);
            let headerFieldsCleared = cshub.general.clearHeaderFields(recTransaction);
            log.debug({
                title: 'headerFieldsCleared',
                details: headerFieldsCleared
            });
            idRMA = recTransaction.save({
                ignoreMandatoryFields: true,
                enableSourcing: true
            });
            log.audit('RMA CREATED', 'Created From: ' + objKey.documentNumber + '| RMA ID: ' + idRMA);
            record.submitFields({
                type: 'customrecord_cshub_caseactionstep',
                id: intCaseID,
                values: {
                    custrecord_cshcd_csactn_step_crtd_tran: idRMA,
                    custrecord_cshub_actnstep_stts: 3
                }
            });


            record.submitFields({
                type: record.Type.RETURN_AUTHORIZATION,
                id: parseInt(idRMA),
                values: {
                    custbody_cshub_createdfromcasedetail: intCaseID
                }
            });

            //removed nested try 2025-04-26
            //}catch (e) {
            //     record.submitFields({
            //         type: 'customrecord_cshub_caseactionstep',
            //         id: intCaseID,
            //         values:{
            //             custrecord_cshub_actnstep_stts : 4
            //         }
            //     });
            //
            //     log.error("Error at [" + strLogTitle + "] function",
            //         'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);

            //}

            if (idRMA) {
                const arrCaseStep = objKey.caseStep.split(',');
                //executeNextStep(arrCaseStep, objKey.currentStep)
                let taskId = cshub.general.executeNextStep(arrCaseStep, objKey.currentStep);
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            cshub.caseActionStep.changeCaseActionStepStatus(objKey.case, cshub.caseActionStep.objCaseActionStepStatus.error);
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

    const removeLines = (intTranLine, recTransaction, intQuantity, intLocation, intItem) => {
        strLogTitle = 'removeLines';
        let intLineCount = recTransaction.getLineCount('item')
        let intGenericItem = runtime.getCurrentScript().getParameter('custscript_cshub_mr_rma_item');
        let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id_rma');
        log.debug(strLogTitle + ' intLineCount', intLineCount)
        for (let j = intLineCount - 1; j >= 0; j--) {

            // old: 'custcol_celigo_etail_order_line_id',
            //new:

            let intCurrentTranLine = recTransaction.getSublistValue({
                sublistId: 'item',
                fieldId: strEtailID,
                line: j
            });
            log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine)

            // let fltAmount = recTransaction.getSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'amount',
            //     line: j
            // })

            let fltRate = recTransaction.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: j
            })

            let intPriceLevel = recTransaction.getSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                line: j
            })

            let intCurrentLine = recTransaction.selectLine({
                sublistId: 'item',
                line: j
            });
            let intItem = recTransaction.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: j
            })
            let strItemType = search.lookupFields({
                type: search.Type.ITEM,
                id: parseInt(intItem),
                columns: 'type'
            }).type[0].value
            log.debug(strLogTitle + 'strItemType', strItemType);
            if (!isEmpty(intItem) && strItemType !== "Discount") {
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: intItem
                })
            } else {
                //remove inventory detail
                if (bConfiguresInventoryDetail(intItem)) {
                    removeInventoryDetail(recTransaction)
                }
            }

            // log.debug("int current line",intCurrentLine)


            let intQty = recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: intQuantity,

            });

            // recTransaction.setCurrentSublistValue({
            //     sublistId: 'item',
            //     fieldId: 'amount',
            //     value: fltAmount
            // });

            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: intPriceLevel
            });

            recTransaction.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: fltRate
            });

            if (intLocation) {
                recTransaction.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: parseInt(intLocation),
                })
            }

            recTransaction.commitLine('item');

            log.debug("---Quantity---", intQty + "|" + intQuantity)
            if (intCurrentTranLine !== intTranLine || !isEmpty(intGenericItem)) {
                recTransaction.removeLine({
                    sublistId: 'item',
                    line: j,
                    // ignoreRecalc: true
                });
                log.debug(strLogTitle, ' intCurrentTranLine' + intCurrentTranLine + '| intTranLine' + intTranLine + ' <\/br><\/br>--LINE ' + j + ' DROPPED--')
            } else {
                log.debug(strLogTitle, ' intCurrentTranLine: ' + intCurrentTranLine + '| intTranLine: ' + intTranLine + ' <\/br><\/br>--LINE ' + j + ' COMMITTED--')
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
            recTransaction.commitLine("item")
            log.debug(strLogTitle, "Generic Item Committed")
        }

    }

    const bConfiguresInventoryDetail = (idItem) => {
        let objItemDetail = search.lookupFields({
            type: search.Type.ITEM,
            id: idItem,
            columns: ['islotitem', 'isserialitem', 'usebins']
        })
        log.debug('bConfiguresInventoryDetail', objItemDetail);
        return !!(objItemDetail.islotitem || objItemDetail.isserialitem || objItemDetail.usebins);
    }

    const removeInventoryDetail = (recTransaction) => {
        let recInvDetail = recTransaction.removeCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail',
        });
    }

    const isEmpty = (stValue) => {
        return ((stValue === '' || stValue == null || stValue == undefined)
            || (stValue.constructor === Array && stValue.length == 0)
            || (stValue.constructor === Object && (function (v) {
                for (var k in v) return false;
                return true;
            })(stValue)));
    };
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})