/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/log", "N/runtime", "N/search", "N/ui/serverWidget", "N/record", "N/url", "./NSUtilvSS2"], /**
 * @param{log} log
 */ (log, runtime, search, serverWidget, record, nurl, nsutil) => {
    /**
     * Defines the function definition that is executed before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @since 2015.2
     */
    const beforeLoad = (scriptContext) => {
        const objScript = runtime.getCurrentScript();
        const strScriptFileName = objScript.getParameter({
            name: "custscript_ns_cs_file_name",
        });

        let objForm = scriptContext.form;
        const objRec = scriptContext.newRecord;
        const strType = objRec.type;
        try {
            if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                if (strType == "customrecord_nsra_ppr") {
                    objForm.addButton({
                        id: "custpage_upate_wo_dates",
                        label: "Update Work Order Production Dates",
                        functionName: "updateWO()",
                    });

                    //check if work orders has routing
                    const objRouting = hasWORouting(objRec.id);
                    let intRoutingCtr = 0;
                    for (const k in objRouting) {
                        const objMapData = objRouting[0];
                        const intRoutingCount = parseFloat(objMapData.getValue({ name: "internalid", summary: "COUNT" }));

                        intRoutingCtr += intRoutingCount;
                    } //end for
                    //end check if work orders has routing

                    log.debug("intRoutingCtr", intRoutingCtr);

                    if (intRoutingCtr > 0) {
                        objForm.addButton({
                            id: "custpage_build_wo",
                            label: "Build Work Order",
                            functionName: "openBuildWOSL()",
                        });
                    } //end if

                    /*if (intRoutingCtr <= 0) {
                        objForm.addButton({
                            id: "custpage_complete_wo_build",
                            label: "Complete Order Build",
                            functionName: "completeWO()",
                        });
                    }*/
                    /*
                    const objSubtab = objForm.addSubtab({
                        id: "custpage_subtab_wp",
                        label: "Operation Task(WIP)",
                        tab: "custom788",
                    });
                    */

                    const objMainTab = objForm.addTab({
                        id: "custpage_tab_otw",
                        label: "Operation Task(WIP)",
                    });

                    const objSubtab = objForm.addSubtab({
                        id: "custpage_subtab_wp",
                        label: "Operation Task(WIP)",
                        tab: "custpage_tab_otw",
                    });

                    let objSublist = objForm.addSublist({
                        id: "custpage_sublist_wp",
                        type: serverWidget.SublistType.LIST,
                        label: "Operation Task(WIP)",
                        tab: "custpage_subtab_wp",
                    });

                    populateOperationTaskSublist(objRec.id, objSublist);

                    log.debug("test");
                } else {
                    const intProdPlus = objRec.getValue("custbody_nsra_linkedprodrec_so_head");

                    if (intProdPlus == "" || intProdPlus == null) {
                        objForm.addButton({
                            id: "custpage_create_pp",
                            label: "Create Production Plus Record",
                            functionName: "createPPR()",
                        });
                    } //end if
                } //end if

                objForm.clientScriptModulePath = strScriptFileName;
            } else if (scriptContext.type == scriptContext.UserEventType.EDIT) {
            } //end if
        } catch (e) {
            log.debug("Error", JSON.stringify(e));
        } //End catch
    };

    /**
     * Defines the function definition that is executed before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const beforeSubmit = (scriptContext) => {};

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {};

    const hasWORouting = (intProdPlusRec) => {
        const objScript = runtime.getCurrentScript();
        const intCheckWoRoutingSearch = objScript.getParameter({
            name: "custscript_ns_check_routing_wo_search",
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

    const populateOperationTaskSublist = (intProdPlusRec, objSublist) => {
        const objScript = runtime.getCurrentScript();
        const intWoWithWipSearch = objScript.getParameter({
            name: "custscript_ns_wo_with_wip",
        });
        const strWoCompletionSL = objScript.getParameter({
            name: "custscript_ns_wo_completion",
        });
        //let objReturnValue = new Array();

        //-------------------------------------------------create sublist field-------------------------------------------------
        let field = objSublist.addField({ id: "custpage_row", label: "Row #", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item", label: "Assembly", type: serverWidget.FieldType.SELECT, source: record.Type.ASSEMBLY_ITEM });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_status", label: "Status", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        //field = objSublist.addField({ id: "custpage_wo", label: "Work Order", type: serverWidget.FieldType.SELECT, source: record.Type.WORK_ORDER });
        //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_os_no", label: "Operation Sequence", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        //field = objSublist.addField({ id: "custpage_os", label: "Operation Name", type: serverWidget.FieldType.SELECT, source: record.Type.MANUFACTURING_OPERATION_TASK });
        //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_os", label: "Operation Name", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_wo_completion", label: "Work Order Completion", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
        //-------------------------------------------------create sublist field-------------------------------------------------

        const objSearch = search.load({
            id: intWoWithWipSearch,
        });

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "custevent_ns_ppai_prod_plus_record",
            operator: "anyof",
            values: [intProdPlusRec],
        });
        objSearch.filters = arrFilters;

        let arrColumn = objSearch.columns;
        arrColumn.push({
            name: "formulatext_operation_name",
            formula: "REPLACE(LOWER({name}), ' ' ,'_')",
            label: "Operation Name V2",
            summary: "GROUP",
        });

        arrColumn.push({
            name: "formulanumeric_back_ordered",
            formula: "{workorder.quantity}-nvl({workorder.quantitycommitted},0)-nvl({workorder.quantityshiprecv},0)",
            label: "Back Ordered",
            summary: "SUM",
        });
        objSearch.columns = arrColumn;

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);

        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];
                log.debug("objSR", objSR);
                /*const intOSId = objSR.getValue({
                    name: "internalid",
                    label: "Internal ID",
                    summary: "GROUP",
                });*/

                const intOSSequence = objSR.getValue({
                    name: "sequence",
                    label: "Operation Sequence",
                    summary: "GROUP",
                });
                const intOSName = objSR.getValue({
                    name: "name",
                    label: "Operation Name",
                    summary: "GROUP",
                });

                const intAssembly = objSR.getValue({
                    name: "custbody_ns_ppai_parent",
                    join: "workOrder",
                    label: "WO Item",
                    summary: "GROUP",
                });
                const strStatus = objSR.getText({
                    name: "status",
                    label: "Status",
                    summary: "GROUP",
                });

                /*const intWorkOrder = objSR.getValue({
                    name: "internalid",
                    join: "workOrder",
                    label: "Work Order",
                });*/

                //this will be used to filter operation name
                const strOperationKey = objSR.getValue({
                    name: "formulatext_operation_name",
                    label: "Work Order",
                    summary: "GROUP",
                });

                const flBackOrdered = objSR.getValue({
                    name: "totalcommitted",
                    join: "workOrder",
                    label: "Total Quantity Committed",
                    summary: "SUM",
                });

                log.debug("strOperationKey", strOperationKey);

                objSublist.setSublistValue({
                    id: "custpage_row",
                    line: j,
                    value: j + 1,
                });

                /*objSublist.setSublistValue({
                    id: "custpage_wo",
                    line: j,
                    value: intWorkOrder,
                });*/

                objSublist.setSublistValue({
                    id: "custpage_item",
                    line: j,
                    value: intAssembly,
                });

                objSublist.setSublistValue({
                    id: "custpage_status",
                    line: j,
                    value: strStatus,
                });

                objSublist.setSublistValue({
                    id: "custpage_os_no",
                    line: j,
                    value: parseInt(intOSSequence),
                });

                /*objSublist.setSublistValue({
                    id: "custpage_os",
                    line: j,
                    value: intOSId,
                });*/

                objSublist.setSublistValue({
                    id: "custpage_os",
                    line: j,
                    value: intOSName,
                });

                //redirect to suitelet
                const objParam = {
                    prodplus_id: intProdPlusRec,
                    //workorder_id: intWorkOrder,
                    //os_id: intOSId,
                    operation_name_key: strOperationKey,
                    item: intAssembly,
                };
                let url = nurl.resolveScript({
                    scriptId: "customscript_" + strWoCompletionSL,
                    deploymentId: "customdeploy_" + strWoCompletionSL,
                    params: objParam,
                    returnExternalUrl: false,
                });

                if (strStatus.toLowerCase() !== "completed") {
                    objSublist.setSublistValue({
                        id: "custpage_wo_completion",
                        line: j,
                        value: '<a href="' + url + '" target="_blank">Enter Completion</a>',
                    });
                } //end if

                //objReturnValue.push(objSR);

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

        //return objReturnValue;
    };

    return { beforeLoad, beforeSubmit, afterSubmit };
});
