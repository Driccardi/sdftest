/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * This script validates if the Landed Cost Allocation Custom Record based on
 * Cost allocation, inbound shipment, and source transaction.
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost', 'N/ui/dialog', 'N/record'],(search, lib, helper, dialog, record) => {
    let strTitle;

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    const fieldChanged = (context) => {
        strTitle = 'CS: fieldChanged'
        try {
            const objErrorMessage = lib.errormessages
            const objLCADetail = lib.allocationdetail
            let recAllocationDetail = context.currentRecord
            if(context.sublistId === objLCADetail.sublist) {
                let intInboundShipment = recAllocationDetail.getValue(lib.landedcostallocation.inboundshipment)
                let intAllocationType = recAllocationDetail.getValue(lib.landedcostallocation.allocationtype)

                if(intInboundShipment){
                    dialog.alert({
                        title: objErrorMessage.allocationCombined.title,
                        message: objErrorMessage.allocationCombined.message.replace('{type}', 'an Inbound Shipment')
                    });
                    helper.setEmptySublistValueforDynamicRec(recAllocationDetail, context)
                }
                else if(!intAllocationType){
                    dialog.alert(objErrorMessage.missingAllocation);
                    helper.setEmptySublistValueforDynamicRec(recAllocationDetail, context)
                }
                else if(context.fieldId === objLCADetail.method){
                    let intAllocationMethod = recAllocationDetail.getCurrentSublistValue({
                        sublistId: context.sublistId,
                        fieldId: context.fieldId,
                    });
                    if(parseInt(intAllocationMethod) === lib.allocationmethods.flatAmount) {
                        dialog.alert(objErrorMessage.invalidAllocationMethod);
                        helper.setEmptySublistValueforDynamicRec(recAllocationDetail, context)
                    }
                }
                else if(context.fieldId === objLCADetail.transaction) {
                    let intAllocationLineCount = recAllocationDetail.getLineCount(objLCADetail.sublist)
                    let intCurrentLine = recAllocationDetail.getCurrentSublistIndex(objLCADetail.sublist)

                    let intIFCount = 0

                    for (let i = 0; i < intAllocationLineCount; i++) {
                        let intTransaction = recAllocationDetail.getSublistValue({
                            sublistId: context.sublistId,
                            fieldId: context.fieldId,
                            line: i
                        });

                        let strTranType = helper.getTransactionType(intTransaction)

                        if(strTranType === record.Type.ITEM_RECEIPT){
                            intIFCount += 1
                        }
                    }

                    if(intCurrentLine >= intAllocationLineCount){
                        intAllocationLineCount += 1
                        let intTransaction = recAllocationDetail.getCurrentSublistValue({
                            sublistId: context.sublistId,
                            fieldId: context.fieldId,
                        });

                        let strTranType = helper.getTransactionType(intTransaction)

                        if(strTranType === record.Type.ITEM_RECEIPT){
                            intIFCount += 1
                        }
                    }

                    if(intIFCount > 0 && intIFCount !== intAllocationLineCount){
                        dialog.alert({
                            title: objErrorMessage.allocationCombined.title,
                            message: objErrorMessage.allocationCombined.message.replace('{type}', 'Item Receipt')
                        });
                        helper.setEmptySublistValueforDynamicRec(recAllocationDetail, context)
                    }
                }

            }
            else if(context.fieldId === lib.landedcostallocation.inboundshipment) {
                let intInboundShipment = recAllocationDetail.getValue(lib.landedcostallocation.inboundshipment)
                let intAllocationLineCount = recAllocationDetail.getLineCount(objLCADetail.sublist)
                if (intAllocationLineCount > 0 && intInboundShipment) {
                    dialog.alert({
                        title: objErrorMessage.allocationCombined.title,
                        message: objErrorMessage.allocationCombined.message.replace('{type}', 'an Inbound Shipment')
                    });
                    helper.setEmptyValue(recAllocationDetail, context)
                }
            }
        } catch (e) {
            console.log("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            log.error("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
        }
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    const validateLine = (context) => {
        strTitle = 'CS: validateLine'
        try {
            const recLCA = context.currentRecord;
            const objLCA = lib.landedcostallocation
            const objErrorMessage = lib.errormessages
            const objLCADetail = lib.allocationdetail
            let intAllocationType = recLCA.getValue(objLCA.allocationtype)
            let bVolume = parseInt(recLCA.getValue(objLCA.byvolume)) === lib.lcayesno.yes
            log.debug(strTitle, bVolume)
            if(!bVolume){
                let intAllocationMethod = recLCA.getCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: objLCADetail.method,
                });
                if(!intAllocationMethod) {
                    dialog.alert(objErrorMessage.missingAllocationMethod);
                    return false;
                }
            }
            if(intAllocationType){
                let fltLineAmount = recLCA.getCurrentSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.amount,
                });
                let fltPercent = recLCA.getCurrentSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.percent,
                });
                if(parseInt(intAllocationType) === lib.lcaallocationtype.amount){
                    if(!fltLineAmount || fltLineAmount === 0) {
                        dialog.alert(objErrorMessage.missingAllocationAmount);
                        return false;
                    }
                    if(fltPercent) {
                        dialog.alert(objErrorMessage.incorrectAllocationAmount);
                        return false;
                    }

                }else if(parseInt(intAllocationType) === lib.lcaallocationtype.percent){
                    if(!fltPercent) {
                        dialog.alert(objErrorMessage.missingAllocationPercent);
                        return false;
                    }
                    if(fltLineAmount) {
                        dialog.alert(objErrorMessage.incorrectAllocationPercent);
                        return false;
                    }
                }
            }
            return true;
        } catch (e) {
            console.log("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            log.error("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
        }
    }



    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    const saveRecord = (context) => {
        strTitle = 'CS: saveRecord'
        try {
            const recLCA = context.currentRecord;
            const objLCA = lib.landedcostallocation
            const objErrorMessage = lib.errormessages
            let intCostCategory = recLCA.getValue(objLCA.costcategory)
            let fltAmount = recLCA.getValue(objLCA.amount)
            let bVolume = recLCA.getValue(objLCA.byvolume)
            let intInboundShipment = recLCA.getValue(objLCA.inboundshipment)
            let intSourceTran = recLCA.getValue(objLCA.sourcetransaction) ? recLCA.getValue(objLCA.sourcetransaction) : null

            let strMissingField = helper.validateRequiredFields(intCostCategory,fltAmount, bVolume);
            if(strMissingField !== true){
                dialog.alert({
                    title: objErrorMessage.missingMandatory.title,
                    message: `${objErrorMessage.missingMandatory.message} ${strMissingField} .`
                });
                return false
            }
            if(!helper.verifyLandedCostCategory(intCostCategory)){
                dialog.alert(objErrorMessage.notLandedCost);
                return false
            }

            if (helper.findExistingLCA(intCostCategory, intInboundShipment, intSourceTran, recLCA.id)) {
                dialog.alert(objErrorMessage.duplicate);
                return false
            }

            //allocation detail validation
            const objLCADetail = lib.allocationdetail
            let intAllocationType = recLCA.getValue(objLCA.allocationtype)

            let intAllocationLineCount = recLCA.getLineCount(objLCADetail.sublist)
            let fltTotalAmount = 0;
            let fltTotalPercent = 0;

            for (let i = 0; i < intAllocationLineCount; i++) {
                let fltLineAmount = recLCA.getSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.amount,
                    line: i
                });
                fltTotalAmount += fltLineAmount
                let fltPercent = recLCA.getSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.percent,
                    line: i
                });
                fltTotalPercent += fltPercent
            }


            log.debug(strTitle, {
                fltAmount : fltAmount,
                fltTotalAmount: fltTotalAmount,
                fltTotalPercent : fltTotalPercent,
                intAllocationType : intAllocationType,
                amountval: lib.lcaallocationtype.amount,
                prcntval: lib.lcaallocationtype.percent,
            });

            if(intAllocationLineCount > 0) {
                if (parseInt(intAllocationType) === lib.lcaallocationtype.amount && fltAmount !== fltTotalAmount) {
                    dialog.alert(objErrorMessage.incompleteAllocationAmount);
                    return false;
                } else if (parseInt(intAllocationType) === lib.lcaallocationtype.percent && fltTotalPercent !== 100) {
                    dialog.alert(objErrorMessage.incompleteAllocationPercent);
                    return false;
                }
            }

            return true

        } catch (e) {
            console.log("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            log.error("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
        }
    }

    return {
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        saveRecord: saveRecord
    };

});
