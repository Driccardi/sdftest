/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/runtime", "N/search", "N/record"], /**
 * @param{log} log
 */ (log, runtime, search, record) => {
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
        const intWOofSOSearch = objScript.getParameter({ name: "custscript_ns_wo_of_so_search" });
        const intTransactionID = objScript.getParameter({ name: "custscript_ns_mr_transaction_id" });
        const objSearch = search.load({
            id: intWOofSOSearch,
        });

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "createdfrom",
            operator: "anyof",
            values: [intTransactionID],
        });
        objSearch.filters = arrFilters;

        return objSearch;
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
        const intProdPlusId = objScript.getParameter({ name: "custscript_ns_mr_prod_plus_id" });

        let objSearchResult = JSON.parse(context.value);
        let intKey = objSearchResult.id;

        let objValue = {
            ...objSearchResult,
        };

        //update sales order
        const objUpdate = {
            custbody_nsra_linkedprodrec_so_head: intProdPlusId,
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

        context.write({
            key: intProdPlusId,
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
        let intKey = context.key;
        let objReduceValues = context.values;

        log.debug("intKey", intKey);

        const objRouting = hasWORouting(intKey);
        let intRoutingCtr = 0;
        for (const k in objRouting) {
            const objMapData = objRouting[0];
            const intRoutingCount = parseFloat(objMapData.getValue({ name: "internalid", summary: "COUNT" }));

            intRoutingCtr += intRoutingCount;
        } //end for

        if (intRoutingCtr > 0) {
            const objUpdate = {
                custrecord_ns_ppai_scheduling_method: "",
            };
            const intWO = record.submitFields({
                type: "customrecord_nsra_ppr",
                id: intKey,
                values: objUpdate,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                },
            });
        } //end if
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

    const hasWORouting = (intProdPlusRec) => {
        const objScript = runtime.getCurrentScript();
        const intCheckWoRoutingSearch = objScript.getParameter({
            name: "custscript_ns_check_routing_wo_search2",
        });
        let objReturnValue = new Array();
        const objSearch = search.load({
            id: intCheckWoRoutingSearch,
        });

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "custbody_nsra_linkedprodrec_so_head",
            operator: "anyof",
            values: [intProdPlusRec],
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
    };

    return { getInputData, map, reduce, summarize };
});
