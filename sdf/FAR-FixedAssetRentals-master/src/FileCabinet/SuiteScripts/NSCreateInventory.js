/**
 * @NModuleScope Public
 */
define(['N/record', 'N/log'], function(record, log) {
    function createInventoryAdjustment(params) {
        try {
            let { assetId,account,subsidiary, itemId, location, serialNumber, amount ,quantity} = params;

            let invAdjRec = record.create({ type: 'inventoryadjustment', isDynamic: true });
            invAdjRec.setValue('subsidiary', subsidiary); // Adjust as needed
            invAdjRec.setValue('tosubsidiary', subsidiary);
            invAdjRec.setValue('account', account);  // Adjust as needed
            invAdjRec.setValue('adjlocation', location);
            invAdjRec.setValue('custbody_fam_asset_record', assetId);

            invAdjRec.selectNewLine({ sublistId: 'inventory' });
            invAdjRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemId });
            invAdjRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: location });
            //invAdjRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'newquantity', value: 1 });
            invAdjRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: quantity });
            invAdjRec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: amount });

            let invDetail = invAdjRec.getCurrentSublistSubrecord({
                sublistId: 'inventory',
                fieldId: 'inventorydetail'
            });

            invDetail.selectLine({ sublistId: 'inventoryassignment', line: 0 });
            if(quantity > 0){
                invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: serialNumber });
            }else{
                log.debug("In Negative Quantity",serialNumber);
                invDetail.setCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', text: serialNumber });
            }
            invDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: quantity });
            invDetail.commitLine({ sublistId: 'inventoryassignment' });

            invAdjRec.commitLine({ sublistId: 'inventory' });

            return invAdjRec.save();
        } catch (e) {
            log.error('Error in createInventoryAdjustment', e);
            throw e;
        }
    }

    return {
        createInventoryAdjustment
    };
});
