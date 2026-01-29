/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search','N/runtime','./NSCreateInventory'],

    (record, search,runtime,NSCreateInventory) => {


        const getInputData = (inputContext) => {
            let objScript = runtime.getCurrentScript();
            let intSearchId = objScript.getParameter({ name: 'custscript_ns_fam_asset_search_param' });
            return{
                type: 'search',
                id: intSearchId
            }
        }


        const reduce = (reduceContext) => {
            try{
                let objAssetsDisposed = JSON.parse(reduceContext.values[0]);
                log.debug("obj Assets Disposed:",objAssetsDisposed);
                let intFAMAssetID = objAssetsDisposed.id;
                let intAssetType = objAssetsDisposed.values.custrecord_assettype.value;
                let intAmount = objAssetsDisposed.values.custrecord_assetcost;
                let strSerialNo = objAssetsDisposed.values.custrecord_assetserialno;
                let intSubsidiary = objAssetsDisposed.values.custrecord_assetsubsidiary.value;
                log.debug("Details: ", " Asset Type: " + intAssetType + " Amount: " + intAmount + " SNo : " + strSerialNo +" Subsidiary: " + intSubsidiary);

                if(strSerialNo && intAssetType){
                    let objAssetTypeData = search.lookupFields({
                        type: 'customrecord_ns_asset_type_mapping',
                        id: intAssetType,
                        columns: ['custrecord_serialized_inv_item','custrecord_inv_adj_acct']
                    });
                    log.debug("Asset Type Mapping Lookup : ", {
                        serializedInventoryItem: objAssetTypeData['custrecord_serialized_inv_item'],
                        inventoryAdjustmentAccount: objAssetTypeData['custrecord_inv_adj_acct']
                    });
                    let intSeraialInvItem = objAssetTypeData['custrecord_serialized_inv_item']?.[0]?.value
                    // let objSubsidiary = search.lookupFields({
                    //     type: 'serializedinventoryitem',
                    //     id: intSeraialInvItem,
                    //     columns: ['subsidiary']
                    // });
                    // log.debug("Serialized Inventory Item Subsidiary Lookup : ", {
                    //     subsidiary: objSubsidiary['subsidiary']
                    // });

                    let objScript = runtime.getCurrentScript();
                    let intLocation = objScript.getParameter({ name: 'custscript_ns_location_parameter' });

                    if(objAssetTypeData['custrecord_serialized_inv_item'] && intLocation && intSubsidiary){
                        let inventoryAdjustmentId = NSCreateInventory.createInventoryAdjustment({
                            assetId: intFAMAssetID,
                            account: objAssetTypeData['custrecord_inv_adj_acct'][0].value,
                            subsidiary: intSubsidiary,
                            itemId: intSeraialInvItem,
                            location: intLocation,
                            serialNumber: strSerialNo,
                            amount: intAmount,
                            quantity : -1
                        });

                        log.debug("Saved Inventory Record", inventoryAdjustmentId);
                        let objCurrentRec = record.load({ type: 'customrecord_ncfar_asset', id: intFAMAssetID });
                        objCurrentRec.setValue('custrecordnsps_disp_adj_created',true);
                        objCurrentRec.save();


                    }
                    log.debug("Completed");

                }
            }catch (e) {
                log.error("Error in Reduce: ",e);
            }

        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, reduce, summarize}

    });
