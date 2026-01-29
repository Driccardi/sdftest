/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/message','N/search',], (message,search) => {


    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        const { currentRecord, fieldId,sublistId } = scriptContext;
        console.log("fieldId: "+fieldId);
        console.log("sublistId: "+sublistId);
        // Page Record Type / Form control
        if (sublistId === "item" && fieldId === 'item') {
           var item = currentRecord.getCurrentSublistValue(sublistId,fieldId);
           console.log("item: "+item);
           if (item) {
               var customer = currentRecord.getValue('entity');
               console.log("customer: "+customer);
               var assetSearchObj = search.create({
                   type: "customrecord_ncfar_asset",
                   filters:
                       [
                           ["custrecord_asset_customer","anyof",customer],
                           "AND",
                           ["custrecord_asset_itemlink","anyof",item]
                       ],
                   columns:
                       [
                           search.createColumn({name: "internalid", label: "Internal ID"})
                       ]
               });

               var results = executeSearch(assetSearchObj);
               console.log("results: "+ JSON.stringify(results));
               if (results.length > 0) {
                   showError("The Item "+currentRecord.getCurrentSublistText(sublistId,fieldId)+" is already in a Customer "+currentRecord.getText('entity')+ " for FAM record")
                   currentRecord.setCurrentSublistValue(sublistId,fieldId,"");
               }
           }
        }
    }

    /**
     * Displays an error message for the label printing process failure.
     *
     * @param {string} reason - The reason for the failure.
     */
    function showError(reason) {
        // const confirmMsg = message.create({
        //     title: 'Error:',
        //     message: reason,
        //     type: message.Type.ERROR
        // });
        // confirmMsg.show({
        //     duration: 10000
        // });
        alert(reason);
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
        fieldChanged
    };
});
