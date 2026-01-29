/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (record, runtime, search) => {

        const afterSubmit = (scriptContext) => {
            try{
                const objCurRec = scriptContext.newRecord;
                const objCustRecord = record.load({
                    type: objCurRec.type,
                    id: objCurRec.id
                });
                if(objCurRec.type == 'purchaseorder'){
                   let intLineCount = objCustRecord.getLineCount({sublistId: 'item'});
                   let boolEligible = true;
                   let objScript = runtime.getCurrentScript();
                   let intSearchID = objScript.getParameter({name: 'custscript_ns_csgn_eligible_po_srch'});
                   let objSearch = search.load({id:intSearchID});
                   let objfilter = search.createFilter({
                       name: 'internalid',
                       operator: search.Operator.IS,
                       values: objCustRecord.id
                   });
                   log.debug("Internal ID: " + objCustRecord.id);
                   objSearch.filters.push(objfilter);
                   let objResults = getAllResults(objSearch);
                   const objItemGroup = groupedByItem(objResults);
                   log.debug("Results: ",objItemGroup);

                    if (Object.keys(objItemGroup).length === 0) {
                        boolEligible = false;
                        log.debug("Reason: ", "No values retreived from search")
                    } else {
                        for (const key in objItemGroup) {
                            const item = objItemGroup[key];
                            const isEqual = item.sumQuantity === item.maxQuantity;
                            if(!isEqual){
                                boolEligible = false;
                                log.debug("Not Eligible: ",{
                                    item: item,
                                    sumQuantity: item.sumQuantity,
                                    maxQuantity: item.maxQuantity
                                });
                                break;
                            }
                        }
                    }
                    if(boolEligible){
                        objCustRecord.setValue('custbody_ns_csgn_cons_eligible',true);
                    }else{
                        objCustRecord.setValue('custbody_ns_csgn_cons_eligible',false);
                    }
                    objCustRecord.save();
                }

            }catch (e) {
                log.error("Error in After Submit",e);
            }


        }

        const groupedByItem = (objResults) => {
            const groupedByItem = {};

            objResults.forEach(result => {
                const itemId = result.getValue({name: 'item', summary: 'GROUP'});
                const itemName = result.getText({name: 'item', summary: 'GROUP'});
                const maxQty = parseFloat(result.getValue({name: 'quantity', summary: 'MAX'}));
                const sumQty = parseFloat(result.getValue({name: 'formulanumeric', summary: 'SUM'}));

                if (!groupedByItem[itemId]) {
                    groupedByItem[itemId] = {
                        itemId,
                        itemName,
                        maxQuantity: maxQty,
                        sumQuantity: sumQty
                    };
                } else {
                    groupedByItem[itemId].maxQuantity = Math.max(groupedByItem[itemId].maxQuantity, maxQty);
                    groupedByItem[itemId].sumQuantity += sumQty;
                }
            });
            return groupedByItem;
        }

        const getAllResults = (objSearch, maxResults) => {
            try {
                let intPageSize = 1000;
                if (maxResults && maxResults < 1000) {
                    intPageSize = maxResults;
                }

                let objResultSet = objSearch.runPaged({pageSize: intPageSize});
                let arrReturnSearchResults = [];
                let j = objResultSet.pageRanges.length;

                if (j && maxResults) {
                    j = Math.min(Math.ceil(maxResults / intPageSize), j);
                }

                for (let i = 0; i < j; i++) {
                    let objResultSlice = objResultSet.fetch({
                        index: objResultSet.pageRanges[i].index
                    });
                    arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
                }

                return maxResults ? arrReturnSearchResults.slice(0, maxResults) : arrReturnSearchResults;

            } catch (e) {
                log.error({title: 'getAllResults Error', details: e.toString()});
            }
        }

        return {afterSubmit}

    });
