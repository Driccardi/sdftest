/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/runtime", "N/record", "N/search"], /**
 * @param{log} log
 */ (log, runtime, record, search) => {
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

    const getInputData = (context) => {
        const objScript = runtime.getCurrentScript();
        const objParam = JSON.parse(objScript.getParameter({ name: "custscript_ns_mr_transaction_param" }));
        return objParam;
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
        const objScript = runtime.getCurrentScript();
        const intProdPlus = JSON.parse(objScript.getParameter({ name: "custscript_ns_mr_prod_plus_id2" }));

        let objSearchResult = JSON.parse(context.value);
        const intKey = objSearchResult["workorder_id"]; //work order id
        log.debug("objSearchResult", objSearchResult);
        const intCreatedFrom = objSearchResult["created_from"];

        if (intCreatedFrom !== undefined && intCreatedFrom !== null && intCreatedFrom !== "") {
            const objParam = {
                created_from: intCreatedFrom,
            };
            log.debug("objParam", objParam);

            const arrUpdateImprint = setImprintDetailsProductionPlus(objParam, intProdPlus);
            log.debug("arrUpdateImprint", arrUpdateImprint);
        } //end if

        //update work order
        const objUpdate = {
            custbody_nsra_linkedprodrec_so_head: intProdPlus,
        };
        const intWO = record.submitFields({
            type: record.Type.WORK_ORDER,
            id: intKey,
            values: objUpdate,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
            },
        });

        let objValue = {
            ...objSearchResult,
        };

        log.debug("intWO", intWO);
        context.write({
            key: intKey,
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
    const reduce = (context) => {};

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

        handleErrorIfAny(context);

        let intTotalProcessed = 0;
        context.output.iterator().each(function (key, value) {
            intTotalProcessed++;
            return true;
        });

        log.debug("Total Processed", intTotalProcessed);
    };

    handleErrorIfAny = (summary) => {
        var inputSummary = summary.inputSummary;
        var mapSummary = summary.mapSummary;
        var reduceSummary = summary.reduceSummary;

        handleErrorInStage("map", mapSummary);
        handleErrorInStage("reduce", reduceSummary);
    };

    handleErrorInStage = (stage, summary) => {
        var errorMsg = [];
        summary.errors.iterator().each(function (key, value) {
            var msg = "Stage: " + stage + " Key: " + key + ". Error was: " + JSON.parse(value).message + "\n";
            errorMsg.push(msg);
            return true;
        });
        if (errorMsg.length > 0) {
            log.debug("errorMsg", errorMsg);
        } //end if
    };

    getSOImrpintDetails = (objParam) => {
        const objScript = runtime.getCurrentScript();
        const intSOImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_so_imprint_detail_search3",
        });
        try {
            let objReturnValue = new Array();
            let objSearch = search.load({
                id: intSOImprintDetailSearch,
            });

            let arrFilters = objSearch.filters;
            arrFilters.push({
                name: "internalid",
                operator: "anyof",
                values: [objParam.created_from],
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
                    const intItem = objSR.getValue({ name: "item", label: "Item" });
                    const intImprint = objSR.getValue({ name: "custcol_ns_ppai_imprint_orderdetail", label: "Imprint Order Details" });
                    objReturnValue.push({
                        internalid: objSR.id,
                        item: intItem,
                        imprintDetail: intImprint,
                    });

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
            log.debug("Error getSOImrpintDetails", JSON.stringify(e));
        }
    };

    setImprintDetailsProductionPlus = (objParam, intProdPlusRec) => {
        const objSOImprintDetails = getSOImrpintDetails(objParam);
        let arrImprintUpdated = new Array();

        for (const k in objSOImprintDetails) {
            const objMapData = objSOImprintDetails[k];

            if (arrImprintUpdated.indexOf(objMapData["imprintDetail"]) >= 0) {
                continue;
            } //end if

            let objUpdate = {
                custrecord_ns_ppai_iod_salesorder: objMapData["internalid"],
                custrecord_ns_ppai_iod_prod_rec: intProdPlusRec,
                custrecord_ns_ppai_iod_item: objMapData["item"],
            };
            const intImprintDetailId = record.submitFields({
                type: "customrecord_ns_ppai_imprnt_orderdetails",
                id: objMapData["imprintDetail"],
                values: objUpdate,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                },
            });

            arrImprintUpdated.push(intImprintDetailId);
        } //end for

        return arrImprintUpdated;
    };

    return { getInputData, map, summarize };
});
