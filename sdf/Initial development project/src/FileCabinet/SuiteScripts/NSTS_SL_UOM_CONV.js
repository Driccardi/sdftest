
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

//Let users enter an item, customer, quantity, and UOM, and see the split and pricing breakdown before creating a transaction.

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], (ui, search) => {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            const form = ui.createForm({ title: 'UOM Conversion & Pricing Simulator' });
            form.addField({ id: 'custpage_item', type: ui.FieldType.SELECT, label: 'Item', source: 'item' });
            form.addField({ id: 'custpage_customer', type: ui.FieldType.SELECT, label: 'Customer', source: 'customer' });
            form.addField({ id: 'custpage_qty', type: ui.FieldType.INTEGER, label: 'Quantity' });
            form.addField({ id: 'custpage_uom', type: ui.FieldType.SELECT, label: 'Order UOM', source: 'unitstype' });
            form.addSubmitButton({ label: 'Simulate' });

            context.response.writePage(form);

        } else if (context.request.method === 'POST') {
            const req = context.request;
            const itemId = req.parameters.custpage_item;
            const customerId = req.parameters.custpage_customer;
            const qty = parseInt(req.parameters.custpage_qty, 10);
            const uomId = req.parameters.custpage_uom;

            // Fetch UOM hierarchy and pricing
            let uomData = [];
            const uomSearch = search.create({
                type: 'customrecord_uom_price',
                filters: [
                    ['custrecord_uom_item', 'anyof', itemId],
                    'AND',
                    [
                        ['custrecord_uom_customer', 'anyof', customerId],
                        'OR',
                        ['custrecord_uom_customer', 'isempty', null]
                    ]
                ],
                columns: [
                    'custrecord_uom_conv_uom',
                    'custrecord_uom_conv_rate',
                    'custrecord_uom_price'
                ]
            });
            uomSearch.run().each(result => {
                uomData.push({
                    uomId: result.getValue('custrecord_uom_conv_uom'),
                    uomName: result.getText('custrecord_uom_conv_uom'),
                    conversionRate: parseInt(result.getValue('custrecord_uom_conv_rate'), 10),
                    price: parseFloat(result.getValue('custrecord_uom_price'))
                });
                return true;
            });
            uomData.sort((a, b) => b.conversionRate - a.conversionRate);

            // Find entered UOM's conversion rate
            const enteredUOM = uomData.find(uom => uom.uomId == uomId);
            let baseQty = qty * (enteredUOM ? enteredUOM.conversionRate : 1);

            // Split into optimal UOMs
            let splitLines = [];
            let remainingQty = baseQty;
            for (const uom of uomData) {
                const uomQty = Math.floor(remainingQty / uom.conversionRate);
                if (uomQty > 0) {
                    splitLines.push({
                        uom: uom.uomName,
                        quantity: uomQty,
                        price: uom.price,
                        subtotal: uomQty * uom.price
                    });
                    remainingQty -= uomQty * uom.conversionRate;
                }
            }
            if (remainingQty > 0 && uomData.length) {
                const smallest = uomData[uomData.length - 1];
                splitLines.push({
                    uom: smallest.uomName,
                    quantity: remainingQty,
                    price: smallest.price,
                    subtotal: remainingQty * smallest.price
                });
            }

            // Build result form
            const form = ui.createForm({ title: 'UOM Conversion & Pricing Simulator' });
            form.addField({ id: 'custpage_item', type: ui.FieldType.SELECT, label: 'Item', source: 'item' }).defaultValue = itemId;
            form.addField({ id: 'custpage_customer', type: ui.FieldType.SELECT, label: 'Customer', source: 'customer' }).defaultValue = customerId;
            form.addField({ id: 'custpage_qty', type: ui.FieldType.INTEGER, label: 'Quantity' }).defaultValue = qty;
            form.addField({ id: 'custpage_uom', type: ui.FieldType.SELECT, label: 'Order UOM', source: 'unitstype' }).defaultValue = uomId;
            form.addSubmitButton({ label: 'Simulate' });

            const sublist = form.addSublist({ id: 'custpage_result', label: 'Split & Pricing', type: ui.SublistType.LIST });
            sublist.addField({ id: 'col_uom', type: ui.FieldType.TEXT, label: 'UOM' });
            sublist.addField({ id: 'col_qty', type: ui.FieldType.INTEGER, label: 'Qty' });
            sublist.addField({ id: 'col_price', type: ui.FieldType.CURRENCY, label: 'Unit Price' });
            sublist.addField({ id: 'col_subtotal', type: ui.FieldType.CURRENCY, label: 'Subtotal' });

            let total = 0;
            splitLines.forEach((line, i) => {
                sublist.setSublistValue({ id: 'col_uom', line: i, value: line.uom });
                sublist.setSublistValue({ id: 'col_qty', line: i, value: line.quantity.toString() });
                sublist.setSublistValue({ id: 'col_price', line: i, value: line.price.toFixed(2) });
                sublist.setSublistValue({ id: 'col_subtotal', line: i, value: line.subtotal.toFixed(2) });
                total += line.subtotal;
            });

            form.addField({ id: 'custpage_total', type: ui.FieldType.CURRENCY, label: 'Total Price' }).defaultValue = total.toFixed(2);

            context.response.writePage(form);
        }
    }

    return { onRequest };
});
