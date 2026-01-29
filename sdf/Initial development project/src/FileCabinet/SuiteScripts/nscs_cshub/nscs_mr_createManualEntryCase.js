/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data. It is best suited for situations where the data can be divided into small, independent parts. When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/31/03           shekainah.castillo                       Initial Commit
 * 1.1            2025/14/04           shekainah.castillo                       set the Case Date based on the Incident Date value on the custom record
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', './nscs_cm_cshub_createStandAloneCase', 'N/task'], (runtime, search, record, helper, task) => {
    let strLogTitle;
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_cshub_mr_csaction_crt_case');
            let objTransactionSearch = search.load(intSavedSearch);
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug("SearchObj result count", objSearchResultCount);

            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit('No data to process', 'Saved search is not getting results')
                return false;
            }
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const map = (context) => {
        try {
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);
            log.debug(strLogTitle + ' objSearchResults', objSearchResults);
            let objCaseDetail = {
                customer: objSearchResults.values.custrecord_cshub_manual_customer.value,
                location: objSearchResults.values.custrecord_cshub_manual_location.value,
                tranid: objSearchResults.values.custrecord_cshub_manual_tranid,
                caseType: objSearchResults.values.custrecord_cshub_manual_casetype.value,
                trandate: objSearchResults.values.custrecord_cshub_manual_trandate,
                item: objSearchResults.values.custrecord_cshub_manual_item.value,
                quantity: objSearchResults.values.custrecord_cshub_manual_serviceqty,
                reason: objSearchResults.values.custrecord_cshub_manual_reason.value,
                appeasement: objSearchResults.values.custrecord_cshub_manual_appeasementamt,
                refundNeeded: objSearchResults.values.custrecord_cshub_manual_refund_needed,
                legacyCaseNumber: objSearchResults.values.custrecord_cshub_manual_legacycase,
                incidentDate : objSearchResults.values.custrecord_cshub_manual_incidentdate,
                // user: objSearchResults.values["name.systemNotes"].value,
                id: objSearchResults.id
            }
            log.debug('objCaseDetail', objCaseDetail);
            context.write({
                key: {
                    customer: objCaseDetail.customer,
                    location: objCaseDetail.location,
                    tranid: objCaseDetail.tranid,
                    caseType: objCaseDetail.caseType,
                    caseExternalId: objCaseDetail.legacyCaseNumber,
                    date : objCaseDetail.trandate,
                    incidentDate: objCaseDetail.incidentDate
                    // user: objCaseDetail.user,
                },
                value: objCaseDetail
            })
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            log.debug(strLogTitle + ' context', context)
            log.debug(strLogTitle + ' context', context.values)
            let objKey = JSON.parse(context.key)
            let objFullDetail = [];
            let objRSQDetail = [];
            // let objCaseDetail = helper.getCaseActionDetail(objKey.caseType)
            let fltAppeasementAmt
            let strTranText = objKey.tranid
            let intTranID = strTranText.replace(/\D/g, '')
            for (let i = 0; context.values.length > i; i++) {
                let objValues = JSON.parse(context.values[i]);
                log.debug(strLogTitle + ' objValues', objValues);
                let intItem = objValues.item
                fltAppeasementAmt = helper.forceFloat(objValues.appeasement)
                let strTranline = `${intTranID}_${intItem}_${objKey.caseType}`
                let intQTYSrvc = objValues.quantity

                let strProcessRfnd = objValues.refundNeeded

                let intReasonCode = objValues.reason

                let intReceiptLoc = parseInt(objValues.location)
                log.audit(' location from post', intReceiptLoc)


                if (intReasonCode) {
                    objFullDetail.push({
                        'tranid': intTranID,
                        'lineid': strTranline,
                        'quantity': intQTYSrvc,
                        'returnReason': intReasonCode,
                        'itemName': intItem,
                        'receiptLocation': intReceiptLoc,
                        'processRefund': strProcessRfnd,
                        'refAmt': fltAppeasementAmt
                    });

                    objRSQDetail.push({
                        '1': intTranID,
                        '2': strTranline,
                        '3': intQTYSrvc
                    });
                }

            }

            let objCaseDetails = {
                'objFullDetail': objFullDetail,
                'objRSQDetail': objRSQDetail,
                'fltRefAmount': fltAppeasementAmt
            };

            let strCustName = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: objKey.customer,
                columns: 'altname'
            }).altname

            // return objCaseDetails

            let objCaseData = {
                caseExternalId: objKey.caseExternalId,
                intTranID: intTranID,
                intCustID: objKey.customer,
                objCaseDetails: objCaseDetails,
                // intCurrentUser: objKey.user,
                strTranText: strTranText,
                strCustName: strCustName,
                date: objKey.date,
                incidentDate : objKey.incidentDate,
                intCaseType: objKey.caseType,
                intStatus: runtime.getCurrentScript().getParameter('custscript_cshub_mr_casestatusnative')
            }

            log.debug('objCaseData', objCaseData)

            let strRecID = helper.createCase(objCaseData).id;
            // lockRecord(intTranID)
            log.audit('CREATED CASE', strRecID)


            for (let i = 0; context.values.length > i; i++) {
                let objValues = JSON.parse(context.values[i]);
                let intItem = objValues.item
                let strTranline = `${intTranID}_${intItem}_${objKey.caseType}`
                record.submitFields({
                    type: 'customrecord_cshub_manualentry',
                    id: parseInt(objValues.id),
                    values: {
                        custrecord_cshub_manual_casecreated: strRecID,
                        custrecord_cshub_manual_associatedlineid: strTranline
                    }
                })
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const summarize = (summary) => {
        try {
            strLogTitle = 'summarize';
            triggerCaseActionStepCreation()
            log.audit(strLogTitle, 'Execution time in seconds: ' + summary.seconds +
                ' | Usage Consumed: ' + summary.usage +
                ' | Usage Consumed: ' + summary.yields +
                ' | Concurrency Number: ' + summary.concurrency
            );
            if (summary.inputSummary.error !== null) {
                log.error('Input Error: ', summary.inputSummary.error);
            }
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error: ', error);
                return true;
            });

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const triggerCaseActionStepCreation = () => {
        let intMRCreateCaseActionScript = runtime.getCurrentScript().getParameter("custscript_cshub_mr_crt_csaction_script");
        let intMRCreateCaseActionDeployment = runtime.getCurrentScript().getParameter("custscript_cshub_mr_crt_csaction_dplymt");
        if(!helper.isEmpty(intMRCreateCaseActionScript) && !helper.isEmpty(intMRCreateCaseActionDeployment)) {
            let objMRTask = task.create({ //TODO: parse caseId to m/r script
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: intMRCreateCaseActionScript,
                deploymentId: intMRCreateCaseActionDeployment

            });
            let objTask = objMRTask.submit();
            log.debug("MR Script Triggered", task.checkStatus(objTask))
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})