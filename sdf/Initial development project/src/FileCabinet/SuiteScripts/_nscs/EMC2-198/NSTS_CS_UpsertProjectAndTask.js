/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Heeju Park
 */
define(['/SuiteScripts/_nscs/Library/NSUtilvSS2.js'],

    function (NSUtil) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let currentRecord = scriptContext.currentRecord;

            let idProject = currentRecord.getValue({fieldId: 'job'});

            if(!NSUtil.isEmpty(idProject)){
                console.log(`idProject: ${idProject}`)
                let fldNewProject = currentRecord.getField({ fieldId: 'custbody_new_project'});
                fldNewProject.isDisplay = false;
            }

        }

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
            let currentRecord = scriptContext.currentRecord;
            let triggerFieldId = scriptContext.fieldId;

            // If 'Individual/Sole Proprietor' is selected (Is Individual?)
            if (triggerFieldId === 'job') {

                let idProject = currentRecord.getValue({fieldId: triggerFieldId});
                let fldNewProject = currentRecord.getField({ fieldId: 'custbody_new_project'});
                if(!NSUtil.isEmpty(idProject)){
                    fldNewProject.isDisplay = false;
                }else {
                    fldNewProject.isDisplay = true;
                }
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
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
