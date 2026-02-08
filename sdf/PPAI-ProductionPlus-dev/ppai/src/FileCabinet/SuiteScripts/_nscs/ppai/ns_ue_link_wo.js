/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/log", "N/search", "N/record", "N/runtime", "N/task", "./NSUtilvSS2"], /**
 * @param{log} log
 */ (log, search, record, runtime, task, nsutil) => {
    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    const beforeLoad = (scriptContext) => {};

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (scriptContext) => {
        const newRec = scriptContext.newRecord;
        const strRecordType = newRec.type;
        const strType = scriptContext.type;
        const intId = newRec.id;
        const form = scriptContext.form;
        const intCreatedFrom = nsutil.catchNull(newRec.getValue({ fieldId: "createdfrom" }));

        switch (strRecordType) {
            case record.Type.WORK_ORDER:
                //Set Prod Plus Record link to WO.
                if (intCreatedFrom !== "") {
                    const intProductionPlusRecord = nsutil.catchNull(newRec.getValue({ fieldId: "custbody_nsra_linkedprodrec_so_head" }));
                    if (intProductionPlusRecord === "" || intProductionPlusRecord === null) {
                        let fieldLookUp = search.lookupFields({
                            type: search.Type.SALES_ORDER,
                            id: intCreatedFrom,
                            columns: ["custbody_nsra_linkedprodrec_so_head"],
                        });
                        log.debug("fieldLookUp", fieldLookUp);
                        log.debug("fieldLookUp2", fieldLookUp["custbody_nsra_linkedprodrec_so_head"]);
                        if (fieldLookUp["custbody_nsra_linkedprodrec_so_head"][0] !== undefined) {
                            const intSoProdPlus = fieldLookUp["custbody_nsra_linkedprodrec_so_head"][0].value;

                            newRec.setValue({ fieldId: "custbody_nsra_linkedprodrec_so_head", value: intSoProdPlus });
                        } //end if
                    }
                } //end if
                break;

            case record.Type.SALES_ORDER:
                let objParam = {
                    soid: newRec.id,
                };

                const intProductionPlusRecord = nsutil.catchNull(newRec.getValue({ fieldId: "custbody_nsra_linkedprodrec_so_head" }));
                if (intProductionPlusRecord !== "" && intProductionPlusRecord !== null) {
                    //update imprint details production plus
                    const arrUpdateImprint = setImprintDetailsProductionPlus(objParam, intProductionPlusRecord);
                    log.debug("arrUpdateImprint", arrUpdateImprint);
                } //end if
                break;
        } //end switch

        log.debug("strRecordType", strRecordType);
        log.debug("strType", strType);
        log.debug("intId", intId);
        log.debug("intCreatedFrom", intCreatedFrom);
    };

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
        const objScript = runtime.getCurrentScript();
        const strMrUpdateWoOt = objScript.getParameter({ name: "custscript_ns_mr_update_wo_ot" });
        const intGetWoOtSearch = objScript.getParameter({ name: "custscript_ns_get_wo_ot" });

        const newRec = scriptContext.newRecord;
        const strRecordType = newRec.type;
        const strType = scriptContext.type;
        const intId = newRec.id;

        try {
            switch (strRecordType) {
                case record.Type.WORK_ORDER:
                    if (strType == "create" || strType == "edit" || strType == "xedit") {
                        const objWOOT = getWOOT(intId);
                        log.debug("objWOOT", objWOOT);
                        log.debug("test");

                        if (objWOOT.length > 0) {
                            for (const k in objWOOT) {
                                const objMapData = objWOOT[k];

                                let objUpdate = {
                                    custevent_ns_ppai_assembly: parseInt(objMapData["item"]),
                                    custevent_ns_ppai_prod_plus_record: parseInt(objMapData["prodPlus"]),
                                };
                                const intOtRecord = record.submitFields({
                                    type: record.Type.MANUFACTURING_OPERATION_TASK,
                                    id: parseInt(objMapData["internalid"]),
                                    values: objUpdate,
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true,
                                    },
                                });
                                log.debug("OT Record", intOtRecord);
                            } //end for
                        } //end if

                        /*
                        // Call a map/reduce script
                        log.debug("strMrUpdateWoOt", strMrUpdateWoOt);
                        const strScriptId = "customscript_" + strMrUpdateWoOt;
                        const strDeploymentId = "customdeploy_" + strMrUpdateWoOt;
                        const mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: strScriptId,
                            deploymentId: strDeploymentId,
                            params: {
                                custscript_ns_wo_id: intId,
                            },
                        });
                        const taskID = mapReduceTask.submit();
                        log.debug("taskID", taskID);
                        */
                    } //end if

                    break;
            } //end switch
        } catch (e) {
            log.debug("Error afterSubmit", JSON.stringify(e));
        } //End catch

        //log.debug("strRecordType", strRecordType);
        //log.debug("strType", strType);
        //log.debug("intId", intId);
    };

    const getWOOT = (intKey) => {
        const objScript = runtime.getCurrentScript();
        const intGetWoOtSearch = objScript.getParameter({ name: "custscript_ns_get_wo_ot_search" });
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
                    const intItem = objSR.getValue({
                        name: "item",
                        label: "Item",
                    });
                    const intProdPlus = objSR.getValue({
                        name: "custbody_nsra_linkedprodrec_so_head",
                        label: "Production Plus",
                    });

                    objReturnValue.push({
                        internalid: intInternalId,
                        item: intItem,
                        prodPlus: intProdPlus,
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

    getSOImrpintDetails = (objParam) => {
        const objScript = runtime.getCurrentScript();
        const intSOImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_so_imprint_detail_search2",
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
                values: [objParam.soid],
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
            log.debug("Error getImprintDetails", JSON.stringify(e));
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

    return { beforeLoad, beforeSubmit, afterSubmit };
});
