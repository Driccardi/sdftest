/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * User event scripts are executed on the NetSuite server. They are executed
 * when users perform certain actions on records, such as create, load, update, copy, delete, or submit.
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/20/03           shekainah.castillo                       Initial Commit
 * /

 /**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', './nscs_cm_cshub_createStandAloneCase'],
    /**
     * @param {record} record
     */
    function (record, runtime, search, helper) {
        let strLogTitle;
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {string} context.type - Trigger type
         * @param {Form} context.form - Current form
         * @Since 2015.2
         */
        const beforeLoad = (context) => {
            try {
                strLogTitle = 'beforeLoad';
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

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
            try {
                strLogTitle = 'beforeSubmit';
                let recCSHub = context.newRecord
                let bCaseCreated = recCSHub.getValue('custrecord_cshub_manual_casecreated')
                if(helper.isEmpty(bCaseCreated)) {
                    createCase(recCSHub)
                }
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

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
            try {
                strLogTitle = 'afterSubmit';
                let recCSHub = context.newRecord

            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        const createCase = (recCSHub) => {
            let strTranText = recCSHub.getValue('custrecord_cshub_manual_tranid');
            let intTranID = strTranText.replace(/\D/g, '')//(/[^a-zA-Z0-9 ]/g, "");
            let intCustID = recCSHub.getValue('custrecord_cshub_manual_customer');
            let intCurrentUser = runtime.getCurrentUser().id;
            let strCustName = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: intCustID,
                columns: 'altname'
            }).altname
            let intLocation = recCSHub.getValue('custrecord_cshub_manual_location');
            let intCaseType = recCSHub.getValue('custrecord_cshub_manual_casetype');
            let dtDate = recCSHub.getValue('custrecord_cshub_manual_incidentdate');
            let intItem = recCSHub.getValue('custrecord_cshub_manual_item');
            let strTranline = `${intTranID}_${intItem}_${intCaseType}`
            let objCaseDetails = getRecordDetails(recCSHub, intTranID, intLocation, intCaseType, intItem, strTranline);
            log.debug(strLogTitle + ' objCaseDetails', objCaseDetails);

            let objCaseData = {
                intTranID: intTranID,
                intCustID: intCustID,
                objCaseDetails: objCaseDetails,
                intCurrentUser: intCurrentUser,
                strTranText: strTranText,
                incidentDate : dtDate,
                strCustName: strCustName,
                intCaseType: intCaseType,
                intStatus : runtime.getCurrentScript().getParameter('custscript_cshub_ue_casestatusnative')
            }
            let strRecID = helper.createCase(objCaseData).id
            // lockRecord(intTranID)
            log.audit('CREATED CASE', strRecID)
            // casenumber
            // let strCaseNum = getCaseNumber(strRecID)
            recCSHub.setValue({
                fieldId: 'custrecord_cshub_manual_casecreated',
                value: strRecID
            })
            recCSHub.setValue({
                fieldId: 'custrecord_cshub_manual_associatedlineid',
                value: strTranline
            })
        }

        const getRecordDetails = (recCSHub, intTranID, intLocation, intCaseType, intItem, strTranline) => {
            strLogTitle = 'getRecordDetails'
            let fltAppeasementAmt = recCSHub.getValue('custrecord_cshub_manual_appeasementamt');
            let objFullDetail = [];
            let objRSQDetail = [];
            let objCaseDetail = helper.getCaseActionDetail(intCaseType)
            log.debug('getCaseActionDetail', objCaseDetail)

            let intQTYSrvc = recCSHub.getValue('custrecord_cshub_manual_serviceqty');
            let strProcessRfnd = false//recCSHub.getValue('custrecord_cshub_manual_appeasementamt');
            let intReasonCode = recCSHub.getValue('custrecord_cshub_manual_reason');

            if (intReasonCode) {
                objFullDetail.push({
                    'tranid': intTranID,
                    'lineid': strTranline,
                    'quantity': intQTYSrvc,
                    'returnReason': intReasonCode,
                    'itemName': intItem,
                    'receiptLocation': intLocation,
                    'processRefund': strProcessRfnd,
                    'refAmt': fltAppeasementAmt
                });

                objRSQDetail.push({
                    '1': intTranID,
                    '2': strTranline,
                    '3': intQTYSrvc
                });
            }

            let objCaseDetails = {
                'objFullDetail': objFullDetail,
                'objRSQDetail': objRSQDetail,
                'fltRefAmount': fltAppeasementAmt
            };

            return objCaseDetails
        }

        const getCaseNumber = (intCaseID) => {
            strLogTitle = 'getCaseNumber'
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            let objCaseNum = search.lookupFields({
                type: search.Type.SUPPORT_CASE,
                id: parseInt(intCaseID),
                columns: 'casenumber'
            });

            return objCaseNum.casenumber;
        }

        return {
            // beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit
        };

    });
