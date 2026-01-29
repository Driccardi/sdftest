/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime','N/file'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 */
    (log, record, runtime,file) => {
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
            var thisScript = runtime.getCurrentScript();
            var dropField = thisScript.getParameter({name: 'custscript_ns_itdp_dropfld'});
            var css = thisScript.getParameter({name: 'custscript_ns_itdp_dropcss'});
            var html = thisScript.getParameter({name: 'custscript_ns_itdp_drophtml'});
            var thisRecord = scriptContext.newRecord;

            if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE) {
                var cssFile = file.load({
                    id: css
                });
                var htmlFile = file.load({  
                    id: html
                });
                var cssContent = cssFile.getContents();
                var htmlContent = htmlFile.getContents();
                thisRecord.setValue({
                    fieldId: dropField,
                    value: `<style>${cssContent} </style> ${htmlContent}`,
                    ignoreFieldChange: true
                });
            }

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
