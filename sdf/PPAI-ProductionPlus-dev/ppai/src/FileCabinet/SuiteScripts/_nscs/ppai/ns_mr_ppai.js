/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/search", "N/runtime", "N/record"], /**
 * @param{log} log
 */ (log, search, runtime, record) => {
    /**
     * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
     * @param {Object} inputContext
     * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Object} inputContext.ObjectRef - Object that references the input data
     * @typedef {Object} ObjectRef
     * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
     * @property {string} ObjectRef.type - Type of the record instance that contains the input data
     * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
     * @since 2015.2
     */

    const getInputData = (inputContext) => {
        const objScript = runtime.getCurrentScript();
        const intSalesOrderSearch = objScript.getParameter({
            name: "custscript_ns_sales_order_search",
        });
        const intImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_imprint_detail_search",
        });
        const intTransaction = objScript.getParameter({
            name: "custscript_ns_transaction",
        });

        const objImprintDetailSearch = search.load({
            id: intSalesOrderSearch,
        });

        let arrFilters = objImprintDetailSearch.filters;
        arrFilters.push({
            name: "internalid",
            operator: "anyof",
            values: [intTransaction],
        });
        objImprintDetailSearch.filters = arrFilters;

        return objImprintDetailSearch;
    };

    /**
     * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
     * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
     * context.
     * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
     *     is provided automatically based on the results of the getInputData stage.
     * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
     *     function on the current key-value pair
     * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
     *     pair
     * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} mapContext.key - Key to be processed during the map stage
     * @param {string} mapContext.value - Value to be processed during the map stage
     * @since 2015.2
     */

    const map = (context) => {
        log.debug("Map Stage", "Entered");
        const objScript = runtime.getCurrentScript();
        const intTransaction = objScript.getParameter({
            name: "custscript_ns_transaction",
        });

        let objSearchResult = JSON.parse(context.value);
        log.debug("objSearchResult", objSearchResult);
        const intInternalId = objSearchResult.values["internalid"].value;
        log.debug("intInternalId", intInternalId);
        const imprintTotals = getImprintDetailsSummary(intInternalId);
        const objImprintDetail = getImprintDetails(intInternalId);
        let objValue = {
            internalid: intInternalId,
            ...(imprintTotals[intTransaction] !== undefined ? imprintTotals[intTransaction] : {}),
            imprintDetails: objImprintDetail,
        };

        context.write({
            key: intTransaction,
            value: objValue,
        });
    };

    /**
     * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
     * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
     * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
     *     provided automatically based on the results of the map stage.
     * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
     *     reduce function on the current group
     * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
     * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} reduceContext.key - Key to be processed during the reduce stage
     * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
     *     for processing
     * @since 2015.2
     */
    const reduce = (context) => {
        const objScript = runtime.getCurrentScript();
        const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_production_plus_record",
        });

        log.debug("Reduce Stage", "Entered");
        let intKey = JSON.parse(context.key);
        let objReduceValues = context.values;
        log.debug("objReduceValues", objReduceValues);

        const objParam = JSON.parse(objReduceValues[0]);

        const intProdPlusRec = createProductionPlusRecord(objParam);

        //update prod plus
        const strName = "ProdPlus" + intProdPlusRec;
        let objUpdate = {
            name: strName,
        };
        const intProdPlus = record.submitFields({
            type: strProductionPlusRecord,
            id: intProdPlusRec,
            values: objUpdate,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
            },
        });

        //update sales order
        objUpdate = {
            custbody_nsra_linkedprodrec_so_head: intProdPlusRec,
        };
        const intSalesOrder = record.submitFields({
            type: record.Type.SALES_ORDER,
            id: intKey,
            values: objUpdate,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
            },
        });
        log.debug("sales order id", intSalesOrder);
        log.debug("prod plus id", intProdPlusRec);
    };

    /**
     * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
     * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
     * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
     * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
     *     script
     * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
     * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
     * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
     * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
     *     script
     * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
     * @param {Object} summaryContext.inputSummary - Statistics about the input stage
     * @param {Object} summaryContext.mapSummary - Statistics about the map stage
     * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
     * @since 2015.2
     */
    const summarize = (context) => {
        // Log details about the script's execution.
        log.debug("Enter Summarize");
        log.debug("Usage units consumed", context.usage);
        log.debug("Concurrency", context.concurrency);
        log.debug("Number of yields", context.yields);

        let intTotalProcessed = 0;
        context.output.iterator().each(function (key, value) {
            intTotalProcessed++;
            return true;
        });

        log.debug("Total Processed", intTotalProcessed);
    };

    createProductionPlusRecord = (objParam) => {
        const objScript = runtime.getCurrentScript();
        const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_production_plus_record",
        });

        const intTransaction = objScript.getParameter({
            name: "custscript_ns_transaction",
        });

        try {
            let productionPlusRecord = record.create({
                type: strProductionPlusRecord,
                isDynamic: true,
            });

            productionPlusRecord.setValue({
                fieldId: "name",
                value: "ProdPlus12",
            });

            productionPlusRecord.setValue({
                fieldId: "custrecord_nsra_ppr_",
                value: objParam.internalid,
            });

            productionPlusRecord.setValue({
                fieldId: "custrecordnsps_total_imprints",
                value: objParam.totalImprints,
            });

            productionPlusRecord.setValue({
                fieldId: "custrecord_ns_ppai_total_design",
                value: objParam.totalDesigns,
            });

            productionPlusRecord.setValue({
                fieldId: "custrecord_ns_ppai_total_location",
                value: objParam.totalLocations,
            });

            productionPlusRecord.setValue({
                fieldId: "custrecord_nsps_total_qty",
                value: objParam.totalQuantity,
            });

            const intProductionPlusRecordId = productionPlusRecord.save();
            return intProductionPlusRecordId;
        } catch (error) {
            log;
            if (!(error instanceof Error)) {
                error = new Error(error);
            } //end if
            log.debug("createProductionPlusRecord error", error.message);
        }
    };

    getImprintDetailsSummary = (intInternalId) => {
        const objScript = runtime.getCurrentScript();
        const intImprintDetailSummarySearch = objScript.getParameter({
            name: "custscript_ns_imprint_summary_search",
        });
        const intTransaction = objScript.getParameter({
            name: "custscript_ns_transaction",
        });
        try {
            let objReturnValue = {};
            let objSearch = search.load({
                id: intImprintDetailSummarySearch,
            });

            let arrFilters = objSearch.filters;
            arrFilters.push({
                name: "custrecord_ns_ppai_iod_salesorder",
                join: "custrecord_ns_ppai_id_iod",
                operator: "anyof",
                values: [intInternalId],
            });
            objSearch.filters = arrFilters;

            const intResultCount = objSearch.runPaged().count;
            const objRs = objSearch.run();
            let objSearchResult = objRs.getRange(0, 1000);

            //remove limiter of 1000 and fetch all result

            let i = 0; // iterator for all search results
            let j = 0; // iterator for current result range 0..999
            if (intResultCount > 0) {
                while (j < objSearchResult.length) {
                    const objSR = objSearchResult[j];
                    const flTotalImprints = objSR.getValue({ name: "name", summary: "COUNT", label: "Total Imprints" });
                    const flTotalDesigns = objSR.getValue({ name: "custrecord_ns_ppai_id_artwork_item", summary: "COUNT", label: "Total Imprints" });
                    const flTotalLocations = objSR.getValue({ name: "custrecord_ns_ppai_id_location", summary: "COUNT", label: "Total Imprints" });
                    const flTotalQty = objSR.getValue({ name: "custrecord_ns_ppai_iod_qty", join: "CUSTRECORD_NS_PPAI_ID_IOD", summary: "MAX", label: "Total Quantity" });
                    if (objReturnValue[intTransaction] == undefined) {
                        objReturnValue[intTransaction] = {
                            totalImprints: flTotalImprints,
                            totalDesigns: flTotalDesigns,
                            totalLocations: flTotalLocations,
                            totalQuantity: flTotalQty,
                        };
                    } //end if

                    // finally:
                    i++;
                    j++;
                    if (j == 1000) {
                        // check if it reaches 1000
                        j = 0; // reset j an reload the next portion
                        objSearchResult = objRs.getRange({
                            start: i,
                            end: i + 1000,
                        });
                    } //end if
                } //end while
            } //end if
            //end remove limiter of 1000 and fetch all result

            return objReturnValue;
        } catch (e) {
            log.debug("Error getImprintDetailsSummary", JSON.stringify(e));
        }
    };

    getImprintDetails = (intInternalId) => {
        const objScript = runtime.getCurrentScript();
        const intImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_imprint_detail_search",
        });
        try {
            let objReturnValue = new Array();
            let objSearch = search.load({
                id: intImprintDetailSearch,
            });

            let arrFilters = objSearch.filters;
            arrFilters.push({
                name: "custrecord_ns_ppai_iod_salesorder",
                join: "custrecord_ns_ppai_id_iod",
                operator: "anyof",
                values: [intInternalId],
            });
            objSearch.filters = arrFilters;

            const intResultCount = objSearch.runPaged().count;
            const objRs = objSearch.run();
            let objSearchResult = objRs.getRange(0, 1000);

            //remove limiter of 1000 and fetch all result

            let i = 0; // iterator for all search results
            let j = 0; // iterator for current result range 0..999
            if (intResultCount > 0) {
                while (j < objSearchResult.length) {
                    const objSR = objSearchResult[j];
                    objReturnValue.push(objSR);

                    // finally:
                    i++;
                    j++;
                    if (j == 1000) {
                        // check if it reaches 1000
                        j = 0; // reset j an reload the next portion
                        objSearchResult = objRs.getRange({
                            start: i,
                            end: i + 1000,
                        });
                    } //end if
                } //end while
            } //end if
            //end remove limiter of 1000 and fetch all result

            return objReturnValue;
        } catch (e) {
            log.debug("Error getImprintDetails", JSON.stringify(e));
        }
    };

    return { getInputData, map, reduce, summarize };
});
