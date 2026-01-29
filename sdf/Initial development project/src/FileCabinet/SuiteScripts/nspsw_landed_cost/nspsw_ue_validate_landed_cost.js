/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * This script validates if the Landed Cost Allocation Custom Record based on
 * Cost allocation, inbound shipment, and source transaction.
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost'],
    /**
     *
     * @param record
     * @param lib
     * @param helper
     * @returns {{beforeSubmit: beforeSubmit, beforeLoad: beforeLoad, afterSubmit: afterSubmit}}
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
            const recLCA = context.newRecord;
            const objLCA = lib.landedcostallocation
            validateCompleteProcess(recLCA, objLCA)
            validateLCA(recLCA, objLCA)
        }

        /**
         *
         * @param recLCA
         * @param objLCA
         */
        const validateCompleteProcess = (recLCA, objLCA) => {
            let intCurrentProcess = recLCA.getValue(objLCA.status)
            let strMessage = recLCA.getValue(objLCA.message)
            if (parseInt(intCurrentProcess) !== lib.lcastatus.completed && strMessage) {
                recLCA.setValue({
                    fieldId: objLCA.message,
                    value: ''
                });
            }
        }

        /**
         *
         * @param recLCA
         * @param objLCA
         */
        const validateLCA = (recLCA, objLCA) => {
            strLogTitle = 'validateLCA'
            const objErrorMessage = lib.errormessages;
            let intCostCategory = recLCA.getValue(objLCA.costcategory)
            let fltAmount = recLCA.getValue(objLCA.amount)
            let bVolume = recLCA.getValue(objLCA.byvolume)
            let intInboundShipment = recLCA.getValue(objLCA.inboundshipment)
            let intSourceTran = recLCA.getValue(objLCA.sourcetransaction) ? recLCA.getValue(objLCA.sourcetransaction) : null

            let strMissingField = helper.validateRequiredFields(intCostCategory, fltAmount, bVolume)

            if (strMissingField !== true) {
                throw helper.throwerror(objErrorMessage.missingMandatory.title, `${objErrorMessage.missingMandatory.message} ${strMissingField} .`);
            }

            if (helper.findExistingLCA(intCostCategory, intInboundShipment, intSourceTran, recLCA.id)) {
                throw helper.throwerror(objErrorMessage.duplicate.title, objErrorMessage.duplicate.message);
            }

            if (!helper.verifyLandedCostCategory(intCostCategory)) {
                throw helper.throwerror(objErrorMessage.notLandedCost.title, objErrorMessage.notLandedCost.message);
            }

            //allocation detail validation
            const objLCADetail = lib.allocationdetail
            let intAllocationType = recLCA.getValue(objLCA.allocationtype)

            let intAllocationLineCount = recLCA.getLineCount(objLCADetail.sublist)
            let fltTotalAmount = 0;
            let fltTotalPercent = 0;
            for (let i = 0; i < intAllocationLineCount; i++) {
                let fltLineAmount = recLCA.getSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.amount,
                    line: i
                });
                fltTotalAmount += fltLineAmount
                let fltPercent = recLCA.getSublistValue({
                    sublistId: objLCADetail.sublist,
                    fieldId: objLCADetail.percent,
                    line: i
                });
                fltTotalPercent += fltPercent
            }


            log.debug(strLogTitle, {
                fltAmount: fltAmount,
                fltTotalAmount: fltTotalAmount,
                fltTotalPercent: fltTotalPercent,
                intAllocationType: intAllocationType,
                amountval: lib.lcaallocationtype.amount,
                prcntval: lib.lcaallocationtype.percent,
            });

            if (intAllocationLineCount > 0) {
                if (parseInt(intAllocationType) === lib.lcaallocationtype.amount && fltAmount !== fltTotalAmount) {
                    throw helper.throwerror((objErrorMessage.incompleteAllocationAmount));
                } else if (parseInt(intAllocationType) === lib.lcaallocationtype.percent && fltTotalPercent !== 100) {
                    throw helper.throwerror((objErrorMessage.incompleteAllocationPercent));
                }
            }
        }

        return {
            beforeSubmit: beforeSubmit,
        };

    });
