/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime','N/search'], function (record, runtime,search) {
    function afterSubmit(context) {
        try{
            log.debug({
                title: 'afterSubmit',
                details: 'context.type: ' + JSON.stringify(context)
            });

            if (context.type === "create" || context.type === "edit") {
                var recObj = context.newRecord;
                var lineCount = recObj.getLineCount('item');

                var items = [];
                for (var i = 0; i < lineCount; i++) {
                    items.push(recObj.getSublistValue('item', 'item',i))
                }

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
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                });

                var results = executeSearch(assetSearchObj);

                if (results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        record.submitFields({
                            type: "customrecord_ncfar_asset",
                            id: results[i].id,
                            values: {
                                'custrecord_asset_customer': ""
                            }
                        });
                    }
                }
            }
        }catch (e) {
            log.error("Error in after submit:",e);
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