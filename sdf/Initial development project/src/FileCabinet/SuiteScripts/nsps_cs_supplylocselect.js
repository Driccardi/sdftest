/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/ui/dialog', 'N/ui/message', 'N/url','./nsps_util_ui'],
    /**
     * @param{runtime} runtime
     * @param{dialog} dialog
     * @param{message} message
     * @param{serverWidget} serverWidget
     * @param{url} url
     */
    function(runtime, dialog, message, url,nspsui) {
    
        
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
            nspsui.addStyle();
            return true;
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
            if(scriptContext.fieldId == 'custcol_nsps_supply_loc_check' && scriptContext.currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_nsps_supply_loc_check'})){
                // unset checkbox
                scriptContext.currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_nsps_supply_loc_check', value: false});
                currentRecord = scriptContext.currentRecord;
                currentLine = currentRecord.getCurrentSublistIndex({sublistId: 'item'});
                inputData = {
                    headerLocation: currentRecord.getValue({fieldId: 'location'}),
                    lineLocation: currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'location'}),
                    lineItem: currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'}),
                    lineQuantity: currentRecord.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'})
                };
                if(inputData.lineItem && inputData.lineQuantity && (inputData.lineLocation || inputData.headerLocation)){
                    let customButtons = 
                    [
                        {
                            id: 'nsps_button1',
                            label: 'Refresh',
                            functionName: 'window.button1Function()'
                        },
                    ];
                    log.debug('Suitelet Input Data', inputData);
                    let objSuitelet = {
                        scriptId: 'customscript_nsps_su_locsupplyselect',
                        deploymentId: 'customdeploy_nsps_su_locsupplyselect',
                        inputData: inputData,
                        selectionType: 'number'
                    }
                    nspsui.suiteletPop('Test Suitelet Response',objSuitelet,customButtons, '1000px', '30%', '10%');
                    nspsui.addSingleInputValidation(); // prevents user from entering data on more than one line
                    window.nspsConfirm = function(){
                        var rowData = nspsui.getSelectedRows();
                        if(rowData.length > 0){
                            currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_nsps_supply_loc', value: rowData[0].qtyrequest});
                            currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_nsps_supplyqty' , value: rowData[0].inputvalue});
                        }
                        console.log(rowData);
                        nspsui.removePop();
                    }
                  window.nspsCancel = function(){
                         console.log('Cancel clicked');
                          nspsui.removePop();
                       
                    }
                    window.button1Function = function(){
                        objSuitelet.selectionType = 'number';
                        nspsui.refreshSuiteletPop(objSuitelet);
                         console.log('Button 1 clicked');
                       
                    }
                }else{
                    nspsui.toastCreate('Error', 'Please select an item and quantity and a location.', 2000);
                }
            }
            return true;

        }
    
        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {
    
        }
    
        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {
    
        }
    
        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
    
            nspsui.toastCreate('Field Changed', scriptContext.fieldId + ' has changed.',2000);
            if(scriptContext.fieldId == 'comments'){
                var textValue = scriptContext.currentRecord.getValue('comments');
                nspsui.toastCreate('Text Value', textValue);
            }
            return true;
        }
    
        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {
    
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
    
        }
    
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            validateField: validateField,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            saveRecord: saveRecord
        };
        
    });
    