/**
 * UE_SelectFFL.js
 *
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/url','N/ui/serverWidget','N/record'], function(url, serverWidget, record) {

        function beforeLoad(context) {

                if (context.type === context.UserEventType.VIEW
                    && context.newRecord.type === record.Type.SALES_ORDER) {

                        var slUrl = url.resolveScript({
                                scriptId:     'customscript_ns_sl_ffl',
                                deploymentId: 'customdeploy1',
                                params:       { soId: context.newRecord.id }
                        });

                        context.form.addField({
                                id:    'custpage_sl_url',
                                type:  serverWidget.FieldType.URL,
                                label: 'Suitelet URL'
                        })
                            .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })
                            .defaultValue = slUrl;

                        context.form.clientScriptModulePath = 'SuiteScripts/NS_CS_PopulateFFL.js';

                        context.form.addButton({
                                id:           'custpage_populate_ffl',
                                label:        'Select FFL',
                                functionName: 'onPopulateFFL'
                        });
                }
        }

        return { beforeLoad: beforeLoad };
});
