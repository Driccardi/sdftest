/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * User event scripts are executed on the NetSuite server. They are executed
 * when users perform certain actions on records, such as create, load, update, copy, delete, or submit.
 *
 * This script will be used to assign an associated line id for the CS Hub.
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/02/12           shekainah.castillo                       Initial Commit
 * 1.1            2025/02/13           shekainah.castillo                       Added logic for the Associated line ID to carry over promotion items
 * 1.2            2025/02/13           SravanTejaPanjala                        Added logic for the web order with deposit
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     *
     * @param record
     * @param search
     * @returns {{afterSubmit: afterSubmit}}
     */
    (record, search, runtime) => {
        let strLogTitle;
        let objLineUsage = Object.freeze({
            appeasement : 4,
            discount: 2,
            merch: 1,
            warranty: 3,
            nonmerch: 6
        });

        const beforeSubmit = (context) => {
            strLogTitle = 'beforeSubmit'
            try {
                log.debug(strLogTitle, runtime.executionContext);
                if (runtime.executionContext === "WEBSTORE" || runtime.executionContext === "USERINTERFACE") {
                    let recObj = context.newRecord;
                    var isWebOrdWithDeposit = false;
                    var lineCount = recObj.getLineCount('item');
                    for (var i = 0; i < lineCount; i++) {
                        var depositStatus = recObj.getSublistValue('item', 'custcol_ns_deposit_status', i);
                        log.debug("depositStatus", depositStatus);
                        if (depositStatus === "1" || depositStatus === 1) {
                            isWebOrdWithDeposit = true;
                            break;
                        }
                    }
                    recObj.setValue('custbody_ns_is_web_with_dip', isWebOrdWithDeposit);
                }
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type
         * @Since 2015.2
         */
        const afterSubmit = (context) => {
            strLogTitle = 'afterSubmit'
            try{
                let strTriggerType = context.type
                log.debug(strLogTitle, strTriggerType)
                    let idSO = context.newRecord.id;
                    let transactionType = context.newRecord.type;
                    const recSO = record.load({
                        type: transactionType,
                        id: idSO,
                        isDynamic: false
                    });
                    let intCreatedFrom = recSO.getValue('createdfrom')
                    if(!intCreatedFrom){
                        updateAssociatedLineID(recSO)
                    }
            }catch(e){
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }
        
        const updateAssociatedLineID = (recSO) => {
            strLogTitle = 'updateAssociatedLineID '
            let intLineCount = recSO.getLineCount("item");
            let strMerchUniqueKey = null;
            let bSaveSO = false
            let strPromoRefKey = null;
            let strCurrentPromo = null;
            for (let i = 0; i < intLineCount; i++) {
                let intItem = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: i
                });
                let strItemType = search.lookupFields({
                    type: search.Type.ITEM,
                    id: parseInt(intItem),
                    columns: 'type'
                }).type[0].value
                log.debug(strLogTitle + 'strItemType', strItemType)
                let intLineUsage = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_nscs_itemusage",
                    line: i
                })
                intLineUsage = intLineUsage ? parseInt(intLineUsage) : null
                let strAssociatedLineID = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_cshub_associatedlineid",
                    line: i
                });
                strAssociatedLineID = strAssociatedLineID.includes("ERROR") ? null : strAssociatedLineID

                let strPromoRef = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_nscs_promotion",
                    line: i
                });
                strPromoRef = strPromoRef ? strPromoRef : null

                let strUniqueKey = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "lineuniquekey",
                    line: i
                });

                let bProtectionPlan = recSO.getSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_mhi_pp_cat_name",
                    line: i
                });
                log.debug(strLogTitle, {
                    intLineUsage : intLineUsage,
                    strAssociatedLineID : strAssociatedLineID,
                    strUniqueKey : strUniqueKey,
                    strPromoRef : strPromoRef,
                    strCurrentPromo : strCurrentPromo,
                    strItemType : strItemType,
                    strPromoRefKey: strPromoRefKey,
                    strMerchUniqueKey : strMerchUniqueKey
                })
                if(!isEmpty(strPromoRef) && isEmpty(strAssociatedLineID) && strCurrentPromo !== strPromoRef) {
                    strCurrentPromo = strPromoRef
                    strPromoRefKey = strUniqueKey
                    recSO.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cshub_associatedlineid",
                        line: i,
                        value: `${recSO.id}_${strUniqueKey}`
                    });
                    log.debug(strLogTitle + ' Promo Parent', `Line ${i} updated: ${recSO.id}_${strUniqueKey}`)
                    bSaveSO = true
                }else if(((isEmpty(strPromoRef) && strItemType==="Discount") || strCurrentPromo === strPromoRef)&& isEmpty(strAssociatedLineID) && !isEmpty(strPromoRefKey)){
                    recSO.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cshub_associatedlineid",
                        line: i,
                        value: `${recSO.id}_${strPromoRefKey}`
                    })
                    if(isEmpty(strPromoRef) && strItemType==="Discount") {
                        recSO.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_nscs_promotion",
                            line: i,
                            value: `${strCurrentPromo}`
                        })

                        recSO.setSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_nscs_itemusage",
                            line: i,
                            value: objLineUsage.discount
                        })
                    }
                    log.debug(strLogTitle + ' Promo Child', `Line ${i} updated: ${recSO.id}_${strPromoRefKey}`)
                    bSaveSO = true
                }else if(intLineUsage === objLineUsage.merch && !isEmpty(strAssociatedLineID)){
                    strMerchUniqueKey = strUniqueKey
                }
                else if(intLineUsage === objLineUsage.merch && isEmpty(strAssociatedLineID)){
                    strMerchUniqueKey = strUniqueKey
                    recSO.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cshub_associatedlineid",
                        line: i,
                        value: `${recSO.id}_${strUniqueKey}`
                    });
                    log.debug(strLogTitle+ ' Merch Parent', `Line ${i} updated: ${recSO.id}_${strUniqueKey}`)
                    bSaveSO = true
                }else if(intLineUsage !== objLineUsage.merch && isEmpty(strAssociatedLineID) && !isEmpty(strMerchUniqueKey)){
                    recSO.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_cshub_associatedlineid",
                        line: i,
                        value: `${recSO.id}_${strMerchUniqueKey}`
                    })
                    log.debug(strLogTitle+ ' Merch Child', `Line ${i} updated: ${recSO.id}_${strMerchUniqueKey}`)
                    bSaveSO = true
                }

            }
            if(bSaveSO) {
                recSO.save()
                log.audit(strLogTitle, 'Associated Line ID updated');
            }else{
                log.debug(strLogTitle, `No applicable line to update`)
            }
        }

        const isEmpty = (value) => {
            if (value === null)
                return true;
            if (value === undefined)
                return true;
            if (value === 'undefined')
                return true;
            if (value === '')
                return true;
            if (value.constructor === Object && Object.keys(value).length === 0)
                return true;
            if (value.constructor === Array && value.length === 0)
                return true;
            return false;
        }

        return {
            beforeSubmit:beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
