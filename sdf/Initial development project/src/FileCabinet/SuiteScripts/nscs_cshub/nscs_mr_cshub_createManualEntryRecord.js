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
 * 1.0            2025/04/01           shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', './nscs_cm_cshub_createStandAloneCase'], (runtime, search, record, helper) => {
    let strLogTitle;
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intCaseID = runtime.getCurrentScript().getParameter('custscript_cshub_mr_case_id');
            return {id: intCaseID}
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }
    const map = (context) => {

        try {
            strLogTitle = 'map';

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

            let intCaseID = parseInt(context.values[0]);
            log.debug(strLogTitle + ' intCaseID', intCaseID);

            let recCase = record.load({
                type: record.Type.SUPPORT_CASE,
                id: intCaseID
            })
            let objManualEntryDetail = recCase.getValue('custevent_cshub_casedtls_mnl_entry')
            let objCaseDetail = recCase.getValue('custevent_cshub_casedtls_scrpt_use');
            let dtIncidentDate = recCase.getValue('startdate')

            log.debug(strLogTitle, {objManualEntryDetail, objCaseDetail})
            if(!helper.isEmpty(objManualEntryDetail) &&!helper.isEmpty(objCaseDetail)) {
                objCaseDetail =JSON.parse(objCaseDetail)
                objManualEntryDetail =JSON.parse(objManualEntryDetail)
                objManualEntryDetail.incidentDate = dtIncidentDate
                for (let i = 0; i < objCaseDetail.length; i++) {
                    log.debug(strLogTitle, {'objCaseDetail' : objCaseDetail[i]})
                    helper.createCSHUBManualEntry (objManualEntryDetail, objCaseDetail[i], intCaseID)
                }
            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const summarize = (summary) => {
        try {
            strLogTitle = 'summarize';

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

    const createManualCaseRec = (objManualEntryDetail, objCaseDetail, intCaseID) => {

    }

    return {
        getInputData: getInputData,
        // map: map,
        reduce: reduce,
        summarize: summarize
    }
})