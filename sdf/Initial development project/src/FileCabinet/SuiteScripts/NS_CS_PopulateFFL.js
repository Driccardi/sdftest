/**
 * NS_CS_PopulateFFL.js
 *
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/runtime', 'N/search', 'N/record'], function (currentRecord, dialog, runtime, search, record) {

    function pageInit(context) {}

    function fieldChanged(context) {

        const scriptObj = runtime.getCurrentScript();

        if (!context.sublistId && context.fieldId === 'ismultishipto') {
            var rec = currentRecord.get();
            var multiShip = rec.getValue({ fieldId: 'ismultishipto' });

            var lineCount = rec.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < lineCount; i++) {
                var regulated = rec.getSublistValue({
                    sublistId: 'item',
                    line: i,
                    fieldId: 'custcol_sd_regulated_item'
                });
                log.debug("reg value", regulated);

                // Always get and show the alert message
                var alertMsg = scriptObj.getParameter({ name: 'custscript_ns_alert_msg' });
                log.debug("alert msg", alertMsg);

                dialog.alert({
                    title: 'Alert',
                    message: alertMsg
                });

                return;
            }
        }
    }

    function onPopulateFFL() {
    var rec = currentRecord.get();
    var slUrl = rec.getValue({ fieldId: 'custpage_sl_url' });

    if (!slUrl) {
        dialog.alert({
            title: 'Missing URL',
            message: 'Could not find Suitelet URL.'
        });
        return;
    }

    require(['N/https'], function (https) {
        https.get.promise({ url: slUrl }).then(function (response) {
            try {
                var result = JSON.parse(response.body);
                if (result.success) {
                    dialog.alert({
                        title: 'Success',
                        message: result.message || 'FFL populated successfully.'
                    }).then(function () {
                        location.reload(); // Or redirect to view record
                    });
                } else {
                    dialog.alert({
                        title: 'Error',
                        message: result.message || 'An error occurred in Suitelet.'
                    });
                }
            } catch (parseErr) {
                dialog.alert({
                    title: 'Parse Error',
                    message: 'Invalid response format from Suitelet.'
                });
            }
        }).catch(function (err) {
            dialog.alert({
                title: 'Request Failed',
                message: 'Failed to call Suitelet: ' + err.message
            });
        });
    });
}

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onPopulateFFL: onPopulateFFL
    };
});
