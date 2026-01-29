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
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost'],
    /**
     *
     * @param runtime
     * @param search
     * @param record
     * @param lib
     * @param helper
     * @returns {{reduce: reduce, getInputData: ((function(): (*|boolean|undefined))|*), summarize: summarize, map: map}}
     */

    (runtime, search, record, lib, helper) => {
        let strLogTitle;
        const getInputData = () => {
            try {
                strLogTitle = 'getInputData';
                let objLCASearch = helper.getUnprocessedLCAforExtendedLCA()
                let objSearchResultCount = objLCASearch.runPaged().count;
                log.debug("SearchObj result count", objSearchResultCount);

                if (objSearchResultCount > 0) {
                    return objLCASearch;
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
            let idLCA = parseInt(JSON.parse(context.value).id)
            let objIR = helper.getLCADetail(idLCA);
            try {
                strLogTitle = 'map';
                getItemReceiptsToProcess(context)
            } catch (e) {
                record.submitFields({
                    type: lib.landedcostallocation.id,
                    id: idLCA,
                    values: {
                        [lib.landedcostallocation.status] : lib.lcastatus.error,
                        [lib.landedcostallocation.message]:  e.message,
                        [lib.landedcostallocation.costcategory]: objIR.costcategory,
                        [lib.landedcostallocation.amount]: objIR.amount,
                        [lib.landedcostallocation.byvolume]: objIR.byVolume,
                    }
                })
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        const reduce = (context) => {
            try {
                strLogTitle = 'reduce';
                log.debug(strLogTitle + ' context', context)
                log.debug(strLogTitle + ' context', context.values)

                helper.updateItemReceipt(context)
            } catch (e) {
                let idLCA = parseInt(JSON.parse(context.key).lca)
                let IR = helper.getLCADetail(idLCA)
                record.submitFields({
                    type: lib.landedcostallocation.id,
                    id: idLCA,
                    values: {
                        [lib.landedcostallocation.status] : lib.lcastatus.error,
                        [lib.landedcostallocation.message]: e.message,
                        [lib.landedcostallocation.costcategory]: IR.costcategory,
                        [lib.landedcostallocation.amount]: IR.amount,
                        [lib.landedcostallocation.byvolume]: IR.byVolume,
                    }
                })
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
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

        const getItemReceiptsToProcess = (context) => {
            let objSearchResults = JSON.parse(context.value);
            // log.debug(strLogTitle + ' objSearchResults', objSearchResults);
            const idLCA = parseInt(objSearchResults.id)
            // let intInboundShipment = parseInt(objSearchResults.values[lib.landedcostallocation.inboundshipment].value);
            let strSearch = helper.getParameter('custscript_nspsw_allctn_dtl_trnsctn_srch')
            if (!strSearch) {
                let IR = helper.getLCADetail(idLCA)
                record.submitFields({
                    type: lib.landedcostallocation.id,
                    id: idLCA,
                    values: {
                        [lib.landedcostallocation.status] : lib.lcastatus.error,
                        [lib.landedcostallocation.message]: 'Missing Parameter. Please Input Item Receipt Search',
                        [lib.landedcostallocation.costcategory]: IR.costcategory,
                        [lib.landedcostallocation.amount]: IR.amount,
                        [lib.landedcostallocation.byvolume]: IR.byVolume,
                    }
                })
                log.error(strLogTitle, 'Missing Parameter. Please Input Item Receipt Search')
                return;
            }
            // log.debug(idLCA, idLCA)
            let bValidateLCA = true //TODO: validate LCA record whether by volume or other
            if (bValidateLCA) {
                let objItemReceiptIDs = helper.getTransactionsToProcess(objSearchResults, strSearch)
                if (helper.isEmpty(objItemReceiptIDs))
                    return;
                if (objItemReceiptIDs.bProcess) {
                    helper.processLandedCostByVolume(context, objItemReceiptIDs, objSearchResults)
                } else if (objItemReceiptIDs) {
                    for (let i = 0; i < objItemReceiptIDs.objIR.length; i++) {
                        context.write({
                            key: {
                                id: objItemReceiptIDs.objIR[i].id,
                                currency: objSearchResults.values[lib.landedcostallocation.currency].text,
                                costcategory: parseInt(objSearchResults.values[lib.landedcostallocation.costcategory].value),
                                lca: objSearchResults.id,
                            },
                            value: objItemReceiptIDs.objIR[i]
                        })
                    }
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