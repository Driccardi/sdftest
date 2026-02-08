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
        const objScript = runtime.getCurrentScript();
        const strCSFileName = objScript.getParameter({
            name: "custscript_ns_sl_cs_file_name",
        });
        /*const strMassProdPlusMr = objScript.getParameter({
            name: "custscript_ns_sl_mass_production_plus_mr",
        });*/

        const strMassProdPlusMr = "ns_mr_process_mass_pp";

        /*const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_sl_production_plus_record2",
        });*/

        const strProductionPlusRecord = "customrecord_nsra_ppr";

        if (scriptContext.request.method == "GET") {
            const objParam = scriptContext.request.parameters;
            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Bulk Production Plus",
            });

            const objSubtab = form.addTab({
                id: "custpage_tab_wo",
                label: "Work Order List",
            });
            let objSublist = form.addSublist({
                id: "custpage_sublist_wo",
                type: serverWidget.SublistType.LIST,
                label: "Work Order List",
                tab: "custpage_tab_wo",
            });

            objSublist.addMarkAllButtons();

            populateSublist(objParam, objSublist);

            //create submit button
            form.addSubmitButton("Submit");

            //render form
            scriptContext.response.writePage(form);
            form.clientScriptModulePath = strCSFileName;
            //-------------------------------------GET METHOD-------------------------------------
        } else {
            //-------------------------------------POST METHOD-------------------------------------
            let form = serverWidget.createForm({
                title: "RESULT",
            });
            try {
                //----------------create work order completion----------------

                const objRecord = getWO(scriptContext);

                //create production plus record

                const intProdPlusRec = createProductionPlusRecord();

                //call a map reduce script
                let mapReduceTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_" + strMassProdPlusMr,
                    deploymentId: "customdeploy_" + strMassProdPlusMr,
                    params: {
                        custscript_ns_mr_transaction_param: JSON.stringify(objRecord),
                        custscript_ns_mr_prod_plus_id2: intProdPlusRec,
                    },
                });

                var taskID = mapReduceTask.submit();
                var url = "";
                url = nurl.resolveRecord({
                    recordType: strProductionPlusRecord,
                    recordId: intProdPlusRec,
                    isEditMode: false,
                });
                let strMessage = '<b>Production Plus Record Created!</b> Click <a href="' + url + '" target="_blank">here</a> to open<br/>';
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
        const intWOList = objScript.getParameter({
            name: "custscript_ns_sl_wo_list_prod_plus_searc",
        });
        const objSearch = search.load({
            id: intWOList,
        });

        //-------------------------------------------------create sublist field-------------------------------------------------
        let field = objSublist.addField({ id: "custpage_action", label: "Action", type: serverWidget.FieldType.CHECKBOX });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        field = objSublist.addField({ id: "custpage_wo", label: "Work Order", type: serverWidget.FieldType.SELECT, source: record.Type.WORK_ORDER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item", label: "Item", type: serverWidget.FieldType.SELECT, source: record.Type.ASSEMBLY_ITEM });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_customer", label: "Customer", type: serverWidget.FieldType.SELECT, source: record.Type.CUSTOMER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_status", label: "Status", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_prod_start", label: "Production Start Date", type: serverWidget.FieldType.DATE });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_prod_end", label: "Production End Date", type: serverWidget.FieldType.DATE });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_created_from", label: "Created From", type: serverWidget.FieldType.SELECT, source: record.Type.SALES_ORDER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        /*field = objSublist.addField({ id: "custpage_line", label: "Line", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item", label: "Item", type: serverWidget.FieldType.SELECT, source: "item" });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_item_type", label: "Item Type", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_onhand", label: "On Hand", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_back_ordered", label: "Back Ordered", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_quantity", label: "Quantity", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        */

        //-------------------------------------------------create sublist field-------------------------------------------------

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

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);

        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];

                const intItem = objSR.getValue({
                    name: "custbody_ns_ppai_parent",
                    label: "Item Parent",
                });

                const intEntity = objSR.getValue({
                    name: "entity",
                    label: "Entity",
                });

                const strStatus = objSR.getText({
                    name: "statusref",
                    label: "Status",
                });

                const dStartDate = objSR.getValue({
                    name: "startdate",
                    label: "Production Start Date",
                });

                const dEndDate = objSR.getValue({
                    name: "enddate",
                    label: "Production End Date",
                });

                const intCreatedFrom = objSR.getValue({
                    name: "createdfrom",
                    label: "Created From",
                });

                objSublist.setSublistValue({
                    id: "custpage_wo",
                    line: j,
                    value: objSR.id,
                });

                if (intItem !== null && intItem !== "") {
                    objSublist.setSublistValue({
                        id: "custpage_item",
                        line: j,
                        value: intItem,
                    });
                } //end if

                if (intEntity !== null && intEntity !== "") {
                    objSublist.setSublistValue({
                        id: "custpage_customer",
                        line: j,
                        value: intEntity,
                    });
                }

                objSublist.setSublistValue({
                    id: "custpage_status",
                    line: j,
                    value: strStatus,
                });

                if (dStartDate !== null && dStartDate !== "") {
                    objSublist.setSublistValue({
                        id: "custpage_prod_start",
                        line: j,
                        value: dStartDate,
                    });
                }

                if (dEndDate !== null && dEndDate !== "") {
                    objSublist.setSublistValue({
                        id: "custpage_prod_end",
                        line: j,
                        value: dEndDate,
                    });
                }

                if (intCreatedFrom !== undefined && intCreatedFrom !== null && intCreatedFrom !== "") {
                    objSublist.setSublistValue({
                        id: "custpage_created_from",
                        line: j,
                        value: intCreatedFrom,
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
    };

    const getWO = (scriptContext) => {
        let objParam = scriptContext.request.parameters;
        const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_wo" });

        //create object
        let objRecord = new Array();

        for (let x = 0; x < intLines; x++) {
            const isChecked = scriptContext.request.getSublistValue({ group: "custpage_sublist_wo", name: "custpage_action", line: x });
            const intWorkOrder = scriptContext.request.getSublistValue({ group: "custpage_sublist_wo", name: "custpage_wo", line: x });
            const intCreatedFrom = scriptContext.request.getSublistValue({ group: "custpage_sublist_wo", name: "custpage_created_from", line: x });
            if (isChecked == "T") {
                objRecord.push({
                    workorder_id: intWorkOrder,
                    created_from: intCreatedFrom,
                });
            }
        } //end for

        return objRecord;
        //end create object
    };

    createProductionPlusRecord = () => {
        const objScript = runtime.getCurrentScript();
        /*const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_sl_production_plus_record2",
        });
        */

        const strProductionPlusRecord = "customrecord_nsra_ppr";

        let productionPlusRecord = record.create({
            type: strProductionPlusRecord,
            isDynamic: true,
        });

        const intProductionPlusRecordId = productionPlusRecord.save();
        return intProductionPlusRecordId;
    };

    return { onRequest };
});
