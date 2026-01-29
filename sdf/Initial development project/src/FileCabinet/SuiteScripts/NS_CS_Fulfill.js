/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @AppliesTo ItemFulfillment
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog'], (currentRecord, record, dialog) => {


    function saveRecord(context) {
        const currentRec = currentRecord.get();
        const createdFromId = currentRec.getValue('createdfrom');
        log.debug("so id", createdFromId);

        if (!createdFromId) {
            return true; // No source SO, allow save
        }

        let salesOrder;
        try {
            salesOrder = record.load({
                type: record.Type.SALES_ORDER,
                id: createdFromId,
                isDynamic: false
            });
            log.debug("sales order", salesOrder);
        } catch (e) {
            dialog.alert({ title: 'Error', message: 'Unable to load Sales Order.' });
            return false;
        }

        const headerFFLBroker = salesOrder.getValue('custbody_ffl_broker');
        log.debug("header broker", headerFFLBroker);

        if (!headerFFLBroker) {
            dialog.alert({ title: 'Error', message: 'No FFL Broker on Header' });
            return false;
        }

        const lineCount = currentRec.getLineCount({ sublistId: 'item' });
        log.debug("Line count", lineCount);

        for (let i = 0; i < lineCount; i++) {
            const regulated = currentRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_sd_regulated_item',
                line: i
            });
            const status = currentRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_sd_line_status',
                line: i
            });

            log.debug(`Line ${i + 1}`, { regulated, status });

            const isRegulated = regulated === '1' || regulated === 1;

            if (isRegulated && status != '2') {
                dialog.alert({
                    title: 'Validation Error',
                    message: `Line ${i + 1} is a regulated item but not approved.`
                });
                return false;
            }

            const lineFFL = currentRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol1',
                line: i
            });

            if (isRegulated && status === '2' && !lineFFL) {
                dialog.alert({
                    title: 'Validation Error',
                    message: `Line ${i + 1} is approved but missing FFL Broker at line level.`
                });
                return false;
            }
        }

        return true; // All validations passed
    }


    return {
        saveRecord
    };
});
