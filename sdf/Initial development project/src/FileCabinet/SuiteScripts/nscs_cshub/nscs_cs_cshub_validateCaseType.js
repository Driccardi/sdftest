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
 * 1.0            2024/02/14           shekainah.castillo                       Script to Validate Case Type on Case Record Based on Original Case Type
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/dialog'],(search, dialog) => {
    let strTitle;
    let intPreviousCaseType;
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
            let recCase = context.currentRecord;
            intPreviousCaseType = recCase.getValue('custevent_cshub_case_type');
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
            let recCase = context.currentRecord;
            if(context.fieldId === "custevent_cshub_case_type") {
                validateCaseType(recCase)
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

    const validateCaseType = (recCase) => {
        strTitle = 'validateCaseType';
        let intCaseType = recCase.getValue('custevent_cshub_case_type');
        let intOriginalCaseType = recCase.getValue('custevent_cshub_originalcasetype');
        if (isEmpty(intOriginalCaseType) || isEmpty(intCaseType)) return;

        let intCaseParent = search.lookupFields({
            type: 'customrecord_cshub_caseactions',
            id: intCaseType,
            columns: 'parent'
        }).parent[0]
        intCaseParent = intCaseParent ? intCaseParent.value : null
        console.log('Case Detail',{
            intCaseParent : intCaseParent,
            intOriginalCaseType :intOriginalCaseType,
            intCaseType : intCaseType,
            intPreviousCaseType : intPreviousCaseType,
            hasCaseParent :!isEmpty(intCaseParent),
            parentIsOriginalCase : parseInt(intCaseParent) === parseInt(intOriginalCaseType),
            CaseIsOriginal: parseInt(intCaseType) === parseInt(intOriginalCaseType),

        })

        if(parseInt(intCaseType) === parseInt(intOriginalCaseType) || (!isEmpty(intCaseParent) && (parseInt(intCaseParent) === parseInt(intOriginalCaseType)))){
            intPreviousCaseType = intCaseType
            return;
        } else {
            dialog.alert({
                title: 'WRONG_CASE_TYPE',
                message: 'Selected case type is not a child of the original case type.',
            });
            recCase.setValue({
                fieldId: 'custevent_cshub_case_type',
                value: intPreviousCaseType,
                ignoreFieldChange: true
            })
        }
    }

    function isEmpty(value) {
        let emptyValue = ((value === '' || value === null || value === undefined)
            || (value.constructor === Array && value.length === 0)
            || (value.constructor === Object && (function (v) {
                for (var k in v) return false;
                return true;
            })(value)));
        return emptyValue
    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };

});
