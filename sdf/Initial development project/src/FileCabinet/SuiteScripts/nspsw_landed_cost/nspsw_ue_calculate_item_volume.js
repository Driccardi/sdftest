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
define(['N/record', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost'],
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
        const afterSubmit = (context) => {
            strLogTitle = 'afterSubmit '
            try {
                calculateVolume(context)
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        const calculateVolume = (context) => {
            const recItem = context.newRecord;
            const objDimension = lib.dimensions
            let intLength = recItem.getValue(objDimension.length)
            let intWidth = recItem.getValue(objDimension.width)
            let intHeight = recItem.getValue(objDimension.height)
            let intUnit = recItem.getValue(objDimension.unit)
            if (!intLength && !intWidth && !intHeight && !intUnit)
                return;

            log.debug(strLogTitle + 'dimensions', {
                intLength : intLength,
                intWidth : intWidth,
                intHeight : intHeight,
                intUnit : intUnit
            });
            let intNewVolume = helper.calculateVolume(intLength, intWidth, intHeight)
            if (context.type === context.UserEventType.CREATE) {
                updateItemVolume(recItem, intNewVolume)
            }

            if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.XEDIT) {
                let intOldVolume = context.oldRecord.getValue(objDimension.volume)
                if(helper.forceFloat(intOldVolume) !== intNewVolume){
                    updateItemVolume(recItem, intNewVolume)
                }
            }

        }

        const updateItemVolume = (rec, volume) => {
            strLogTitle = 'updateItemVolume'
            record.submitFields({
                type: rec.type,
                id: rec.id,
                values: {
                    [lib.dimensions.volume] : volume
                }
            })
            log.audit(strLogTitle, 'Item Volume Updated to: ' + volume)
        }

        return {
            afterSubmit: afterSubmit
        };

    });
