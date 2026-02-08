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

    const getInputData = (context) => {
        const objScript = runtime.getCurrentScript();
        const intGetWoOtSearch = objScript.getParameter({ name: "custscript_ns_get_wo_ot" });
        const intWoId = objScript.getParameter({ name: "custscript_ns_wo_id" });
        const objSearch = search.load({
            id: intGetWoOtSearch,
        });
        /*let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "internalid",
            operator: "anyof",
            values: [intWoId],
        });
        objSearch.filters = arrFilters;
        */
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
        let objSearchResult = JSON.parse(context.value);
        const intInternalId = objSearchResult.values["internalid.manufacturingOperationTask"].value;
        const strOperationName = objSearchResult.values["name.manufacturingOperationTask"];
        const intOperationSequence = objSearchResult.values["sequence.manufacturingOperationTask"];
        const strItemType = objSearchResult.values["itemtype"];
        const intItem = objSearchResult.values["item"].value;
        const intProdPlus = objSearchResult.values["custbody_nsra_linkedprodrec_so_head"].value;
        let objValue = {
            internalid: intInternalId,
            operationName: strOperationName,
            operationSequence: intOperationSequence,
            item: intItem,
            itemType: strItemType,
            prodPlus: intProdPlus,
        };

        log.debug("objValue", objValue);

        //update status of workorder
        let objUpdate = {
            custevent_ns_ppai_assembly: parseInt(intItem),
            custevent_ns_ppai_prod_plus_record: parseInt(intProdPlus), //set status to built
        };
        const intOtRecord = record.submitFields({
            type: record.Type.MANUFACTURING_OPERATION_TASK,
            id: intInternalId,
            values: objUpdate,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true,
            },
        });
        log.debug("OT Record", intOtRecord);

        //end update status of workorder

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
        let intKey = JSON.parse(context.key);
        let objReduceValues = JSON.parse(context.values[0]);
        //log.debug("objobjReduceValuesSearchResult", objReduceValues);

        const dtProdRecStartDate = objReduceValues.values["custrecord_nsps_prod_start_date.CUSTBODY_NSRA_LINKEDPRODREC_SO_HEAD"];
        const dtProdRecEndDate = objReduceValues.values["custrecord_nsps_prod_end_date.CUSTBODY_NSRA_LINKEDPRODREC_SO_HEAD"];

        let objUpdate = {};

        if (dtProdRecStartDate !== "" && dtProdRecStartDate !== null) {
            objUpdate["startdate"] = dtProdRecStartDate;
        } //end if

        if (dtProdRecEndDate !== "" && dtProdRecEndDate !== null) {
            objUpdate["enddate"] = dtProdRecEndDate;
        } //end if

        log.debug("objUpdate", objUpdate);

        if (objUpdate["startdate"] !== undefined && objUpdate["enddate"] !== undefined) {
            const intWo = record.submitFields({
                type: record.Type.WORK_ORDER,
                id: intKey,
                values: objUpdate,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true,
                },
            });

            log.debug("intWO", intWo);
        } //end if

        context.write({
            key: intKey,
            value: objReduceValues.length,
        });
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

    const getWOOT = (intKey) => {
        let objReturnValue = new Array();

        try {
            const objSearch = search.load({
                id: intGetWoOtSearch,
            });
            let arrFilters = objSearch.filters;
            arrFilters.push({
                name: "internalid",
                operator: "anyof",
                values: [intKey],
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
                    const intInternalId = objSR.getValue({
                        name: "internalid",
                        join: "manufacturingOperationTask",
                        label: "Internal ID",
                    });
                    const strOperationName = objSR.getValue({
                        name: "name",
                        join: "manufacturingOperationTask",
                        label: "Operation Name",
                    });

                    const intOperationSequence = objSR.getValue({
                        name: "sequence",
                        join: "manufacturingOperationTask",
                        label: "Operation Sequence",
                    });

                    objReturnValue.push({
                        internalid: intInternalId,
                        operationName: strOperationName,
                        operationSequence: intOperationSequence,
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
        } catch (e) {
            log.debug("Error getWOOT", JSON.stringify(e));
        } //End catch

        return objReturnValue;
    };

    return { getInputData, map /*reduce, summarize */ };
});
