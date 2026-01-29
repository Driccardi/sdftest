/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime','N/search','./NSCreateInventory'],

    (record, runtime, search,NSCreateInventory) => {

        const afterSubmit = (scriptContext) => {
            try {
                log.debug("Script Context Type: ",scriptContext.type);
                if (scriptContext.type === 'create' || scriptContext.type === 'delete') {
                    let objCurrentRecord = scriptContext.newRecord;
                    let objCurrentRec = record.load({ type: objCurrentRecord.type, id: objCurrentRecord.id });

                    let boolLeasable = objCurrentRec.getValue('custrecord_asset_rentable');
                    let strSerialNo = objCurrentRec.getValue('custrecord_assetserialno');
                    let intAssetType = objCurrentRec.getValue('custrecord_assettype');
                    let intAmount = objCurrentRec.getValue('custrecord_assetcurrentcost');
                    let intSubsidiary = objCurrentRec.getValue('custrecord_assetsubsidiary');

                    log.debug("FAM Asset Details", {
                        leasable: boolLeasable,
                        serialNumber: strSerialNo,
                        assetType: intAssetType,
                        amount: intAmount,
                        subsidiary: intSubsidiary
                    });

                    if (boolLeasable && strSerialNo && intAssetType) {
                        let objAssetTypeData = search.lookupFields({
                            type: 'customrecord_ns_asset_type_mapping',
                            id: intAssetType,
                            columns: ['custrecord_serialized_inv_item', 'custrecord_inv_adj_acct']
                        });


                        let intSeraialInvItem = objAssetTypeData['custrecord_serialized_inv_item']?.[0]?.value;

                        // let objSubsidiary = search.lookupFields({
                        //     type: 'serializedinventoryitem',
                        //     id: intSeraialInvItem,
                        //     columns: ['subsidiary']
                        // });
                        //
                        // log.debug("Subsidiary: ",objSubsidiary['subsidiary'][0].value);

                        let objScript = runtime.getCurrentScript();
                        let intLocation = objScript.getParameter({ name: 'custscript_ns_location_param' });
                        if(scriptContext.type === 'delete'){
                            if (objAssetTypeData['custrecord_serialized_inv_item'] && intLocation && intSubsidiary){
                                let inventoryAdjustmentId = NSCreateInventory.createInventoryAdjustment({
                                    assetId: objCurrentRec.id,
                                    account: objAssetTypeData['custrecord_inv_adj_acct'][0].value,
                                    subsidiary: intSubsidiary,
                                    itemId: intSeraialInvItem,
                                    location: intLocation,
                                    serialNumber: 'strSerialNo',
                                    amount: intAmount,
                                    quantity : -1
                                });

                                log.debug("Saved Inventory Record", inventoryAdjustmentId);
                            }
                        }else{
                            if (objAssetTypeData['custrecord_serialized_inv_item'] && intLocation && intSubsidiary) {

                                let inventoryAdjustmentId = NSCreateInventory.createInventoryAdjustment({
                                    assetId: objCurrentRec.id,
                                    account: objAssetTypeData['custrecord_inv_adj_acct'][0].value,
                                    subsidiary: intSubsidiary,
                                    itemId: intSeraialInvItem,
                                    location: intLocation,
                                    serialNumber: strSerialNo,
                                    amount: intAmount,
                                    quantity : 1
                                });

                                log.debug("Saved Inventory Record", inventoryAdjustmentId);

                                objCurrentRec.setValue('custrecord_asset_itemlink', intSeraialInvItem);
                                objCurrentRec.save();
                            }
                        }

                    }
                }
            } catch (e) {
                log.error("Error in After Submit", e);
            }
        }

        return { afterSubmit}

    });
