/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {
    function afterSubmit(context) {
        log.debug({
            title: 'afterSubmit',
            details: 'context.type: ' + JSON.stringify(context)
        });

        if (context.type === "create" || context.type === "edit") {
            var recObj = context.newRecord;
            var lineCount = recObj.getLineCount('item');

            var rentalsObj = {};
            var items = [];
            for (var i = 0; i < lineCount; i++) {
                var item = recObj.getSublistValue('item', 'item', i);
                var assetRental = recObj.getSublistValue('item', 'custcol_nsps_rental_agreement', i);
                if (assetRental !== null && assetRental !== "") {
                    if(context.type === "edit"){
                        var oldRec = context.oldRecord;
                        var oldItem = oldRec.getSublistValue('item', 'item', i);
                        if(oldItem === item) {
                            continue;
                        }
                    }
                    items.push(item);
                    rentalsObj[recObj.getSublistValue('item', 'custcol_nsps_rental_agreement', i)] = {
                        "item": recObj.getSublistValue('item', 'item', i),
                        "line": recObj.getSublistValue('item', 'line', i),
                        "address": recObj.getValue('shipaddress'),
                        "customer": recObj.getValue('entity'),
                        "fam": "",
                        "serial": ""
                    }
                }
            }

            if (items.length > 0) {
                // Making a search on the FAM assert record.
                var assetSearchObj = search.create({
                    type: "customrecord_ncfar_asset",
                    filters:
                        [
                            ["custrecord_asset_customer", "anyof", recObj.getValue('entity')],
                            "AND",
                            ["custrecord_asset_itemlink", "anyof", items]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "custrecord_assetserialno", label: "Serial No."}),
                            search.createColumn({name: "custrecord_asset_itemlink", label: "Item"}),
                        ]
                });

                var results = executeSearch(assetSearchObj);

                if (results.length > 0) {
                    var famData = {};
                    for (var i = 0; i < results.length; i++) {
                        famData[results[i].getValue('custrecord_asset_itemlink')] = {
                            "fam": results[i].getValue('internalid'),
                            "serial": results[i].getValue('custrecord_assetserialno')
                        }
                    }

                    for (var key in rentalsObj) {
                        if (rentalsObj[key].item in famData) {
                            rentalsObj[key].fam = famData[rentalsObj[key].item].fam;
                            rentalsObj[key].serial = famData[rentalsObj[key].item].serial;
                        }
                    }
                }
            }


            // Looping through all the data and updating the rentals aggrement record.
            for(var key in rentalsObj){
                record.submitFields({
                    type:'customrecord_asset_rental_agreement',
                    id:key,
                    values: {
                        'custrecord_source_transaction': context.newRecord.id,
                        'custrecord_source_trans_line': rentalsObj[key].line,
                        'custrecord_ar_customer':rentalsObj[key].customer,
                        'custrecord_ar_address':rentalsObj[key].address,
                        'custrecord_serialized_item':rentalsObj[key].item,
                        'custrecord_ar_serial_number':rentalsObj[key].serial,
                        'custrecord_fixed_asset':rentalsObj[key].fam
                    }
                });
            }

        }
    }

    /**
     * Function will execute a search, retrieve all results, and return the results in an array
     *
     * @param {object} srch - The reason for the failure.
     */
    function executeSearch(srch) {
        var results = [];

        var pagedData = srch.runPaged({
            pageSize: 1000
        });
        pagedData.pageRanges.forEach(function (pageRange) {
            var page = pagedData.fetch({
                index: pageRange.index
            });
            page.data.forEach(function (result) {
                results.push(result);
            });
        });

        return results;
    }

    return {
        afterSubmit: afterSubmit
    };
});