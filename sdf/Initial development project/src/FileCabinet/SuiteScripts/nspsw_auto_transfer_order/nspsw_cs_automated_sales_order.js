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
         * @name obj_features_std_cost
         * Set of NetSuite Features used in Standard Costing
         * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
         */
        const obj_features_std_cost = Object.freeze({
            pickPackShip: "pickpackship"
        });
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

                var featureInEffect = runtime.isFeatureInEffect({
                    feature: obj_features_std_cost.pickPackShip
                });
                log.debug('auto location assignment feature is enabled: ', featureInEffect);

                var objRecord = scriptContext.currentRecord;

                var scriptObj = runtime.getCurrentScript();

                var transferOrder = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferorder'
                });
                var toQuant = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferqty'
                });
                var toLocation = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferfromlocation'
                });
                if(toLocation){
                    if(!toQuant){
                        dialog.alert({
                            title: 'You must enter a transfer quantity.',
                            message: 'If you enter a transfer from location you must specifiy a quantity.'
                        });
                        return false;
                    }
                }

                if(!transferOrder){
                    var quantity = objRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
                    log.debug("quantity:",quantity)
                    var transferQty = objRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_psw_transferqty'
                    });
                    log.debug("transferQty:",transferQty)

                    if(!transferQty){
                        transferQty = 0;
                    }
                    if(quantity<transferQty){
                        dialog.alert({
                            title: 'Quantity must be greater than or equal to Transfer QTY.',
                            message: 'Please review and ensure transfer qty is greater than or equal to quantity.'
                        });
                        return false;
                    }
                    else{
                        return true;
                    }
                }
                else{

                    var TO = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: transferOrder,
                        isDynamic: true,
                    });

                    var status = TO.getValue({
                        fieldId: 'orderstatus'
                    });

                    if(status == 'A'||status =='B'){
                        var quantity = objRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        });
                        log.debug("quantity:",quantity)

                        var transferQty = objRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_transferqty'
                        });
                        log.debug("transferQty:",transferQty)

                        if(!transferQty){
                            transferQty = 0;
                        }
                        if(quantity<transferQty){
                            dialog.alert({
                                title: 'Quantity must be greater than or equal to Transfer QTY.',
                                message: 'Please review and ensure transfer qty is greater than or equal to quantity.'
                            });
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                    else{
                        if(featureInEffect){
                            if(!transferOrder){
                                //return true;
                                log.debug("do nothing")
                                return true;
                            }
                            else{
                                var lineKey = objRecord.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey'
                                });
                                var TO = record.load({
                                    type: record.Type.TRANSFER_ORDER,
                                    id: transferOrder,
                                    isDynamic: true,
                                });
                                var lineNumber = TO.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ns_psw_lineuniquekey',
                                    value: lineKey
                                });
                                log.debug("line number on TO:",lineNumber)
                                var quantityPicked = TO.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantitypicked',
                                    line: lineNumber
                                });
                                if(quantityPicked>0){
                                    dialog.alert({
                                        title: 'Quantity Picked on Asssoicated Transfer Order Greater Than Zero.',
                                        message: 'Edits to this line are not allowed when the picked quantity on the transfer order is greater than 1.'
                                    });
                                    return false;
                                }
                                else{
                                    //return true;
                                    log.debug("do nothing")
                                }
                            }
                        }
                        else{
                            return true;
                        }
                    }





                }




            } catch (error) {
                log.debug("error occured validateLine", error);

                return false;
            }
        }
        function validateLine(scriptContext) {

            try {
                log.debug('validateLine',scriptContext);

                var featureInEffect = runtime.isFeatureInEffect({
                    feature: obj_features_std_cost.pickPackShip
                });
                log.debug('auto location assignment feature is enabled: ', featureInEffect);

                var objRecord = scriptContext.currentRecord;

                var scriptObj = runtime.getCurrentScript();

                var transferOrder = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferorder'
                });
                var toQuant = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferqty'
                });
                var toLocation = objRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_transferfromlocation'
                });
                if(toLocation){
                    if(!toQuant){
                        dialog.alert({
                            title: 'You must enter a transfer quantity.',
                            message: 'If you enter a transfer from location you must specifiy a quantity.'
                        });
                        return false;
                    }
                }

                if(!transferOrder){
                    var quantity = objRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
                    log.debug("quantity:",quantity)
                    var transferQty = objRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_psw_transferqty'
                    });
                    log.debug("transferQty:",transferQty)

                    if(!transferQty){
                        transferQty = 0;
                    }
                    if(quantity<transferQty){
                        dialog.alert({
                            title: 'Quantity must be greater than or equal to Transfer QTY.',
                            message: 'Please review and ensure transfer qty is greater than or equal to quantity.'
                        });
                        return false;
                    }
                    else{
                        return true;
                    }
                }
                else{

                    var TO = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: transferOrder,
                        isDynamic: true,
                    });

                    var status = TO.getValue({
                        fieldId: 'orderstatus'
                    });

                    if(status == 'A'||status =='B'){
                        var quantity = objRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        });
                        log.debug("quantity:",quantity)

                        var transferQty = objRecord.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_transferqty'
                        });
                        log.debug("transferQty:",transferQty)

                        if(!transferQty){
                            transferQty = 0;
                        }
                        if(quantity<transferQty){
                            dialog.alert({
                                title: 'Quantity must be greater than or equal to Transfer QTY.',
                                message: 'Please review and ensure transfer qty is greater than or equal to quantity.'
                            });
                            return false;
                        }
                        else{
                            return true;
                        }
                    }
                    else{
                        if(featureInEffect){
                            if(!transferOrder){
                                //return true;
                                log.debug("do nothing")
                                return true;
                            }
                            else{
                                var lineKey = objRecord.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'lineuniquekey'
                                });
                                var TO = record.load({
                                    type: record.Type.TRANSFER_ORDER,
                                    id: transferOrder,
                                    isDynamic: true,
                                });
                                var lineNumber = TO.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ns_psw_lineuniquekey',
                                    value: lineKey
                                });
                                log.debug("line number on TO:",lineNumber)
                                var quantityPicked = TO.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantitypicked',
                                    line: lineNumber
                                });
                                if(quantityPicked>0){
                                    dialog.alert({
                                        title: 'Quantity Picked on Asssoicated Transfer Order Greater Than Zero.',
                                        message: 'Edits to this line are not allowed when the picked quantity on the transfer order is greater than 1.'
                                    });
                                    return false;
                                }
                                else{
                                    //return true;
                                    log.debug("do nothing")
                                }
                            }
                        }
                        else{
                            return true;
                        }
                    }





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
                    fieldId: 'custcol_ns_psw_transferorder'
                });
                
                if(!transferOrder){
                  return true;
                }
                else{
                  dialog.alert({
                     title: 'Cannot Delete Line.',
                     message: 'You cannot delete this line when there is a transfer order.'
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
            pageInit: pageInit,
            validateLine: validateLine,
            validateDelete: validateDelete,
            validateInsert: validateInsert
        };

    });