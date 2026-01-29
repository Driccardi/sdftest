/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

//PURCHASE ORDER LINE SPLITTING

define(['N/record', 'N/search'], (record, search) => {

        function beforeSubmit(context) {
                if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;

                const poRec = context.newRecord;
                const vendorId = poRec.getValue({ fieldId: 'entity' });
                const lineCount = poRec.getLineCount({ sublistId: 'item' });

                for (let i = lineCount - 1; i >= 0; i--) {
                        const itemId = poRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        const quantity = poRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });

                        const uomData = getVendorUOMHierarchyAndPricing(itemId, vendorId);
                        if (!uomData || uomData.length === 0) continue;

                        let remainingQty = quantity;
                        const splitLines = [];

                        for (const uom of uomData) {
                                const uomQty = Math.floor(remainingQty / uom.conversionRate);
                                if (uomQty > 0) {
                                        splitLines.push({
                                                itemId: itemId,
                                                quantity: uomQty,
                                                uom: uom.conversionUOM,
                                                price: uom.price,
                                                uomId: uom.uomId
                                        });
                                        remainingQty -= uomQty * uom.conversionRate;
                                }
                        }
                        if (remainingQty > 0) {
                                const smallestUOM = uomData[uomData.length - 1];
                                splitLines.push({
                                        itemId: itemId,
                                        quantity: remainingQty,
                                        uom: smallestUOM.conversionUOM,
                                        price: smallestUOM.price,
                                        uomId: smallestUOM.uomId
                                });
                        }

                        poRec.removeLine({ sublistId: 'item', line: i });
                        for (let j = 0; j < splitLines.length; j++) {
                                poRec.insertLine({ sublistId: 'item', line: i + j });
                                poRec.setSublistValue({ sublistId: 'item', fieldId: 'item', line: i + j, value: splitLines[j].itemId });
                                poRec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i + j, value: splitLines[j].quantity });
                                poRec.setSublistValue({ sublistId: 'item', fieldId: 'units', line: i + j, value: splitLines[j].uomId });
                                poRec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + j, value: splitLines[j].price });
                        }
                }
        }

        function getVendorUOMHierarchyAndPricing(itemId, vendorId) {
                let results = [];
                const uomSearch = search.create({
                        type: 'customrecord_uom_price',
                        filters: [
                                ['custrecord_uom_item', 'anyof', itemId],
                                'AND',
                                ['custrecord_uom_vendor', 'anyof', vendorId]
                        ],
                        columns: [
                                'custrecord_uom_conv_uom',
                                'custrecord_uom_conv_rate',
                                'custrecord_vendor_price_uom',
                                'custrecord_uom_conv_uom'
                        ]
                });
                uomSearch.run().each(result => {
                        results.push({
                                conversionUOM: result.getText('custrecord_uom_conv_uom'),
                                uomId: result.getValue('custrecord_uom_conv_uom'),
                                conversionRate: parseInt(result.getValue('custrecord_uom_conv_rate'), 10),
                                price: parseFloat(result.getValue('custrecord_vendor_price_uom'))
                        });
                        return true;
                });
                results.sort((a, b) => b.conversionRate - a.conversionRate);
                return results;
        }

        return { beforeSubmit };
});
