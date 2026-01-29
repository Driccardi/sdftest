/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record' , './nspsw_lib_landed_cost', './nspsw_cm_landed_cost'],
    /**
     * @param {record} record
     */
    (record, lib, helper) => {
        let strLogTitle;

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type
         * @Since 2015.2
         */
        const beforeSubmit = (context) => {
            strLogTitle = 'beforeSubmit'
            try{
                updateLineVolume(context)
            }catch(e){
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }


        const updateLineVolume = (context) => {
            strLogTitle = 'updateLineVolume'
            const recItemReceipt = context.newRecord;
            const intLineCount = recItemReceipt.getLineCount('item')
            for(let i=0; i < intLineCount; i++){
                let intItem = recItemReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                let intVolume = helper.findItemVolume(intItem)
                if(intVolume){
                    let fltQTY = recItemReceipt.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i,
                    })

                    let fltLineQTY = helper.calculateLineVolume(intVolume, fltQTY)

                    recItemReceipt.setSublistValue({
                        sublistId: 'item',
                        fieldId: lib.custcol.LCIR_linevolume,
                        line: i,
                        value: fltLineQTY
                    })

                    let intDimensionUnit = helper.findDimensionUnit(intItem)

                    recItemReceipt.setSublistValue({
                        sublistId: 'item',
                        fieldId: lib.custcol.LCIR_dimensionunit,
                        line: i,
                        value: intDimensionUnit
                    })
                }
            }
        }

        return {
            beforeSubmit: beforeSubmit,
        };

    });
