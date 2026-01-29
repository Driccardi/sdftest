/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/redirect', 'N/file', 'N/runtime', 'N/search','/SuiteScripts/_nscs/Library/NSUtilvSS2'], function(serverWidget, task, redirect, file, runtime, search, NSUtil) {

    const OBJ_SCRIPT = runtime.getCurrentScript();

    const SCRIPT_PARAMS_IDS = {
        FORM_TITLE: 'custscript_ns_csvimporttool_processtitle',
        PROCESS_IMAGE: 'custscript_ns_csvimporttool_process_img',
        STR_MR_SCRIPT_ID: 'custscript_ns_csvimporttool_mrscriptid'
    }

    const CUSTOM_FORM_IDS = {
        INLINE_IMAGE: 'custrecord_image'
    }

    const STR_EXIT_MSG = 'Your request is being processed. Please wait.'

    function onRequest(context) {
        if (context.request.method === 'GET') {
            let form = serverWidget.createForm({
                title: OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.FORM_TITLE })
            });

            form.addFieldGroup({
                id : 'settings_group',
                label : 'Settings'
            });

            if(!NSUtil.isEmpty(OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.PROCESS_IMAGE }))){
                let strImagePath = OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.PROCESS_IMAGE });
                let objImportImage = file.load({id: strImagePath});

                let image = form.addField({
                    id: CUSTOM_FORM_IDS.INLINE_IMAGE,
                    label: 'Process CSV Data',
                    type: serverWidget.FieldType.INLINEHTML,
                    container: 'settings_group'
                });
                image.defaultValue = '<img src="' + objImportImage.url + '" alt="Import Process" >';

            }

			form.addSubmitButton({
                label: 'Submit'
            });
            context.response.writePage(form);
			
        } else if (context.request.method === 'POST') {

            let strScriptId = OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.STR_MR_SCRIPT_ID });

            let arrSearchFilters = [
                search.createFilter({
                    name: "scriptid",
                    join: 'script',
                    operator: search.Operator.IS,
                    values: strScriptId
                })
            ];
            let arrSearchColumns = [
                    search.createColumn({
                        name: "scriptid",
                        label: "Custom ID"
                    })
            ]

            let objSearchResult = NSUtil.search(search.Type.SCRIPT_DEPLOYMENT, null, arrSearchFilters, arrSearchColumns);

            if(!NSUtil.isEmpty(objSearchResult[0])){

                for (let key in objSearchResult) {
                    let strScriptDeploymentId = objSearchResult[key].getValue({ name:'scriptid'});

                    let scriptTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: strScriptId,
                        deploymentId: strScriptDeploymentId
                    });
                    scriptTask.submit();
                }
            }

            let strFormTitle = STR_EXIT_MSG;
            let objForm = serverWidget.createForm({ title: strFormTitle });

            // After the form is submitted, render a form with a exist message
            context.response.writePage({ pageObject: objForm });

        }
    }
    return {
        onRequest: onRequest
    };
});
