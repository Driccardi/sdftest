/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *  This scripts updates the item receipt with the landed cost by volume.
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
                let objLCASearch = helper.getUnprocessedLCA()
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
            try {
                strLogTitle = 'map';
                getItemReceiptsToProcess(context)
            } catch (e) {
                let objSearchResults = JSON.parse(context.value)
                let IR = {
                    costcategory: parseInt(objSearchResults.values[lib.landedcostallocation.costcategory].value),
                    lca: objSearchResults.id,
                    amount: objSearchResults.values[lib.landedcostallocation.amount],
                    byVolume: objSearchResults.values[lib.landedcostallocation.byvolume].value,
                }

                let objTempValues = {
                    [lib.landedcostallocation.costcategory]: IR.costcategory,
                    [lib.landedcostallocation.amount]: IR.amount,
                    [lib.landedcostallocation.byvolume]: IR.byVolume,
                    [lib.landedcostallocation.status]: lib.lcastatus.error,
                    [lib.landedcostallocation.message]: e.message,
                }

                log.debug(strLogTitle, objTempValues)

                record.submitFields({
                    type: lib.landedcostallocation.id,
                    id: objSearchResults.id,
                    values: objTempValues,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
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

                updateItemReceipt(context)

            } catch (e) {
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

        /**
         *
         * @param context
         */
        const getItemReceiptsToProcess = (context) => {
            let objSearchResults = JSON.parse(context.value);
            // log.debug(strLogTitle + ' objSearchResults', objSearchResults);
            const idLCA = parseInt(objSearchResults.id)
            let intInboundShipment = parseInt(objSearchResults.values[lib.landedcostallocation.inboundshipment].value);
            let strSearch = helper.getParameter('custscript_nspsw_lca_ir_srch')
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
            let objItemReceiptIDs = helper.getItemReceipts(idLCA, intInboundShipment, strSearch)
            // log.debug(strLogTitle + ' objItemReceiptIDs', objItemReceiptIDs)
            if (objItemReceiptIDs.bProcess && objItemReceiptIDs.objIR.length > 0) {
                let objItemVolume = calculateItemVolume(objItemReceiptIDs.objIR)
                log.debug(strLogTitle + ' objItemVolume', objItemVolume)
                let arrLandedCostPerItemDetail = calculateLandedCostPerItem(objItemVolume, objSearchResults.values)
                for (let i = 0; i < arrLandedCostPerItemDetail.length; i++) {
                    context.write({
                        key: {
                            id: arrLandedCostPerItemDetail[i].id,
                            currency: objSearchResults.values[lib.landedcostallocation.currency].text,
                            costcategory: parseInt(objSearchResults.values[lib.landedcostallocation.costcategory].value),
                            lca: objSearchResults.id,
                            amount: objSearchResults.values[lib.landedcostallocation.amount],
                            byVolume: objSearchResults.values[lib.landedcostallocation.byvolume].value,
                        },
                        value: arrLandedCostPerItemDetail[i]
                    })
                }
            }
        }

        /**
         *
         * @param objItemVolume
         * @param objSearchResults
         * @returns {*[]}
         */
        const calculateLandedCostPerItem = (objItemVolume, objSearchResults) => {
            strLogTitle = 'calculateLandedCostPerItem'
            let fltTotalLCLineAmount = 0
            let fltLCAAmount = parseFloat(objSearchResults[lib.landedcostallocation.amount])
            let arrLC = []
            for (let i = 0; i < objItemVolume.itemDetail.length; i++) {

                let totalVolume = objItemVolume.totalVolume
                let itemDetail = objItemVolume.itemDetail[i]
                log.debug(strLogTitle + ' Params', {
                    totalVolume: totalVolume,
                    itemDetail: itemDetail,
                });


                let fltVolumePercent = parseFloat(itemDetail.volume) / totalVolume
                fltVolumePercent = helper.roundValue(fltVolumePercent)
                let fltLCLineAmount = fltLCAAmount * parseFloat(fltVolumePercent)

                fltLCLineAmount = parseFloat(fltLCLineAmount.toFixed(2))
                fltTotalLCLineAmount += fltLCLineAmount
                arrLC.push({
                    id: itemDetail.id,
                    linekey: itemDetail.linekey,
                    amount: fltLCAAmount,
                    volume: itemDetail.volume,
                    volumepercent: fltVolumePercent,
                    lineamount: fltLCLineAmount,
                    item: itemDetail.item,
                })
            }
            let add = 0
            if (fltLCAAmount !== fltTotalLCLineAmount) {
                add = fltLCAAmount - fltTotalLCLineAmount
            }

            arrLC[0].lineamount += add
            log.debug(strLogTitle + 'Qty to add ', add)
            log.debug(strLogTitle + 'arrLC', arrLC)
            return arrLC;
        }

        /**
         *
         * @param context
         */
        const updateItemReceipt = (context) => {
            strLogTitle = 'updateItemReceipt'
            let arrLC = context.values;
            let IR = JSON.parse(context.key)
            try {
                const recItemReceipt = record.load({
                    type: record.Type.ITEM_RECEIPT,
                    id: IR.id,
                    isDynamic: true
                });

                let intLineCount = recItemReceipt.getLineCount({
                    sublistId: 'item'
                })

                log.debug(strLogTitle + 'PARAMS', {
                    arrLC: arrLC,
                    IR: IR,
                    intLineCount: intLineCount
                })

                let arrUpdatedLines = []
                for (let i = 0; i < arrLC.length; i++) {
                    let objLC = JSON.parse(arrLC[i])
                    let intLine = recItemReceipt.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'line',
                        value: objLC.linekey
                    });
                    log.debug(strLogTitle, 'intLine : ' + intLine)
                    if (intLine !== -1) {
                        recItemReceipt.selectLine({
                            sublistId: 'item',
                            line: intLine
                        })

                        objLC.lineamount = convertAmount(objLC.lineamount, IR.currency, recItemReceipt)

                        let bLineUpdated = updateLandedCost(objLC, IR.costcategory, recItemReceipt)

                        if (bLineUpdated) {
                            let intItem = recItemReceipt.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item'
                            })
                            arrUpdatedLines.push({
                                line: intLine,
                                item: intItem,
                                amount: objLC.lineamount
                            })
                            recItemReceipt.commitLine('item')
                        }
                    }
                }

                if (arrUpdatedLines.length > 0) {
                    log.audit(strLogTitle, 'Saving Item Receipt')
                    recItemReceipt.save()
                    createLCACompletion(arrUpdatedLines, IR.id, IR.lca)
                    // log.debug(strLogTitle,{
                    //     type: lib.landedcostallocation.id,
                    //     id: IR.lca,
                    //     costcat :IR.costcategory,
                    //     values: {
                    //         [lib.landedcostallocation.costcategory] :IR.costcategory,
                    //         [lib.landedcostallocation.status]: lib.lcastatus.completed,
                    //         [lib.landedcostallocation.amount] : IR.amount,
                    //         [lib.landedcostallocation.byvolume] : lib.lcayesno.yes,
                    //     }
                    // })
                    record.submitFields({
                        type: lib.landedcostallocation.id,
                        id: IR.lca,
                        values: {
                            [lib.landedcostallocation.costcategory]: IR.costcategory,
                            [lib.landedcostallocation.status]: lib.lcastatus.completed,
                            [lib.landedcostallocation.amount]: IR.amount,
                            [lib.landedcostallocation.byvolume]: IR.byVolume,
                        }
                    })
                }
            } catch (e) {
                record.submitFields({
                    type: lib.landedcostallocation.id,
                    id: IR.lca,
                    values: {
                        [lib.landedcostallocation.status]: lib.lcastatus.error,
                        [lib.landedcostallocation.message]: e.message,
                        [lib.landedcostallocation.costcategory]: IR.costcategory,
                        [lib.landedcostallocation.amount]: IR.amount,
                        [lib.landedcostallocation.byvolume]: IR.byVolume,
                    }
                });

                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        /**
         * This function converts amount according to the currency
         * @param amount
         * @param currency
         * @param recItemReceipt
         * @returns {*} - returns converted amount
         */
        const convertAmount = (amount, currency, recItemReceipt) => {
            let fltLCAmount = amount
            if (helper.verifyMultiCurrency()) {
                let strIRCurrency = recItemReceipt.getText({
                    fieldId: 'currency'
                });

                log.debug(strLogTitle, {
                    fltLCAmount: fltLCAmount,
                    strIRCurrency: strIRCurrency,
                    source: currency
                });
                fltLCAmount = helper.convertCurrency(fltLCAmount, currency, strIRCurrency)
            }
            return fltLCAmount
        }


        /**
         * This function creates Landed Cost Allocation Completion Record
         *
         * @param arrUpdatedLines
         * @param IR
         * @param LCA
         */
        const createLCACompletion = (arrUpdatedLines, IR, LCA) => {
            strLogTitle = 'createLCACompletion'

            for (let i = 0; i < arrUpdatedLines.length; i++) {
                const objLCACompletion = lib.lcacompletion
                let recLCACompletion = record.create({
                    type: objLCACompletion.id,
                    isDynamic: true
                });

                recLCACompletion.setValue({
                    fieldId: objLCACompletion.item,
                    value: arrUpdatedLines[i].item
                });

                recLCACompletion.setValue({
                    fieldId: objLCACompletion.lineid,
                    value: arrUpdatedLines[i].line
                });

                recLCACompletion.setValue({
                    fieldId: objLCACompletion.amount,
                    value: arrUpdatedLines[i].amount
                });

                recLCACompletion.setValue({
                    fieldId: objLCACompletion.transaction,
                    value: IR
                });

                recLCACompletion.setValue({
                    fieldId: objLCACompletion.parent,
                    value: LCA
                });

                recLCACompletion.save()
                log.audit('Landed Cost Allocation Completion Created')
            }
        }


        /**
         * This function updates the landed cost value to each line items
         *
         * @param arrLC
         * @param costCategory
         * @param recItemReceipt
         * @returns {boolean} - returns true if a line was updated
         */
        const updateLandedCost = (arrLC, costCategory, recItemReceipt) => {
            strLogTitle = 'updateLandedCost'
            log.debug(strLogTitle + 'PARAMS', {
                arrLC: arrLC,
                costCategory: costCategory,
            });
            //create a subrecord
            let recInvSubRecord = recItemReceipt.getCurrentSublistSubrecord({
                sublistId: 'item',
                fieldId: 'landedcost',
            });

            // this is line count inside the landed cost subrecord
            let intLinesCount = recInvSubRecord.getLineCount('landedcostdata');
            //loop through the line counts and get value
            let bCostAllocationExist = false
            let bLandedCostUpdated = false

            let fltLCAmount = parseFloat(arrLC.lineamount)

            for (let i = 0; i < intLinesCount; i++) {
                recInvSubRecord.selectLine({
                    sublistId: 'landedcostdata',
                    line: i
                })
                let intCurrentCostCategory = recInvSubRecord.getCurrentSublistValue({
                    sublistId: 'landedcostdata',
                    fieldId: 'costcategory'
                });

                log.debug(strLogTitle + ' intCurrentCostCategory', intCurrentCostCategory)

                if (intCurrentCostCategory == costCategory) {
                    log.debug("Category is existing")
                    bCostAllocationExist = true
                    bLandedCostUpdated = true
                    recInvSubRecord.setCurrentSublistValue({
                        sublistId: 'landedcostdata',
                        fieldId: 'amount',
                        value: fltLCAmount
                    });
                    recInvSubRecord.commitLine('landedcostdata')
                }
            }

            if (!bCostAllocationExist) {
                log.debug("Category is NOT existing")
                recInvSubRecord.selectNewLine({
                    sublistId: 'landedcostdata',
                })

                recInvSubRecord.setCurrentSublistValue({
                    sublistId: 'landedcostdata',
                    fieldId: 'costcategory',
                    value: parseInt(costCategory)
                });

                recInvSubRecord.setCurrentSublistValue({
                    sublistId: 'landedcostdata',
                    fieldId: 'amount',
                    value: fltLCAmount
                });
                bLandedCostUpdated = true
                recInvSubRecord.commitLine({
                    sublistId: 'landedcostdata'
                });

            }
            return bLandedCostUpdated
        }


        /**
         * Calculates the item volume
         * @param arrIR
         * @returns {{totalVolume: number, itemDetail: *[]}} - returns the item detail and total volume for each lines
         */
        const calculateItemVolume = (arrIR) => {
            strLogTitle = 'processItemReceipt'
            // log.debug(strLogTitle + ' Params', {
            //     objIR: objIR,
            //     objSearchResults: objSearchResults
            // })
            let fltTotalVolume = 0
            let arrItemVolume = []
            for (let i = 0; i < arrIR.length; i++) {
                let objIR = arrIR[i]
                let objDimRec = lib.dimensionunitRec
                if (!objIR.unit && !objIR.volume) {
                    return;
                }
                const fltConversion = helper.getCubedConversionRate(objIR.unit, objIR.volume, objDimRec.id, objDimRec.conversion)
                let fltVolumeInBaseUnit = helper.roundValue(objIR.volume * fltConversion);
                log.debug(strLogTitle + ' volume', {
                    fltConversion: fltConversion,
                    fltVolumeInBaseUnit: fltVolumeInBaseUnit
                });

                fltTotalVolume += parseFloat(fltVolumeInBaseUnit)

                arrItemVolume.push({
                    id: objIR.id,
                    volume: fltVolumeInBaseUnit,
                    linekey: objIR.linekey,
                    item: objIR.item
                })
                log.debug(strLogTitle, arrItemVolume)
            }
            return {
                totalVolume: fltTotalVolume,
                itemDetail: arrItemVolume
            }
        }


        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        }
    })