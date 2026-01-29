/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

//SALES ORDER LINE SPLITTING

define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

        function beforeSubmit(context) {
                if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;

                const rec = context.newRecord;
                const lineCount = rec.getLineCount({ sublistId: 'item' });
                log.debug("line count",lineCount);

                // For each item line, process UOM splitting
                for (let i = lineCount - 1; i >= 0; i--) {
                        const itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        const quantity = rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        const customerId = rec.getValue({ fieldId: 'entity' });

                        log.debug("item line details",
                            "itemId: " + itemId +
                            ", quantity: " + quantity +
                            ", customerId: " + customerId);


                        // 1. Fetch UOM hierarchy & pricing for this item/customer
                        const uomData = getUOMHierarchyAndPricing(itemId, customerId);
                        log.debug("uomData",uomData);

                        if (!uomData || uomData.length === 0) continue;

                        // 2. Calculate optimal split (greedy algorithm: largest UOM first)
                        let remainingQty = quantity;

                        const splitLines = [];

                        for (const uom of uomData) {

                                const uomQty = Math.floor(remainingQty / uom.conversionRate);
                                log.debug("uomQty",uomQty);

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
                        // Add remainder as smallest UOM
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

                        // 3. Remove original line, insert split lines
                        rec.removeLine({ sublistId: 'item', line: i });
                        for (let j = 0; j < splitLines.length; j++) {
                                rec.insertLine({ sublistId: 'item', line: i + j });
                                rec.setSublistValue({ sublistId: 'item', fieldId: 'item', line: i + j, value: splitLines[j].itemId });
                                rec.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i + j, value: splitLines[j].quantity });
                                rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_order_uom', line: i + j, value: splitLines[j].uomId });
                                rec.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + j, value: splitLines[j].price });
                        }
                }
        }

        /**
         * Fetch UOM hierarchy and pricing for an item/customer.
         * Returns array sorted by conversionRate DESC (largest UOM first).
         */
        function getUOMHierarchyAndPricing(itemId, customerId) {
                let results = [];
                // Search customrecord_uom_price for this item (and customer, if applicable), order by conversionRate DESC
                const uomSearch = search.create({
                        type: 'customrecord_uom_price',
                        filters: [
                                ['custrecord_uom_item', 'anyof', itemId],
                                'AND',
                                ['isinactive', 'is', 'F'],
                                'AND',
                                [
                                        ['custrecord_uom_customer', 'anyof', customerId],
                                        'OR',
                                        ['custrecord_uom_customer', 'isempty', null]
                                ],
                                // Add effective/expiry date logic as needed
                        ],
                        columns: [
                                'custrecord_uom_conv_uom',
                                'custrecord_uom_conv_rate',
                                'custrecord_uom_price',
                                'custrecord_uom_conv_uom'
                        ]
                });
                uomSearch.run().each(result => {
                        results.push({
                                conversionUOM: result.getText('custrecord_uom_conv_uom'),
                                uomId: result.getValue('custrecord_uom_conv_uom'),
                                conversionRate: parseInt(result.getValue('custrecord_uom_conv_rate'), 10),
                                price: parseFloat(result.getValue('custrecord_uom_price'))
                        });
                        return true;
                });
                // Sort by conversionRate DESC (largest UOM first)
                results.sort((a, b) => b.conversionRate - a.conversionRate);
                return results;
        }

        return { beforeSubmit };
});
