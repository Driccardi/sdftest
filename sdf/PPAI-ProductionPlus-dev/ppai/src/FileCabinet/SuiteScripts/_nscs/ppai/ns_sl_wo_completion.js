/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/runtime", "N/task", "N/redirect", "N/record", "N/search", "N/url", "N/cache"], /**
 * @param{log} log
 */ (serverWidget, log, runtime, task, redirect, record, search, nurl, cache) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        if (scriptContext.request.method == "GET") {
            const objScript = runtime.getCurrentScript();
            /*const strCSFileName = objScript.getParameter({
                name: "custscript_ns_cs_file_name2",
            });*/

            const strCSFileName = "./ns_cs_ppai.js";

            const objParam = scriptContext.request.parameters;
            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Enter Completion",
            });

            //store confirmation message on object
            const objConfirmation = {
                message: 'Are you sure you want to build all "Linked Work Order(s)"?',
            };

            //create field for transaction id
            let field = form.addField({
                id: "custpage_prodplus_id",
                type: serverWidget.FieldType.TEXT,
                label: "PRODUCTION PLUS",
            });

            field.defaultValue = objParam.prodplus_id;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            /*field = form.addField({
                id: "custpage_workorder_id",
                type: serverWidget.FieldType.TEXT,
                label: "WORK ORDER ID",
            });

            field.defaultValue = objParam.workorder_id;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            field = form.addField({
                id: "custpage_os_id",
                type: serverWidget.FieldType.TEXT,
                label: "OPERATION SEQUENCE",
            });

            field.defaultValue = objParam.os_id;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            */

            /*field = form.addField({
                id: "custpage_completed_quantity",
                type: serverWidget.FieldType.FLOAT,
                label: "COMPLETED QUANTITY",
            });
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
            field.isMandatory = true;*/

            const objSubtab = form.addTab({
                id: "custpage_tab_operations",
                label: "Operations",
            });
            let objSublist = form.addSublist({
                id: "custpage_sublist_operations",
                type: serverWidget.SublistType.LIST,
                label: "Operations",
                tab: "custpage_tab_operations",
            });

            populateSublist(objParam, objSublist);

            //create submit button
            form.addSubmitButton("Submit");

            //render form
            scriptContext.response.writePage(form);
            form.clientScriptModulePath = strCSFileName;
            //-------------------------------------GET METHOD-------------------------------------
        } else {
            //-------------------------------------POST METHOD-------------------------------------

            const objScript = runtime.getCurrentScript();
            /*const strProcessWOCMr = objScript.getParameter({
                name: "custscript_ns_process_wo_completion_mr",
            });*/

            const strProcessWOCMr = "ns_mr_process_wo_completion";

            let form = serverWidget.createForm({
                title: "RESULT",
            });
            let strLayout = "";
            let objParam = scriptContext.request.parameters;
            const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_operations" });

            if (intLines > 0) {
                try {
                    //----------------create work order completion----------------

                    const objRecord = createWOCompletion(scriptContext);

                    // Call a map/reduce script
                    let mapReduceTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_" + strProcessWOCMr,
                        deploymentId: "customdeploy_" + strProcessWOCMr,
                        params: {
                            custscript_ns_transaction_param1: JSON.stringify(objRecord),
                        },
                    });

                    var taskID = mapReduceTask.submit();

                    /*
                    var url = "";
                    url = nurl.resolveRecord({
                        recordType: record.Type.WORK_ORDER_COMPLETION,
                        recordId: objRecordId,
                        isEditMode: false,
                    });
                    let strMessage = '<b>Work Order Completion Created!</b> Click <a href="' + url + '" target="_blank">here</a> to open<br/>';
                    */

                    log.debug("objRecord", JSON.stringify(objRecord));
                    let strMessage = "<b>Work Order Completion is processing on the background!</b>";

                    strLayout = showSuccess(strMessage);
                } catch (e) {
                    const strResultText = e.message;
                    strLayout = showError(strResultText);
                } //end try

                //Response
                let field = form.addField({
                    id: "custpage_response",
                    type: serverWidget.FieldType.INLINEHTML,
                    label: "Response",
                });

                field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.NORMAL });
                field.defaultValue = strLayout;
                //End Response
                //----------------create work order completion----------------

                scriptContext.response.writePage(form);
            } //end if

            //-------------------------------------POST METHOD-------------------------------------
        } //end if
    };

    showConfirmation = (objParam) => {
        const strHtml =
            '<div id="div__alert">\
                      <div class="uir-alert-box info session_info_alert" width="100%" role="status">\
                              <div class="icon info">\
                                  <img src="/images/icons/messagebox/icon_msgbox_info.png" alt="">\
                              </div>\
                              <div class="content">\
                                  <div class="title">' +
            objParam.message +
            "</div>\
                              </div>\
                      </div>\
                  </div>";

        return strHtml;
    };

    const showError = (param) => {
        var html =
            '<div id="div__alert">\
                        <div class="uir-alert-box error session_error_alert" width="100%" role="status">\
                         <div class="icon error">\
                          <img src="/images/icons/messagebox/icon_msgbox_error.png" alt="">\
                           </div>\
                           <div class="content">\
                           <div class="title">Error</div>\
                            <div class="descr">' +
            param +
            "</div>\
                        </div>\
                      </div>\
                     </div>";

        return html;
    };

    const showSuccess = (param) => {
        var html =
            '<div id="div__alert">\
                        <div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status">\
                         <div class="icon confirmation">\
                          <img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt="">\
                           </div>\
                           <div class="content">\
                           <div class="title">Success</div>\
                            <div class="descr">' +
            param +
            "</div>\
                        </div>\
                      </div>\
                     </div>";

        return html;
    };

    const populateSublist = (objParam, objSublist) => {
        const objScript = runtime.getCurrentScript();
        const intManufacturingOperationTaskSearch = objScript.getParameter({
            name: "custscript_ns_manufacturing_ot",
        });
        const objSearch = search.load({
            id: intManufacturingOperationTaskSearch,
        });

        let myCache = cache.getCache({
            name: "InventoryDetail",
            scope: cache.Scope.PROTECTED,
        });

        //-------------------------------------------------create sublist field-------------------------------------------------
        let field = objSublist.addField({ id: "custpage_wo", label: "Work Order", type: serverWidget.FieldType.SELECT, source: record.Type.WORK_ORDER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_location", label: "Location", type: serverWidget.FieldType.SELECT, source: record.Type.LOCATION });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_line", label: "#", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        field = objSublist.addField({ id: "custpage_assembly", label: "Assembly", type: serverWidget.FieldType.SELECT, source: record.Type.ASSEMBLY_ITEM });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_os_no", label: "Operation Sequence", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_os", label: "Operation Name", type: serverWidget.FieldType.SELECT, source: record.Type.MANUFACTURING_OPERATION_TASK });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_mwc", label: "Manufacturing Work Center", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_qty_remaining", label: "Quantity Remaining", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_qty_completed", label: "Completed Quantity", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        field.isMandatory = true;

        field = objSublist.addField({ id: "custpage_inventory_detail", label: "Inventory Detail", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_mst", label: "Machine Setup Time (Min)", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        field = objSublist.addField({ id: "custpage_lst", label: "Labor Setup Time (Min)", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        field = objSublist.addField({ id: "custpage_mrt", label: "Machine Run Time (Min)", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        field = objSublist.addField({ id: "custpage_lrt", label: "Labor Run Time (Min)", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        field = objSublist.addField({ id: "custpage_rr", label: "Run Rate", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_inv_obj", label: "Inventory Obj", type: serverWidget.FieldType.TEXTAREA });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        //-------------------------------------------------create sublist field-------------------------------------------------

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "custevent_ns_ppai_prod_plus_record",
            operator: "anyof",
            values: [objParam.prodplus_id],
        });

        arrFilters.push({
            name: "custbody_ns_ppai_parent",
            join: "workOrder",
            operator: "anyof",
            values: [objParam.item],
        });

        arrFilters.push({
            name: "status",
            operator: "anyof",
            values: ["PROGRESS", "NOTSTART"],
        });

        arrFilters.push({
            name: "formulatext",
            formula: "REPLACE(LOWER({name}), ' ' ,'_')",
            operator: "is",
            values: [objParam.operation_name_key],
        });

        /*arrFilters.push({
            name: "workorder",
            operator: "anyof",
            values: [objParam.workorder_id],
        });

        arrFilters.push({
            name: "internalid",
            operator: "anyof",
            values: [objParam.os_id],
        });
        */
        objSearch.filters = arrFilters;

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);

        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            let arrWOId = new Array();
            let objData = new Array();

            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];

                const intOSId = objSR.getValue({
                    name: "internalid",
                    label: "Internal ID",
                });

                const intOSSequence = objSR.getValue({
                    name: "sequence",
                    label: "Operation Sequence",
                });

                const strMWC = objSR.getText({
                    name: "manufacturingworkcenter",
                    label: "Manufacturing Work Center",
                });

                const flMST = objSR.getValue({
                    name: "setuptime",
                    label: "Setup Time",
                });

                const flRR = objSR.getValue({
                    name: "runrate",
                    label: "Run Rate",
                });

                const flQtyRemaining = objSR.getValue({
                    name: "remainingquantity",
                    label: "Remaining Quantity",
                });

                const intWoId = objSR.getValue({
                    name: "internalid",
                    join: "workOrder",
                    label: "WO Internal ID",
                });

                const intItem = objSR.getValue({
                    name: "item",
                    join: "workOrder",
                    label: "WO Item",
                });

                const intLocation = objSR.getValue({
                    name: "location",
                    join: "workOrder",
                    label: "WO Item",
                });

                if (arrWOId.indexOf(intWoId) < 0) {
                    arrWOId.push(intWoId);
                } //end if

                objData.push({
                    intOSId: intOSId,
                    intOSSequence: intOSSequence,
                    strMWC: strMWC,
                    flMST: flMST,
                    flRR: flRR,
                    flQtyRemaining: flQtyRemaining,
                    intWoId: intWoId,
                    intItem: intItem,
                    intLocation: intLocation,
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

            const objBackOrdered = getWOBackOrder(arrWOId);
            log.debug("objBackOrdered", objBackOrdered);
            let s = 0;
            for (const k in objData) {
                const j = s;
                const objMapData = objData[k];
                const intOSId = objMapData.intOSId;
                const intOSSequence = objMapData.intOSSequence;
                const strMWC = objMapData.strMWC;
                const flMST = objMapData.flMST;
                const flRR = objMapData.flRR;
                const flQtyRemaining = objMapData.flQtyRemaining;
                const intWoId = objMapData.intWoId;
                const intItem = objMapData.intItem;
                const intLocation = objMapData.intLocation;

                if (objBackOrdered[intWoId] !== undefined && objBackOrdered[intWoId] !== null) {
                    if (objBackOrdered[intWoId].backOrderCount > 0) {
                        log.debug(intWoId);
                        continue;
                    } //end if
                } //end if

                objSublist.setSublistValue({
                    id: "custpage_wo",
                    line: j,
                    value: intWoId,
                });

                objSublist.setSublistValue({
                    id: "custpage_assembly",
                    line: j,
                    value: intItem,
                });

                objSublist.setSublistValue({
                    id: "custpage_os_no",
                    line: j,
                    value: parseInt(intOSSequence),
                });

                objSublist.setSublistValue({
                    id: "custpage_os",
                    line: j,
                    value: intOSId,
                });

                objSublist.setSublistValue({
                    id: "custpage_mwc",
                    line: j,
                    value: strMWC,
                });

                objSublist.setSublistValue({
                    id: "custpage_mst",
                    line: j,
                    value: flMST,
                });

                objSublist.setSublistValue({
                    id: "custpage_lst",
                    line: j,
                    value: flMST,
                });

                objSublist.setSublistValue({
                    id: "custpage_rr",
                    line: j,
                    value: flRR,
                });

                objSublist.setSublistValue({
                    id: "custpage_qty_remaining",
                    line: j,
                    value: flQtyRemaining,
                });

                const strHtml = '<a href="#" data-item="' + intItem + '" data-location="' + intLocation + '" data-lineid="' + (parseInt(j) + 1) + '" data-id="' + objParam.prodplus_id + '" class="inventory-detail uir-helper-button uir-no-link smalltextul i_inventorydetailset"></a>';

                objSublist.setSublistValue({
                    id: "custpage_inventory_detail",
                    line: j,
                    value: strHtml,
                });

                objSublist.setSublistValue({
                    id: "custpage_line",
                    line: j,
                    value: parseInt(j) + 1,
                });

                objSublist.setSublistValue({
                    id: "custpage_location",
                    line: j,
                    value: intLocation,
                });

                //objReturnValue.push(objSR);

                //set cache
                myCache.remove({
                    key: parseInt(j) + 1,
                });
                let myCacheValue = myCache.get({
                    key: parseInt(j) + 1,
                    loader: function () {
                        return JSON.stringify(new Array());
                    },
                    ttl: 1800, //30minutes
                });

                objSublist.setSublistValue({
                    id: "custpage_inv_obj",
                    line: j,
                    value: myCacheValue,
                });

                s++;

                // finally:
                /*
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
                 */
            } //end while
        } //end if
    };

    const createWOCompletion = (scriptContext) => {
        let objParam = scriptContext.request.parameters;
        const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_operations" });

        let myCache = cache.getCache({
            name: "InventoryDetail",
            scope: cache.Scope.PROTECTED,
        });

        //create object
        let objRecord = new Array();

        for (let x = 0; x < intLines; x++) {
            let objDetail = {
                lines: new Array(),
            };
            const intWorkOrder = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_wo", line: x });
            const intLine = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_line", line: x });
            const intLineOsId = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_os", line: x });
            const flCompletedQty = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_qty_completed", line: x });
            const flMachineSetupTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_mst", line: x });
            const flLaborSetupTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_lst", line: x });
            const flMachineRunTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_mrt", line: x });
            const flLaborRunTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_lrt", line: x });

            let myCacheValue = myCache.get({
                key: parseInt(intLine),
                loader: function () {
                    return JSON.stringify(new Array());
                },
                ttl: 1800, //30minutes
            });

            objRecord.push({
                workorder_id: intWorkOrder,
                startoperation: intLineOsId,
                endoperation: intLineOsId,
                operation: intLineOsId,
                completedquantity: flCompletedQty,
                machinesetuptime: flMachineSetupTime,
                laborsetuptime: flLaborSetupTime,
                machineruntime: flMachineRunTime,
                laborruntime: flLaborRunTime,
                inventory: JSON.parse(myCacheValue),
            });
        } //end for

        return objRecord;
        //end create object

        /*
        if (intLines > 0) {
            //----------------create work order completion----------------
            let objRecord = record.transform({
                fromType: record.Type.WORK_ORDER,
                fromId: objParam.custpage_workorder_id,
                toType: record.Type.WORK_ORDER_COMPLETION,
            });
            objRecord.setValue({
                fieldId: "startoperation",
                value: objParam.custpage_os_id,
            });

            objRecord.setValue({
                fieldId: "endoperation",
                value: objParam.custpage_os_id,
            });

            for (let x = 0; x < intLines; x++) {
                const intLineOsId = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_os", line: x });
                const flCompletedQty = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_qty_completed", line: x });
                const flMachineSetupTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_mst", line: x });
                const flLaborSetupTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_lst", line: x });
                const flMachineRunTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_mrt", line: x });
                const flLaborRunTime = scriptContext.request.getSublistValue({ group: "custpage_sublist_operations", name: "custpage_lrt", line: x });

                if (x == 0) {
                    objRecord.setValue({
                        fieldId: "completedquantity",
                        value: flCompletedQty,
                    });
                } //end if

                //find the operation task line
                const intOperationLine = objRecord.findSublistLineWithValue({
                    sublistId: "operation",
                    fieldId: "taskid",
                    value: intLineOsId,
                });

                objRecord.setSublistValue({ sublistId: "operation", fieldId: "machinesetuptime", line: intOperationLine, value: flMachineSetupTime, ignoreFieldChange: false });
                objRecord.setSublistValue({ sublistId: "operation", fieldId: "laborsetuptime", line: intOperationLine, value: flLaborSetupTime, ignoreFieldChange: false });
                objRecord.setSublistValue({ sublistId: "operation", fieldId: "machineruntime", line: intOperationLine, value: flMachineRunTime, ignoreFieldChange: false });
                objRecord.setSublistValue({ sublistId: "operation", fieldId: "laborruntime", line: intOperationLine, value: flLaborRunTime, ignoreFieldChange: false });
            } //end for

            const objRecordId = objRecord.save();
            return objRecordId;
        } else {
            return 0;
        } //end if
         */
    };

    const getWOBackOrder = (internalIds) => {
        const objScript = runtime.getCurrentScript();
        const intSearch = objScript.getParameter({
            name: "custscript_ns_get_wo_bo_search",
        });
        let objReturnValue = {};
        const objSearch = search.load({
            id: intSearch,
        });

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "internalid",
            operator: "anyof",
            values: internalIds,
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
                    summary: "GROUP",
                    label: "Internal ID",
                });
                const intCount = objSR.getValue({
                    name: "lineuniquekey",
                    summary: "COUNT",
                    label: "Internal ID",
                });

                if (objReturnValue[intInternalId] === undefined) {
                    objReturnValue[intInternalId] = {
                        backOrderCount: intCount,
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
    };

    return { onRequest };
});
