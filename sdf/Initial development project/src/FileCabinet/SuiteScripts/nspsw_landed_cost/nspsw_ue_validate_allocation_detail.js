/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2024/10/21           shekainah.castillo                       Initial Commit
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', './nspsw_lib_landed_cost', './nspsw_cm_landed_cost', 'N/ui/dialog', 'N/search'],
    /**
     *
     * @param record
     * @param lib
     * @param helper
     * @param dialog
     * @param search
     * @returns {{beforeSubmit: ((function({newRecord: Record, oldRecord: Record, type: string}): (boolean|undefined))|*)}}
     */
    function (record, lib, helper, dialog, search) {
        let strTitle;


        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {Record} context.oldRecord - Old record
         * @param {string} context.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(context) {
            strTitle = 'beforeSubmit'
            const objLCA = lib.landedcostallocation
            const objLCADetail = lib.allocationdetail
            const objErrorMessage = lib.errormessages
            const recAllocationDetail = context.newRecord;
            let intLCA = recAllocationDetail.getValue(objLCADetail.parent)
            log.debug(strTitle, {
                objLCA: objLCA,
                objLCADetail: objLCADetail,
                intLCA: intLCA
            })
            let objLCARecord = search.lookupFields({
                id: parseInt(intLCA),
                type: objLCA.id,
                columns: [objLCA.inboundshipment, objLCA.byvolume, objLCA.allocationtype]
            });

            log.debug(strTitle, objLCARecord)

            if (objLCARecord[objLCA.inboundshipment][0]) {
                throw helper.throwerror(({
                    name: objErrorMessage.allocationCombined.title,
                    message: objErrorMessage.allocationCombined.message.replace('{type}', 'an Inbound Shipment')
                }));
            }

            if (objLCARecord[objLCA.byvolume][0] && parseInt(objLCARecord[objLCA.byvolume][0].value) === lib.lcayesno.no) {
                let intAllocationMethod = recAllocationDetail.getValue({
                    fieldId: objLCADetail.method,
                });

                if (!intAllocationMethod) {
                    throw (helper.throwerror(objErrorMessage.missingAllocationMethod));
                } else if (parseInt(intAllocationMethod) === lib.allocationmethods.flatAmount) {
                    throw (helper.throwerror(objErrorMessage.invalidAllocationMethod));
                }
            }

            if (objLCARecord[objLCA.allocationtype][0]) {
                if (parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.percent) {
                    if (!recAllocationDetail.getValue(objLCADetail.percent)) {
                        throw (helper.throwerror(objErrorMessage.missingAllocationPercent));
                    }
                    if (recAllocationDetail.getValue(objLCADetail.amount)) {
                        throw (helper.throwerror(objErrorMessage.incorrectAllocationPercent));
                    }
                } else if (parseInt(objLCARecord[objLCA.allocationtype][0].value) === lib.lcaallocationtype.amount) {
                    if (!recAllocationDetail.getValue(objLCADetail.amount)) {
                        throw (helper.throwerror(objErrorMessage.missingAllocationAmount));
                    }
                    if (recAllocationDetail.getValue(objLCADetail.percent)) {
                        throw (helper.throwerror(objErrorMessage.incorrectAllocationPercent));
                    }
                }
            }
            let idTransaction = recAllocationDetail.getValue(objLCADetail.transaction)
            let strTrantype = helper.getTransactionType(idTransaction)
            let bValidTranType = helper.findRelatedAllocationDetail(intLCA, strTrantype)
            if (!bValidTranType) {
                throw (helper.throwerror({
                    name: objErrorMessage.allocationCombined.title,
                    title: objErrorMessage.allocationCombined.message.replace('{type}', 'Item Receipt')}));
            }
        }


        return {
            beforeSubmit: beforeSubmit,
        };

    });
