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
        const objTransactionParam = JSON.parse(objScript.getParameter({ name: "custscript_ns_transaction_param2" }));

        return objTransactionParam;
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

        const intKey = objSearchResult["workorder_id"]; //work order id
        const intLine = objSearchResult["line"];
        const intItem = objSearchResult["item"];
        const strItemType = objSearchResult["itemType"];
        const flQuantity = objSearchResult["quantity"];
        const flBackOrdered = objSearchResult["backOrdered"];

        let objValue = {
            line: intLine,
            item: intItem,
            quantity: flQuantity,
            backOrdered: flBackOrdered,
            itemType: strItemType,
        };

        /*let objRecord = record.transform({
               fromType: record.Type.WORK_ORDER,
               fromId: intKey,
               toType: record.Type.ASSEMBLY_BUILD,
           });
   
         
   
           const objRecordId = objRecord.save();
           log.debug("objRecordId", objRecordId);
           */

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
    const reduce = (context) => {
        log.debug("Reduce Stage", "Entered");
        let intKey = JSON.parse(context.key);
        let objReduceValues = context.values;
        log.debug("intKey", intKey);
        log.debug("objReduceValues", objReduceValues);

        let buildWorkOrder = true;
        for (const k in objReduceValues) {
            const objMapData = JSON.parse(objReduceValues[k]);
            if (objMapData["itemType"].toLowerCase() == "invtpart" || objMapData["itemType"] == "assembly") {
                if (parseFloat(objMapData["backOrdered"]) > 0) {
                    buildWorkOrder = false;
                    break;
                } //end if
            } //end if
        } //end for

        if (buildWorkOrder) {
            let objRecord = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: intKey,
                toType: record.Type.ASSEMBLY_BUILD,
            });

            for (const k in objReduceValues) {
                const objMapData = JSON.parse(objReduceValues[k]);
                const intLine = parseInt(objMapData["line"]) - 1;
                const flQuantity = objMapData["quantity"];

                objRecord.setSublistValue({ sublistId: "component", fieldId: "quantity", line: intLine, value: flQuantity, ignoreFieldChange: false });
            } //end for

            const objRecordId = objRecord.save();
            log.debug("objRecordId", objRecordId);

            context.write({
                key: intKey,
                value: objReduceValues.length,
            });
        } //end if

        //build work order if no backorder
        /*if (buildWorkOrder) {
            let objRecord = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: intKey,
                toType: record.Type.ASSEMBLY_BUILD,
            });

            const objRecordId = objRecord.save();
            log.debug("objRecordId", objRecordId);

            context.write({
                key: intKey,
                value: objReduceValues.length,
            });
        } //end if
         */

        /*let buildWorkOrder = true;
        for (const k in objReduceValues) {
            const objMapData = JSON.parse(objReduceValues[k]);

            if (objMapData["itemType"] == "InvtPart" || objMapData["itemType"] == "Assembly") {
                if (parseFloat(objMapData["backOrder"]) > 0) {
                    buildWorkOrder = false;
                    break;
                } //end if
            } //end if

            if (objMapData["routing"] !== undefined && objMapData["routing"] !== null && objMapData["routing"] !== "") {
                buildWorkOrder = false;
                break;
            } //end if
        } //end for

        log.debug("buildWorkOrder", buildWorkOrder);

        //build work order if no backorder
        if (buildWorkOrder) {
            let objRecord = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: intKey,
                toType: record.Type.ASSEMBLY_BUILD,
            });

            const objRecordId = objRecord.save();
            log.debug("objRecordId", objRecordId);

            context.write({
                key: intKey,
                value: objReduceValues.length,
            });
        } //end if
         */
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

    return { getInputData, map, reduce, summarize };
});
