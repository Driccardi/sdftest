/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime'], function(record, search, runtime) {

        function beforeSubmit(context) {
                if (context.type !== context.UserEventType.CREATE) return;

                const fulfillmentRec = context.newRecord;
                const soId = fulfillmentRec.getValue('createdfrom');
                log.debug("so id",soId);

                if (!soId) return;

                const soRec = record.load({
                        type: record.Type.SALES_ORDER,
                        id: soId
                });

                const headerFFLBroker = soRec.getValue('custbody_ffl_broker');
                const lineCount = fulfillmentRec.getLineCount({ sublistId: 'item' });

                const preventMessage = runtime.getCurrentScript().getParameter({ name: 'custscript_ns_fulfill_alert_msg' }) || 'Validation failed';

                for (let i = 0; i < lineCount; i++) {
                        const lineItemId = fulfillmentRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                        });

                        const soLineFFLBroker = soRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol1',
                                line: i
                        });

                        const soLineApprovalStatus = soRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_sd_line_status',
                                line: i
                        });

                        const isRegulated = soRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_sd_regulated_item',
                                line: i
                        });

                        if (isRegulated === true || isRegulated === 'T') {

                                if (headerFFLBroker && soLineApprovalStatus !== 'Approved') {
                                        throw new Error(`Line ${i + 1}: ${preventMessage} - Approval Required.`);
                                }

                                if (soLineApprovalStatus === 'Approved' && !soLineFFLBroker) {
                                        throw new Error(`Line ${i + 1}: ${preventMessage} - Line FFL Broker Required.`);
                                }
                        }
                }
        }

        return {
                beforeSubmit: beforeSubmit
        };
});
