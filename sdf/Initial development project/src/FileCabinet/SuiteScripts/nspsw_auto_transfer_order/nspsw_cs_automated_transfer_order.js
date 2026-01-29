/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord','N/runtime','N/url','N/search','N/record','N/ui/message', 'N/ui/dialog'],

    function (currentRecord,runtime,url,search,record,message,dialog) {

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

            try {

                return true;
            } catch (error) {
                log.debug("error occured validateLine", error);

                return false;
            }
        }

      function validateInsert(scriptContext) {

            try {
                log.debug('validateLine',scriptContext);

                var objRecord = scriptContext.currentRecord;

                var scriptObj = runtime.getCurrentScript();

                var salesOrder = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_salesorder'
                });

                if(isEmpty(salesOrder)){
                    log.debug('in if',salesOrder);
                    return true;
                }
                else{
                    log.debug('in else',salesOrder);
                    dialog.alert({
                        title: 'Edits Not Allowed For Lines With Linked Sales Orders',
                        message: 'This line has a sales order linked, you cannot make edits.'
                    });

                }



            } catch (error) {
                log.debug("error occured validateLine", error);

                return false;
            }
        }
        function validateLine(scriptContext) {

            try {
                log.debug('validateLine',scriptContext);

                var objRecord = scriptContext.currentRecord;

                var scriptObj = runtime.getCurrentScript();

                var salesOrder = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_salesorder'
                });

                if(isEmpty(salesOrder)){
                    log.debug('in if',salesOrder);
                    return true;
                }
                else{
                    log.debug('in else',salesOrder);
                    dialog.alert({
                        title: 'Edits Not Allowed For Lines With Linked Sales Orders',
                        message: 'This line has a sales order linked, you cannot make edits.'
                    });

                }



            } catch (error) {
                log.debug("error occured validateLine", error);

                return false;
            }
        }
      function validateDelete(scriptContext) {

            try {
                log.debug('validatedelete',scriptContext);

                

                var objRecord = scriptContext.currentRecord;

                var scriptObj = runtime.getCurrentScript();

                var transferOrder = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_salesorder'
                });
                
                if(!transferOrder){
                  return true;
                }
                else{
                  dialog.alert({
                     title: 'Cannot Delete Line.',
                     message: 'You cannot delete this line when there is a sales order.'
                  });
                  return false;
                }




            } catch (error) {
                log.debug("error occured validateLine", error);

                return false;
            }
        }
        function isEmpty(value) {
            if (value == null || value == undefined || value == 'undefined' || value == '') {
                return true;
            }
            return false;
        }
        return {
            //fieldChanged: fieldChanged,
            validateLine: validateLine,
            pageInit: pageInit,
            validateDelete: validateDelete,
            validateInsert: validateInsert
        };

    });