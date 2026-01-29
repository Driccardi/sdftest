/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/runtime", "N/task", "N/redirect", "N/record", "N/search", "N/url"], /**
 * @param{log} log
 */ (serverWidget, log, runtime, task, redirect, record, search, nurl) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        const objScript = runtime.getCurrentScript();
        /*const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_sl_production_plus_record",
        });*/

        const strProductionPlusRecord = "customrecord_nsra_ppr";

        /*const strProcessWoLinkedToSoMr = objScript.getParameter({
            name: "custscript_ns_process_wo_linked_to_so_mr",
        });
        */
        const strProcessWoLinkedToSoMr = "ns_mr_process_wo_link_to_wo";

        if (scriptContext.request.method == "GET") {
            const objParam = scriptContext.request.parameters;
            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Confirmation",
            });

            //store confirmation message on object
            const objConfirmation = {
                message: 'Are you sure you want to proceed on the creation of "Production Plus Record"?',
            };

            //create confirmation message
            const strLayout = showConfirmation(objConfirmation);

            //create field for transaction id
            let field = form.addField({
                id: "custpage_transaction_id",
                type: serverWidget.FieldType.TEXT,
                label: "Transaction ID",
            });

            field.defaultValue = objParam.transaction_id;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            //create field to render html
            field = form.addField({
                id: "custpage_confirmation",
                type: serverWidget.FieldType.INLINEHTML,
                label: "Confirmation",
            });
            field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.NORMAL });
            field.defaultValue = strLayout;

            //create submit button
            form.addSubmitButton("Submit");

            //render form
            scriptContext.response.writePage(form);
            //-------------------------------------GET METHOD-------------------------------------
        } else {
            const objParam = scriptContext.request.parameters;
            //-------------------------------------POST METHOD-------------------------------------
            //create form

            let form = serverWidget.createForm({
                title: "RESULT",
            });
            let strLayout = "";

            try {
                const imprintTotals = getImprintDetailsSummary(objParam.custpage_transaction_id);
                const objImprintDetail = getImprintDetails(objParam.custpage_transaction_id);

                let objValue = {
                    internalid: objParam.custpage_transaction_id,
                    ...(imprintTotals[objParam.custpage_transaction_id] !== undefined ? imprintTotals[objParam.custpage_transaction_id] : {}),
                    imprintDetails: objImprintDetail,
                };

                const intProdPlusRec = createProductionPlusRecord(objValue);

                //update imprint details production plus
                const arrUpdateImprint = setImprintDetailsProductionPlus(objParam, intProdPlusRec);
                log.debug("arrUpdateImprint", arrUpdateImprint);

                //update sales order
                let objUpdate = {
                    custbody_nsra_linkedprodrec_so_head: intProdPlusRec,
                };
                const intSalesOrder = record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: objParam.custpage_transaction_id,
                    values: objUpdate,
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    },
                });

                // Call a map/reduce script
                const strScriptId = "customscript_" + strProcessWoLinkedToSoMr;
                const strDeploymentId = "customdeploy_" + strProcessWoLinkedToSoMr;
                var mapReduceTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: strScriptId,
                    deploymentId: strDeploymentId,
                    params: {
                        custscript_ns_mr_transaction_id: objParam.custpage_transaction_id,
                        custscript_ns_mr_prod_plus_id: intProdPlusRec,
                    },
                });
                var taskID = mapReduceTask.submit();

                let url = "";
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

            /*
            // Call a map/reduce script
            const strScriptId = "customscript_ns_mr_ppai";
            const strDeploymentId = "customdeploy_ns_mr_ppai";
            var mapReduceTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: strScriptId,
                deploymentId: strDeploymentId,
                params: {
                    custscript_ns_transaction: objParam.custpage_transaction_id,
                },
            });
            var taskID = mapReduceTask.submit();

            redirect.toRecord({
                type: record.Type.SALES_ORDER,
                id: objParam.custpage_transaction_id,
            });
            */
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

    getImprintDetails = (intInternalId) => {
        const objScript = runtime.getCurrentScript();
        const intImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_sl_imprint_detail_search",
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

    getImprintDetailsSummary = (intInternalId) => {
        const objScript = runtime.getCurrentScript();
        const intImprintDetailSummarySearch = objScript.getParameter({
            name: "custscript_ns_sl_imprint_detail_summary",
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
                    if (objReturnValue[intInternalId] == undefined) {
                        objReturnValue[intInternalId] = {
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

    createProductionPlusRecord = (objParam) => {
        const objScript = runtime.getCurrentScript();
        /*const strProductionPlusRecord = objScript.getParameter({
            name: "custscript_ns_sl_production_plus_record",
        });*/
        const strProductionPlusRecord = "customrecord_nsra_ppr";

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
    };

    getSOImrpintDetails = (objParam) => {
        const objScript = runtime.getCurrentScript();
        const intSOImprintDetailSearch = objScript.getParameter({
            name: "custscript_ns_so_imprint_detail_search",
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
                values: [objParam.custpage_transaction_id],
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

    return { onRequest };
});
