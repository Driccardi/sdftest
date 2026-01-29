/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/log", "N/url", "N/runtime", "N/currentRecord", "N/search", "N/currentRecord"], /**
 * @param{log} log
 */ (log, nurl, runtime, currentRecord, search, currRec) => {
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    const createPPR = () => {
        //get script parameter
        const objScript = runtime.getCurrentScript();
        const strSlId = "ns_sl_ppai";

        /*const strSlId = objScript.getParameter({
            name: "custscript_ns_sl_id",
        });*/

        const objCurrentRecord = currentRecord.get();
        const intId = objCurrentRecord.id;

        const objParam = {
            transaction_id: intId,
        };
        //alert(strSlId);
        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strSlId,
            deploymentId: "customdeploy_" + strSlId,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "_blank");

        // Call a map/reduce script

        /*var mapReduceTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: "customscript_ns_mr_ppai",
            deploymentId: "customdeploy_ns_mr_ppai",
            params: {
                custscript_ns_transaction: intSOId,
            },
        });
        alert("mapReduceTask end");

        var taskID = mapReduceTask.submit();
        // Call a map/reduce script
        alert(taskID);
        */
    };
    const updateWO = () => {
        const objScript = runtime.getCurrentScript();
        /*const strUpdateWoSl = objScript.getParameter({
            name: "custscript_ns_update_prod_dates_wo_sl",
        });*/

        const strUpdateWoSl = "ns_sl_update_prod_dates_wo";

        const objCurrentRecord = currentRecord.get();
        const intId = objCurrentRecord.id;

        const objParam = {
            transaction_id: intId,
        };

        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strUpdateWoSl,
            deploymentId: "customdeploy_" + strUpdateWoSl,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "_blank");
    };

    const buildWO = () => {
        const objScript = runtime.getCurrentScript();
        /*const strBuildWoSl = objScript.getParameter({
            name: "custscript_ns_build_wo_sl",
        });
        */

        const strBuildWoSl = "ns_sl_build_wo";

        const objCurrentRecord = currentRecord.get();
        const intId = objCurrentRecord.id;

        const objParam = {
            transaction_id: intId,
        };

        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strBuildWoSl,
            deploymentId: "customdeploy_" + strBuildWoSl,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "_blank");
    };

    const openBuildWOSL = () => {
        const objScript = runtime.getCurrentScript();
        /*const strBuildWoSl = objScript.getParameter({
            name: "custscript_ns_build_wo_sl_page",
        });*/
        const strBuildWoSl = "ns_sl_wo_build";

        const objCurrentRecord = currentRecord.get();
        const intId = objCurrentRecord.id;

        const objParam = {
            prodplus_id: intId,
        };

        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strBuildWoSl,
            deploymentId: "customdeploy_" + strBuildWoSl,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "_blank");
    };

    const completeWO = () => {
        const objScript = runtime.getCurrentScript();
        /*const strCompleteWoSl = objScript.getParameter({
            name: "custscript_ns_complete_wo_sl",
        });*/

        const strCompleteWoSl = "ns_sl_complete_wo";

        const objCurrentRecord = currentRecord.get();
        const intId = objCurrentRecord.id;

        const objParam = {
            transaction_id: intId,
        };

        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strCompleteWoSl,
            deploymentId: "customdeploy_" + strCompleteWoSl,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "popup", "width=600,height=400");
    };

    const pageInit = (scriptContext) => {
        log.debug("scriptContext", scriptContext);
        let anchorTags = document.querySelectorAll(".inventory-detail");
        anchorTags.forEach(function (anchorTag) {
            anchorTag.addEventListener("click", function (event) {
                const intId = event.target.getAttribute("data-id");
                const intLineId = event.target.getAttribute("data-lineid");
                const intLocation = event.target.getAttribute("data-location");
                const intItem = event.target.getAttribute("data-item");
                const objParam = {
                    transaction_id: intId,
                    line: intLineId,
                    location: intLocation,
                    item: intItem,
                };
                openInventoryDetail(objParam); // Call the desired function
            });
        });
    };

    const openInventoryDetail = (objParam) => {
        const objScript = runtime.getCurrentScript();
        const strInventoryDetailSL = "ns_sl_inventory_detail";

        //alert(objParam.transaction_id);
        //alert(objParam.line);
        const objCurrentRecord = currentRecord.get();

        //redirect to suitelet
        let url = nurl.resolveScript({
            scriptId: "customscript_" + strInventoryDetailSL,
            deploymentId: "customdeploy_" + strInventoryDetailSL,
            params: objParam,
            returnExternalUrl: false,
        });

        window.open(url, "_blank");
    };

    const fieldChanged = (scriptContext) => {
        console.log("scriptContext", scriptContext);
        const objRec = currRec.get();
        const strSublistName = scriptContext.sublistId;
        const strFieldId = scriptContext.fieldId;
        const line = scriptContext.line;

        switch (strSublistName) {
            case "custpage_sublist_operations":
                if (strFieldId == "custpage_qty_completed") {
                    //const intLineCount = objRec.getLineCount("custpage_sublist_operations");
                    x = line;
                    //for (let x = 0; x < intLineCount; x++) {
                    const flRunRate = objRec.getSublistValue({ sublistId: "custpage_sublist_operations", fieldId: "custpage_rr", line: x });
                    const flCompletedQty = objRec.getSublistValue({ sublistId: "custpage_sublist_operations", fieldId: "custpage_qty_completed", line: x });

                    const flMachineRunTime = flCompletedQty * flRunRate;
                    const flLaborRunTime = flCompletedQty * flRunRate;
                    objRec.selectLine({ sublistId: "custpage_sublist_operations", line: x });
                    objRec.setCurrentSublistValue({ sublistId: "custpage_sublist_operations", fieldId: "custpage_mrt", line: x, value: flMachineRunTime, ignoreFieldChange: true });
                    objRec.setCurrentSublistValue({ sublistId: "custpage_sublist_operations", fieldId: "custpage_lrt", line: x, value: flLaborRunTime, ignoreFieldChange: true });
                    objRec.commitLine({ sublistId: "custpage_sublist_operations" });
                    //} //end for
                } //end if

                break;
        } //end switch

        console.log("strSublistName", strSublistName);
        console.log("strFieldId", strFieldId);
    };
    return {
        updateWO: updateWO,
        completeWO: completeWO,
        buildWO: buildWO,
        createPPR: createPPR,
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        openBuildWOSL: openBuildWOSL,
        openInventoryDetail: openInventoryDetail,
    };
});
