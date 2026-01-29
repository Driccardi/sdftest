/**
 * SL_PopulateFFL.js
 *
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget'], function (record, ui) {
    function onRequest(context) {
        var req = context.request;
        var soId = req.parameters.soId;

        context.response.setHeader({
            name: 'Content-Type',
            value: 'application/json'
        });

        if (!soId) {
            context.response.write(JSON.stringify({
                success: false,
                message: 'Missing Sales Order ID.'
            }));
            return;
        }

        try {
            var soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: true
            });

            var ffl = soRec.getValue({ fieldId: 'custbody_ffl_broker' });
            if (!ffl) {
                context.response.write(JSON.stringify({
                    success: false,
                    message: 'No FFL Broker at header.'
                }));
                return;
            }

            var fflRec = record.load({
                type: 'customrecord_ffl',
                id: ffl
            });
            var fflAddress = fflRec.getValue({ fieldId: 'custrecord_ns_address' });

            var warnings = [];
            var lineCount = soRec.getLineCount({ sublistId: 'item' });

            for (var i = 0; i < lineCount; i++) {
                var regulated = soRec.getSublistValue({
                    sublistId: 'item',
                    line: i,
                    fieldId: 'custcol_sd_regulated_item'
                });

                var status = soRec.getSublistValue({
                    sublistId: 'item',
                    line: i,
                    fieldId: 'custcol_sd_line_status'
                });

                var isRegulated = regulated === '1' || regulated === 1;

                if (isRegulated && status != '2') {
                    warnings.push('Line ' + (i + 1) + ' is a regulated item but not approved. Skipped.');
                    continue;
                }

                // For regulated or non-regulated lines that can be updated
                if (!isRegulated) {
                    continue; // Skip non-regulated
                }

                // Set values
                soRec.selectLine({ sublistId: 'item', line: i });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol1',
                    value: ffl
                });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_ffl_address',
                    value: fflAddress
                });
                soRec.commitLine({ sublistId: 'item' });
            }

            soRec.save();

            context.response.write(JSON.stringify({
                success: true,
                message: warnings
            }));
        } catch (e) {
            context.response.write(JSON.stringify({
                success: false,
                message: 'Error: ' + e.message
            }));
        }
    }

    return { onRequest: onRequest };
});
