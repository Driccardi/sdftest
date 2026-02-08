/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/runtime", "N/task", "N/redirect", "N/record", "N/search", "N/url", "./NSUtilvSS2"], /**
 * @param{log} log
 */ (serverWidget, log, runtime, task, redirect, record, search, nurl, nsutil) => {
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
                name: "custscript_ns_cs_script_file_name",
            });*/
            const strCSFileName = "./ns_cs_ppai.js";

            const objParam = scriptContext.request.parameters;
            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Assembly Build",
            });

            let strLayout = showInfo("Work order with back ordered will not be process!");
            let inlineField = form.addField({
                id: "custpage_confirmation",
                type: serverWidget.FieldType.INLINEHTML,
                label: "Confirmation",
            });
            inlineField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.NORMAL });
            inlineField.defaultValue = strLayout;
            inlineField.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });

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
                id: "custpage_tab_components",
                label: "Components",
            });
            let objSublist = form.addSublist({
                id: "custpage_sublist_components",
                type: serverWidget.SublistType.LIST,
                label: "Components",
                tab: "custpage_tab_components",
            });

            //objSublist.addMarkAllButtons();

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
            //const strProcessBuildWO = objScript.getParameter({ name: "custscript_ns_process_build_wo_mr" });
            const strProcessBuildWO = "ns_mr_process_build_wo";

            let form = serverWidget.createForm({
                title: "RESULT",
            });
            let strLayout = "";
            let objParam = scriptContext.request.parameters;
            const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_components" });

            if (intLines > 0) {
                try {
                    //----------------create work order completion----------------

                    const objRecord = createWOAssembly(scriptContext);

                    // Call a map/reduce script
                    let mapReduceTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_" + strProcessBuildWO,
                        deploymentId: "customdeploy_" + strProcessBuildWO,
                        params: {
                            custscript_ns_transaction_param2: JSON.stringify(objRecord),
                        },
                    });

                    var taskID = mapReduceTask.submit();

                    let strMessage = "<b>Assembly Build is processing on the background!</b>";

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

    const showInfo = (param) => {
        let html =
            '<div id="div__alert">\
                           <div class="uir-alert-box info session_info_alert" width="100%" role="status">\
                            <div class="icon info">\
                             <img src="/images/icons/messagebox/icon_msgbox_info.png" alt="">\
                              </div>\
                              <div class="content">\
                              <div class="title">Info</div>\
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
        const intWOSublistSearch = objScript.getParameter({
            name: "custscript_ns_wo_sublist_search",
        });
        const objSearch = search.load({
            id: intWOSublistSearch,
        });

        log.debug("intWOSublistSearch", intWOSublistSearch);

        //-------------------------------------------------create sublist field-------------------------------------------------

        let field = objSublist.addField({ id: "custpage_wo", label: "Work Order", type: serverWidget.FieldType.SELECT, source: record.Type.WORK_ORDER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_line", label: "Line", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item", label: "Item", type: serverWidget.FieldType.SELECT, source: "item" });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item_type", label: "Item Type", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_buildable", label: "Quantity to build", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_onhand", label: "On Hand", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_back_ordered", label: "Back Ordered", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_quantity", label: "Quantity", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        //-------------------------------------------------create sublist field-------------------------------------------------

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "custbody_nsra_linkedprodrec_so_head",
            operator: "anyof",
            values: [objParam.prodplus_id],
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

        let arrColumn = objSearch.columns;
        arrColumn.push({
            name: "formulanumeric_back_ordered",
            formula: "{quantity}-nvl({quantitycommitted},0)-nvl({quantityshiprecv},0)",
            label: "Back Ordered",
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

                const intLine = objSR.getValue({
                    name: "line",
                    label: "Line ID",
                });

                const intInternalId = objSR.getValue({
                    name: "internalid",
                    label: "Internal ID",
                });

                const intItem = objSR.getValue({
                    name: "item",
                    label: "Line",
                });

                const strItemType = objSR.getValue({
                    name: "itemtype",
                    label: "Item Type",
                });

                const flOnHand = nsutil.parseNumber(
                    objSR.getValue({
                        name: "quantityonhand",
                        join: "item",
                        label: "On Hand",
                    })
                );

                const flBackOrdered = nsutil.parseNumber(
                    objSR.getValue({
                        name: "formulanumeric_back_ordered",
                        label: "Back Ordered",
                    })
                );

                const flBuildable = nsutil.parseNumber(
                    objSR.getValue({
                        name: "buildable",
                        label: "Buildable",
                    })
                );

                objSublist.setSublistValue({
                    id: "custpage_line",
                    line: j,
                    value: intLine,
                });

                objSublist.setSublistValue({
                    id: "custpage_wo",
                    line: j,
                    value: intInternalId,
                });

                objSublist.setSublistValue({
                    id: "custpage_onhand",
                    line: j,
                    value: flOnHand,
                });

                objSublist.setSublistValue({
                    id: "custpage_back_ordered",
                    line: j,
                    value: flBackOrdered,
                });

                objSublist.setSublistValue({
                    id: "custpage_item",
                    line: j,
                    value: intItem,
                });

                objSublist.setSublistValue({
                    id: "custpage_item_type",
                    line: j,
                    value: strItemType,
                });

                objSublist.setSublistValue({
                    id: "custpage_buildable",
                    line: j,
                    value: flBuildable,
                });

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
    };

    const createWOAssembly = (scriptContext) => {
        let objParam = scriptContext.request.parameters;
        const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_components" });

        //create object
        let objRecord = new Array();

        for (let x = 0; x < intLines; x++) {
            const intWorkOrder = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_wo", line: x });
            const intLine = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_line", line: x });
            const intItem = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_item", line: x });
            const strItemType = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_item_type", line: x });
            const flQuantity = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_quantity", line: x });
            const flBackOrdered = scriptContext.request.getSublistValue({ group: "custpage_sublist_components", name: "custpage_back_ordered", line: x });
            objRecord.push({
                workorder_id: intWorkOrder,
                line: intLine,
                item: intItem,
                itemType: strItemType,
                quantity: flQuantity,
                backOrdered: flBackOrdered,
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

    return { onRequest };
});
