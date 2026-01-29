/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author Heeju Park
 */
define(["N/search", '/SuiteScripts/_nscs/Library/NSUtilvSS2.js'],

    function (search, NSUtil) {



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

            // Once Resource is selected, source the 'Labor Cost' from the Employee record.
            if (triggerFieldId === 'allocationresource') {
                let triggerFieldValue = currentRecord.getValue({
                    fieldId: triggerFieldId
                });

                let objEmployeeFieldsLookUp = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: triggerFieldValue,
                    columns: ['laborcost']
                });

                log.debug(objEmployeeFieldsLookUp)
                if(!NSUtil.isEmpty(objEmployeeFieldsLookUp)){
                    currentRecord.setValue({
                        fieldId: 'custevent_ps_ra_unit_cost',
                        value: objEmployeeFieldsLookUp['laborcost']
                    });
                } else {
                    currentRecord.setValue({
                        fieldId: 'custevent_ps_ra_unit_cost',
                        value: 0
                    });
                }


            }

        }


        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

            let currentRecord = scriptContext.currentRecord;

            let isCopyTaskAssignment = currentRecord.getValue({ fieldId: 'custevent_psware_ra_copytask' })
            let idAllocationUnit = currentRecord.getValue({ fieldId: 'allocationunit'});
            let percentUnits = currentRecord.getValue({ fieldId: 'custevent_ps_ra_units'});
            let fltUnitCost = currentRecord.getValue({ fieldId: 'custevent_ps_ra_unit_cost'});

            let fldUnits = currentRecord.getField({ fieldId: 'custevent_ps_ra_units'});
            let fldUnitCost = currentRecord.getField({ fieldId: 'custevent_ps_ra_unit_cost'});

            if(isCopyTaskAssignment){

                if(idAllocationUnit !== 'H'){
                    alert(`The record cannot be saved because the selected Allocation Unit is incorrect. It must be set to 'Hours' in order to copy to Project Task Assignment.` );
                    return false; // Prevent saving the record
                }


                if(!percentUnits){
                    alert(`The record cannot be saved because ${fldUnits.label} is missing. Please enter a value for ${fldUnits.label}.` );
                    return false; // Prevent saving the record
                }


                if(!fltUnitCost){
                    alert(`The record cannot be saved because ${fldUnitCost.label} is missing. Please enter a value for ${fldUnitCost.label}.` );
                    return false; // Prevent saving the record
                }


                return true; // Allow saving the record

            }

            return true; // Allow saving the record
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };

    });
