/**
 * Copyright (c) 1998-2023 Oracle NetSuite GBU, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Oracle NetSuite GBU, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oracle NetSuite GBU.
 *
 * Module Description
 *
 * Version    Date              Author                Remarks
 * 1.00       10-Apr-2025       Manuel Teodoro        Initial Version
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define((require) => {

    let search = require("N/search");
    let record = require("N/record");
    let runtime = require("N/runtime");
    let format = require("N/format");
    let nsutil  = require ('../Library/NSUtilvSS2');

    let EntryPoint = {};
    let Helper = {};

    EntryPoint.getInputData = (inputContext) =>
    {
        let stLogTitle = 'getInputData';
        log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

        try
        {
            let intStagingRecord = runtime.getCurrentScript().getParameter('custscript_ceputd_search');
            let intPostingPeriod = runtime.getCurrentScript().getParameter('custscript_ceputd_postingperiod');
            let intSubsidiary = runtime.getCurrentScript().getParameter('custscript_ceputd_subsidiary');
            let arrSearchFilter = [];
            arrSearchFilter.push(search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                values: intPostingPeriod
            }));
            arrSearchFilter.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: intSubsidiary
            }));
            log.debug(stLogTitle, 'arrSearchFilter:'+JSON.stringify(arrSearchFilter));
            let arrData = nsutil.search('',intStagingRecord,arrSearchFilter,null);
            log.debug(stLogTitle, 'arrStagingRecord Sample Data:'+JSON.stringify(arrData[0]));
            log.debug(stLogTitle, 'Length:'+arrData.length);

            return arrData;
        }
        catch (catchError)
        {
            var stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
            log.error(stLogTitle, 'Catch : ' + stErrorMsg);
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    }

    EntryPoint.reduce = (reduceContext) =>
    {
        let stLogTitle = 'reduce';
        log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

        try
        {
            let objContextData = JSON.parse(reduceContext.values[0]);
            let objRaw = objContextData.values;
            log.debug(stLogTitle, 'objRaw:'+JSON.stringify(objRaw))
            let intExecutionRecord = runtime.getCurrentScript().getParameter('custscript_ceputd_executionrecord');

            let recTransaction = record.create({
                type: 'customrecord_ns_epu_transactiondetails',
                isDynamic: true
            });
            let dtTransDate = (!nsutil.isEmpty(objRaw['trandate'])) ? format.parse({
                value: objRaw['trandate'],
                type: format.Type.DATE
            }) : null;

            let objHeaderData = {
                custrecord_eptd_executionid: intExecutionRecord,
                custrecord_eptd_recordtype:  objRaw['type'][0].text,
                custrecord_eptd_documentnumber: objRaw['tranid'],
                custrecord_eptd_subsidiary: objRaw['subsidiarynohierarchy'][0].value,
                custrecord_eptd_date: dtTransDate,
                custrecord_eptd_period: objRaw['postingperiod'][0].text,
                custrecord_eptd_name: (!nsutil.isEmpty(objRaw['entity'][0])) ? objRaw['entity'][0].value : null,
                custrecord_eptd_account_type: objRaw['account.type'][0].text,
                custrecord_eptd_account: objRaw['account'][0].value,
                custrecord_eptd_amount: objRaw['formulacurrency']
            }
            log.debug(stLogTitle, 'objHeaderData:'+JSON.stringify(objHeaderData))

            for (let fieldId in objHeaderData) {
                recTransaction.setValue({
                    fieldId: fieldId,
                    value: objHeaderData[fieldId]
                });
            }
            let intRecId = recTransaction.save();
            log.audit(stLogTitle, 'Created Execution Record:' + recTransaction.type + ':' + intRecId);
        }
        catch (catchError)
        {
            let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
            log.error(stLogTitle, 'Catch Saving Record: ' + stErrorMsg);
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    }

    EntryPoint.summarize = (summaryContext) =>
    {
        let stLogTitle = 'summarize';
        log.debug(stLogTitle, '**** START: Entry Point Invocation ****');
        try {
            let type = summaryContext.toString();
            log.audit(stLogTitle, 'Type = ' + type +
                ' | Usage Consumed = ' + summaryContext.usage +
                ' | Concurrency Number = ' + summaryContext.concurrency +
                ' | Number of Yields = ' + summaryContext.yields);
        } catch (e) {
            log.error(stLogTitle, JSON.stringify(e));
            throw e.message;
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    };

    EntryPoint.config = {retryCount: 3, exitOnError: false};

    return EntryPoint;
});
