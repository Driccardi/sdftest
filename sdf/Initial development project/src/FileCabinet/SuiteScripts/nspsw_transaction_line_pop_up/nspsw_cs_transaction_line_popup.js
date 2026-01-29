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
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime','./nspsw_cm_pop_up_ui', './nspsw_cm_pop_up_helper', './nspsw_cm_pop_up_lib'],(search, runtime, ui, helper, lib) => {
    let strTitle;
    let strType;
    let bEnablePopUp = false
    let arrFieldTrigger = []
    const objConfigField = lib.transactionlineconfig
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
        strTitle = 'CS: fieldChanged'
        try {
            strType = context.currentRecord.type
            bEnablePopUp = helper.verifyRecordConfiguration(strType)
            // alert(context.currentRecord.type)
            // alert(bEnablePopUp)
            if(bEnablePopUp){
                ui.addStyle();
                arrFieldTrigger = helper.getSearchValues(strType, objConfigField.fieldtrigger)
                alert(JSON.stringify(arrFieldTrigger))
                log.debug(strTitle, arrFieldTrigger)
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
            if(bEnablePopUp && context.sublistId === 'item'){
                if(arrFieldTrigger.hasOwnProperty(context.fieldId)){
                    let idConfig = arrFieldTrigger[context.fieldId]
                    alert(context.fieldId + idConfig)
                    let recTransaction = context.currentRecord;
                    //unset checkbox
                    let intCurrentIndex = recTransaction.getCurrentSublistIndex('item')
                    let objField = recTransaction.getSublistField({
                        sublistId: 'item',
                        fieldId: context.fieldId,
                        line: intCurrentIndex
                    });
                    log.debug(strTitle, objField)
                    if(objField.type === 'checkbox') {
                        recTransaction.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: context.fieldId,
                            value: false,
                            ignoreFieldChange: true
                        })
                    }
                    // recTransaction.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'price',
                    //     value: parseInt(1),
                    //     ignoreFieldChange: false
                    // })
                    //
                    // recTransaction.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'rate',
                    //     value: parseFloat(359.99),
                    //     ignoreFieldChange: true
                    // })
                    helper.processTranLinePopUp(idConfig, recTransaction)
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
     * Function to be executed when field is slaved.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     *
     * @since 2015.2
     */
    const postSourcing = (context) => {
    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @since 2015.2
     */
    const sublistChanged = (context) => {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @since 2015.2
     */
    const lineInit = (context) => {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     * @param {number} context.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} context.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    const validateField = (context) => {
        ui.toastCreate('Field Changed', context.fieldId + ' has changed.',2000);
        if(context.fieldId == 'comments'){
            var textValue = context.currentRecord.getValue('comments');
            ui.toastCreate('Text Value', textValue);
        }
        return true;
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

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    const validateInsert = (context) => {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} context
     * @param {Record} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    const validateDelete = (context) => {

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

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };

});
