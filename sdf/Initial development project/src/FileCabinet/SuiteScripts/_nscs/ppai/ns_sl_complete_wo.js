/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/runtime", "N/task", "N/redirect"], /**
 * @param{log} log
 */ (serverWidget, log, runtime, task, redirect) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        const objScript = runtime.getCurrentScript();

        if (scriptContext.request.method == "GET") {
            const objParam = scriptContext.request.parameters;
            //-------------------------------------GET METHOD-------------------------------------
            //create form
            let form = serverWidget.createForm({
                title: "Confirmation",
            });

            //store confirmation message on object
            const objConfirmation = {
                message: 'Are you sure you want to complete all "Linked Work Order(s)"?',
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
            const objScript = runtime.getCurrentScript();
            /*const strCompleteWoMapReduce = objScript.getParameter({
                name: "custscript_ns_complete_wo_map_reduce",
            });*/

            const strCompleteWoMapReduce = "ns_mr_complete_wo";
            //-------------------------------------POST METHOD-------------------------------------
            // Call a map/reduce script
            var mapReduceTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_" + strCompleteWoMapReduce,
                deploymentId: "customdeploy_" + strCompleteWoMapReduce,
                params: {
                    custscript_ns_prod_plus_rec3: objParam.custpage_transaction_id,
                },
            });
            var taskID = mapReduceTask.submit();

            redirect.toTaskLink({
                id: "LIST_MAPREDUCESCRIPTSTATUS",
            });
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

    return { onRequest };
});
