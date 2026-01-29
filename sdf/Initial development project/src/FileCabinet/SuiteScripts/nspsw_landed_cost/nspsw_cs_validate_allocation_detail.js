/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * Client scripts are scripts that are executed by predefined event triggers in the client browser.
 * They can validate user-entered data and auto-populate fields or sublists at various form events.
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2024/10/21           shekainah.castillo                       Initial Commit
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost', 'N/ui/dialog', 'N/search'],(record, lib, helper, dialog, search) => {
    let strTitle;
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const pageInit = (context) => {
        strTitle = 'CS: pageInit'
        try {
        } catch (e) {
            console.log("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            log.error("Error at [" + strTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
        }
    }

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
            const objLCA = lib.landedcostallocation
            const objLCADetail = lib.allocationdetail
            const objErrorMessage = lib.errormessages
            const recAllocationDetail = context.currentRecord
            if(context.fieldId === objLCADetail.parent) {
                let intLCA = recAllocationDetail.getValue(objLCADetail.parent)
                let objLCARecord = search.lookupFields({
                    id: parseInt(intLCA),
                    type: objLCA.id,
                    columns: [objLCA.byvolume, objLCA.allocationtype]
                });

                log.debug(strTitle, objLCARecord)
                let objAllocationMethod = recAllocationDetail.getField({
                    fieldId: objLCADetail.method,
                });
                objAllocationMethod.isMandatory = !!(objLCARecord[objLCA.byvolume][0] && parseInt(objLCARecord[objLCA.byvolume][0].value) === lib.lcayesno.no);

                if (objLCARecord[objLCA.allocationtype][0]) {
                    let objAllocationPercent = recAllocationDetail.getField(objLCADetail.percent)
                    let objAllocationAmount = recAllocationDetail.getField(objLCADetail.amount)
                    if (parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.percent) {
                        objAllocationAmount.isMandatory = false
                        objAllocationPercent.isMandatory = true
                    }else if (parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.amount) {
                        objAllocationAmount.isMandatory = true
                        objAllocationPercent.isMandatory = false
                    }
                }
            }

            if(context.fieldId === objLCADetail.method){
                let intAllocationMethod = recAllocationDetail.getValue({
                    fieldId: objLCADetail.method,
                });
                 if (parseInt(intAllocationMethod) === lib.allocationmethods.flatAmount) {
                    dialog.alert(objErrorMessage.invalidAllocationMethod);
                     helper.setEmptyValue(recAllocationDetail, context)
                    return false;
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
            const objLCA = lib.landedcostallocation
            const objLCADetail = lib.allocationdetail
            const objErrorMessage = lib.errormessages
            const recAllocationDetail = context.currentRecord
            let intLCA = recAllocationDetail.getValue(objLCADetail.parent)
            log.debug(strTitle,{
                objLCA : objLCA,
                objLCADetail : objLCADetail,
                intLCA : intLCA
            })
            let objLCARecord = search.lookupFields({
                id: parseInt(intLCA),
                type: objLCA.id,
                columns: [objLCA.inboundshipment, objLCA.byvolume, objLCA.allocationtype]
            });

            log.debug(strTitle, objLCARecord)

            if(objLCARecord[objLCA.inboundshipment][0]){
                dialog.alert({
                    title: objErrorMessage.allocationCombined.title,
                    message: objErrorMessage.allocationCombined.message.replace('{type}', 'an Inbound Shipment')
                });
                return false;
            }

            if(objLCARecord[objLCA.byvolume][0] && parseInt(objLCARecord[objLCA.byvolume][0].value) === lib.lcayesno.no){
                let intAllocationMethod = recAllocationDetail.getValue({
                    fieldId: objLCADetail.method,
                });

                if(!intAllocationMethod) {
                    dialog.alert(objErrorMessage.missingAllocationMethod);
                    return false;
                }else if(parseInt(intAllocationMethod) === lib.allocationmethods.flatAmount){
                    dialog.alert(objErrorMessage.invalidAllocationMethod);
                    return false;
                }
            }

            if(objLCARecord[objLCA.allocationtype][0]){
                if(parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.percent){
                    if(!recAllocationDetail.getValue(objLCADetail.percent)){
                        dialog.alert(objErrorMessage.missingAllocationPercent);
                        return false;
                    }
                    if(recAllocationDetail.getValue(objLCADetail.amount)){
                        dialog.alert(objErrorMessage.incorrectAllocationPercent);
                        recAllocationDetail.setValue(objLCADetail.amount, 0)
                        return false;
                    }
                }else if(parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.amount){
                    if(!recAllocationDetail.getValue(objLCADetail.amount)){
                        dialog.alert(objErrorMessage.missingAllocationAmount);
                        return false;
                    }
                    if(recAllocationDetail.getValue(objLCADetail.percent)){
                        dialog.alert(objErrorMessage.incorrectAllocationAmount);
                        recAllocationDetail.setValue(objLCADetail.percent, 0)
                        return false;
                    }
                }
            }
            let idTransaction =recAllocationDetail.getValue(objLCADetail.transaction)
            let strTrantype = helper.getTransactionType(idTransaction)
            let bValidTranType = helper.findRelatedAllocationDetail(intLCA, strTrantype)
            if(!bValidTranType){
                dialog.alert({
                    title: objErrorMessage.allocationCombined.title,
                    message: objErrorMessage.allocationCombined.message.replace('{type}', 'Item Receipt')
                });
                return false
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
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };

});
