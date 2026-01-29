/**
 *	Copyright (c) ${YEAR}, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/https', 'N/error', 'N/task', 'N/search'],
    /**
     * @param {record} record
     */
    function(record, runtime, https, error, task, search) {
        /**
         * @name obj_features_std_cost
         * Set of NetSuite Features used in Standard Costing
         * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
         */
        const obj_features_std_cost = Object.freeze({
            supplyallocation: "supplyallocation"
        });


        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            try {

                log.debug("before submit")
                var IF = scriptContext.newRecord;

                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT){

                    var TOID = IF.getValue({
                        fieldId: 'createdfrom'
                    });

                    var objRecord = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: TOID,
                        isDynamic: true,
                    });

                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });
                    for (var i = 0; i < numLines; i++) {
                        var soID = objRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_salesorder',
                            line: i
                        });
                        if(!soID){
                            continue
                        }
                        else{
                            var soLineID = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_lineuniquekey',
                                line: i
                            });
                            var fullfilledQuantity = IF.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: 0
                            });
                            var soRecord = record.load({
                                type: record.Type.SALES_ORDER,
                                id: soID,
                                isDynamic: false,
                            });
                            var SOStatus = soRecord.getValue({
                                fieldId: 'orderstatus',
                            });
                            log.debug('SOStatus',SOStatus)
                            var lineNumber = soRecord.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                value: soLineID
                            });
                            var isClosed = soRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'isclosed',
                                line: i
                            });
                            log.debug('isClosed',isClosed)
                            var quantity = soRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            });
                            log.debug('quantity',quantity)
                            if(SOStatus != "G" && SOStatus != "F"){
                                log.debug('in if 1')
                                if(!isClosed && quantity>=fullfilledQuantity){
                                    log.debug('in if 2')
                                    soRecord.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_ns_psw_tofulfilledqty',
                                        line: lineNumber,
                                        value: fullfilledQuantity
                                    });
                                    soRecord.save();
                                }
                                else{
                                    log.audit("error occured while updating sales order line.")
                                }
                            }

                        }
                    }
                }
            } catch (error) {
                log.debug("error occured", error);
            }
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });