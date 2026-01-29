/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/log", "N/ui/serverWidget", "N/runtime", "N/record", "N/search", "N/cache"], /**
 * @param{log} log
 */ (log, serverWidget, runtime, record, search, cache) => {
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
            name: "custscript_ns_cs_file_name3",
        });
        if (scriptContext.request.method == "GET") {
            const objParam = scriptContext.request.parameters;

            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Inventory Detail",
            });

            let field = form.addField({
                id: "custpage_transaction_id2",
                type: serverWidget.FieldType.TEXT,
                label: "Transaction ID",
            });

            field.defaultValue = objParam.transaction_id;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            field = form.addField({
                id: "custpage_lineid",
                type: serverWidget.FieldType.TEXT,
                label: "Line ID",
            });

            field.defaultValue = objParam.line;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            field = form.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.SELECT,
                source: "item",
                label: "Item",
            });

            field.defaultValue = objParam.item;
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            const objSubtab = form.addTab({
                id: "custpage_tab_inventory",
                label: "Inventory",
            });
            let objSublist = form.addSublist({
                id: "custpage_sublist_inventory",
                type: serverWidget.SublistType.INLINEEDITOR,
                label: "Inventory",
                tab: "custpage_tab_inventory",
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

            let form = serverWidget.createForm({
                title: "RESULT",
            });
            let strLayout = "";
            let objParam = scriptContext.request.parameters;
            const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_inventory" });

            if (intLines > 0) {
                try {
                    //----------------create work order completion----------------

                    const objInventory = createInventoryDetail(scriptContext);
                    let myCache = cache.getCache({
                        name: "InventoryDetail",
                        scope: cache.Scope.PROTECTED,
                    });

                    myCache.put({
                        key: objParam.custpage_lineid,
                        value: JSON.stringify(objInventory),
                    });

                    let strMessage = "<b>Operation successfully completed! You can now close this window.</b>";

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
        }
    };

    const createInventoryDetail = (scriptContext) => {
        let objParam = scriptContext.request.parameters;
        const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_inventory" });

        //create object
        let objRecord = new Array();

        for (let x = 0; x < intLines; x++) {
            let objDetail = {
                lines: new Array(),
            };
            const intBin = scriptContext.request.getSublistValue({ group: "custpage_sublist_inventory", name: "custpage_bin", line: x });
            const intStatus = scriptContext.request.getSublistValue({ group: "custpage_sublist_inventory", name: "custpage_status", line: x });
            const flQuantity = scriptContext.request.getSublistValue({ group: "custpage_sublist_inventory", name: "custpage_quantity", line: x });

            objRecord.push({
                bin: intBin,
                status: intStatus,
                quantity: flQuantity,
            });
        } //end for

        return objRecord;
        //end create object
    };

    const populateSublist = (objParam, objSublist) => {
        let fieldLookUp = search.lookupFields({
            type: "item",
            id: objParam.item,
            columns: ["usebins"],
        });

        //-------------------------------------------------create sublist field-------------------------------------------------
        let field = null;
        if (fieldLookUp["usebins"] !== undefined && fieldLookUp["usebins"]) {
            field = objSublist.addField({ id: "custpage_bin", label: "Bin", type: serverWidget.FieldType.SELECT });
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            field.addSelectOption({ value: "", text: "" });
            loadBin(field, objParam);
            field.isMandatory = true;
        } //end if

        field = objSublist.addField({ id: "custpage_status", label: "Status", type: serverWidget.FieldType.SELECT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        loadInventoryStatus(field);

        field = objSublist.addField({ id: "custpage_quantity", label: "Quantity", type: serverWidget.FieldType.FLOAT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
        field.isMandatory = true;

        let myCache = cache.getCache({
            name: "InventoryDetail",
            scope: cache.Scope.PROTECTED,
        });

        let myCacheValue = myCache.get({
            key: objParam.line,
            loader: function () {
                return JSON.stringify(new Array());
            },
            ttl: 1800, //30minutes
        });

        const objInventory = JSON.parse(myCacheValue);
        if (objInventory.length > 0) {
            for (const k in objInventory) {
                const objMapData = objInventory[k];
                if (fieldLookUp["usebins"] !== undefined && fieldLookUp["usebins"]) {
                    objSublist.setSublistValue({
                        id: "custpage_bin",
                        line: parseInt(k),
                        value: objMapData["bin"],
                    });
                } //end if

                objSublist.setSublistValue({
                    id: "custpage_status",
                    line: parseInt(k),
                    value: objMapData["status"],
                });

                objSublist.setSublistValue({
                    id: "custpage_quantity",
                    line: parseInt(k),
                    value: objMapData["quantity"],
                });
            } //ned for
        } //end if
        //-------------------------------------------------create sublist field-------------------------------------------------
    };

    const loadBin = (field, objParam) => {
        const objScript = runtime.getCurrentScript();
        const intBinSearch = objScript.getParameter({
            name: "custscript_ns_bin_search",
        });
        const objSearch = search.load({
            id: intBinSearch,
        });

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "location",
            operator: "anyof",
            values: [objParam.location],
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
                const strBin = objSR.getValue({
                    name: "binnumber",
                    label: "Bin Number",
                });

                field.addSelectOption({ value: objSR.id, text: strBin });

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

        return field;
    };

    const loadInventoryStatus = (field) => {
        const objScript = runtime.getCurrentScript();
        const intInventoryStatusSearch = objScript.getParameter({
            name: "custscript_ns_inventory_status_search",
        });
        const objSearch = search.load({
            id: intInventoryStatusSearch,
        });

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);
        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];
                const strName = objSR.getValue({
                    name: "name",
                    label: "Name",
                });

                field.addSelectOption({ value: objSR.id, text: strName });

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

        return field;
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

    return { onRequest };
});
