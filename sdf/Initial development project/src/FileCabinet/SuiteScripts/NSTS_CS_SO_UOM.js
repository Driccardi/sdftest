/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

//POOPUP FOR UOM ENTRY

define(['N/currentRecord', 'N/search', 'N/ui/dialog'], (currentRecord, search, dialog) => {

    function fieldChanged(context) {
        if (context.sublistId !== 'item') return;

        const rec = currentRecord.get();
       
        // Only trigger on quantity or UOM change
        if (context.sublistId === 'item' && context.fieldId === 'custcol_order_uom') {

            const itemId = rec.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
            const uomId = rec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_order_uom'});

            log.debug("item line details",
                "itemId: " + itemId +
                ", uomId: " + uomId);

            if (!itemId || !uomId) return;

            // Fetch UOM hierarchy and conversion rates for this item
            const uomHierarchy = getUOMHierarchy(itemId);
            log.debug("uomHierarchy", uomHierarchy);

            // Find the conversion rate for the entered UOM
            const enteredUOM = uomHierarchy.find(uom => String(uom.uomId) === String(uomId));
            log.debug("entered uom", enteredUOM);
            log.debug("uom conversion",enteredUOM.conversionRate);

            if (!enteredUOM) return;

            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: -1
            });

            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: enteredUOM.conversionRate
            });


            // // Convert entered qty to base UOM (e.g., Each)
            // let baseQty = qty * enteredUOM.conversionRate;
            // log.debug("base qty",baseQty);
            //
            // // Calculate split (largest UOM first)
            // let splitMsg = '';
            // for (const uom of uomHierarchy) {
            //     const uomQty = Math.floor(baseQty / uom.conversionRate);
            //     if (uomQty > 0) {
            //         splitMsg += `${uomQty} ${uom.uomName}(s)\n`;
            //         baseQty -= uomQty * uom.conversionRate;
            //     }
            // }
            // if (baseQty > 0) {
            //     const smallestUOM = uomHierarchy[uomHierarchy.length - 1];
            //     splitMsg += `${baseQty} ${smallestUOM.uomName}(s)`;
            // }
            //
            // dialog.alert({
            //     title: 'UOM Split Preview',
            //     message: splitMsg
            // });
        }
    }

    // Helper: Fetch UOM hierarchy for item (you may want to cache this)
    function getUOMHierarchy(itemId) {
        let results = [];
        const uomSearch = search.create({
            type: 'customrecord_uom_price',
            filters: [['custrecord_uom_item', 'anyof', itemId]],
            columns: [
                'custrecord_uom_conv_uom',
                'custrecord_uom_conv_rate'
            ]
        });
        uomSearch.run().each(result => {
            results.push({
                uomId: result.getValue('custrecord_uom_conv_uom'),
                uomName: result.getText('custrecord_uom_conv_uom'),
                conversionRate: parseInt(result.getValue('custrecord_uom_conv_rate'), 10)
            });
            return true;
        });
        // Sort largest to smallest
        results.sort((a, b) => b.conversionRate - a.conversionRate);
        return results;
    }

    return { fieldChanged };
});
