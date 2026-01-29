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
    let NSUtil  = require ('../Library/NSUtilvSS2');

    let EntryPoint = {};
    let Helper = {};

    EntryPoint.getInputData = (inputContext) =>
    {
        let stLogTitle = 'getInputData';
        log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

        try
        {
            let intStagingRecord = runtime.getCurrentScript().getParameter('custscript_srch_delete');
            let arrStagingRecord = NSUtil.search('',intStagingRecord,null,null);
            log.debug(stLogTitle, 'arrStagingRecord Sample Data:'+JSON.stringify(arrStagingRecord[0]));

            return arrStagingRecord;
        }
        catch (catchError)
        {
            var stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
            log.error(stLogTitle, 'Catch : ' + stErrorMsg);
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    }

    EntryPoint.map = (mapContext) =>
    {
        let stLogTitle = 'map';
        log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

        try
        {
            let objContextData = JSON.parse(mapContext.value);
            let objRaw = objContextData.values;
            log.debug(stLogTitle, objRaw);
            let intRecordId = objRaw['internalid'][0].value;

            let arrTransactions = Helper.getEquityPickupTransactionRecords(intRecordId);

            for (let i=0; i<arrTransactions.length; i++)
            {
                //Delete Equity Pickup Record
                let recEquityPickupRecordId = record.delete({
                    type: 'customtransaction_ns_equitypickup',
                    id: arrTransactions[i],
                });
                log.audit(stLogTitle, 'Equity Pickup Record Deleted:'+recEquityPickupRecordId);
            }

            let arrDetails = Helper.getEquityPickupTransactionDetails(intRecordId);
            for (let i=0; i<arrDetails.length; i++)
            {
                mapContext.write({
                    key: arrDetails[i],
                    value: arrDetails[i]
                });
            }
        }
        catch (catchError)
        {
            let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
            log.error(stLogTitle, 'Catch Saving Record: ' + stErrorMsg);
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    }

    EntryPoint.reduce = (reduceContext) =>
    {
        let stLogTitle = 'reduce';
        // log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

        try
        {
            let objKey = JSON.parse(reduceContext.key);
            let objValues = JSON.stringify(reduceContext.values);
            let stLogTitle = 'EntryPoint.reduce ('+objKey.id+')';
            // log.debug(stLogTitle, 'objKey:'+JSON.stringify(objKey)+' | objValues:'+JSON.parse(objValues));

            //Delete Record
            let recEquityPickupRecordDetailsId = record.delete({
                type: 'customrecord_ns_epu_transactiondetails',
                id: JSON.parse(objValues),
            });
            log.audit(stLogTitle, 'Equity Pickup Transaction Details Deleted:'+recEquityPickupRecordDetailsId);
        }
        catch (catchError)
        {
            let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
            log.error(stLogTitle, 'Catch Saving Record: ' + stErrorMsg);
        }
        // log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    }

    Helper.getEquityPickupTransactionRecords = function (intRecordId)
    {
        let stLogTitle = 'Helper.getEquityPickupTransactionRecords';
        log.debug(stLogTitle);

        let arrTransactionId = [];
        let transactionSearchObj = search.create({
            type: "customtransaction_ns_equitypickup",
            // settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters:
                [
                    ["type","anyof","Custom106"],
                    "AND",
                    ["mainline","is","T"],
                    "AND",
                    ["custbody_epu_source","anyof",intRecordId]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        label: "Internal ID"
                    })
                ]
        });
        transactionSearchObj.run().each(function(result){
            let intRecId = result.getValue({ name: 'internalid', summary: 'GROUP'});
            arrTransactionId.push(intRecId);
            return true;
        });
        log.debug(stLogTitle, 'arrTransactionId:'+JSON.stringify(arrTransactionId))

        return arrTransactionId;
    }

    Helper.getEquityPickupTransactionDetails = function (intRecordId)
    {
        let stLogTitle = 'Helper.getEquityPickupTransactionDetails';
        log.debug(stLogTitle);

        let arrTransactionId = [];
        let intTranDetailsSearch = runtime.getCurrentScript().getParameter('custscript_srch_transdet_delete');
        let arrSearchFilter = [];
        arrSearchFilter.push(search.createFilter({
            name: 'custrecord_eptd_executionid',
            operator: search.Operator.ANYOF,
            values: intRecordId
        }));
        let arrData = NSUtil.search('',intTranDetailsSearch,arrSearchFilter,null);

        for (let i=0; i< arrData.length; i++)
        {
            let intRecId = arrData[i].getValue({ name: 'internalid'});
            arrTransactionId.push(intRecId);
        }
        log.debug(stLogTitle, 'arrTransactionId:'+JSON.stringify(arrTransactionId))

        return arrTransactionId;
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

            let intStagingRecord = runtime.getCurrentScript().getParameter('custscript_srch_delete');
            let arrStagingRecord = NSUtil.search('',intStagingRecord,null,null);

            for (let i=0; i<arrStagingRecord.length; i++)
            {
                //Delete Execution Record
                let recExecutionRecordId = record.delete({
                    type: 'customrecord_ns_epu_execution',
                    id: arrStagingRecord[i].getValue({name:'internalid'}),
                });
                log.audit(stLogTitle, 'Execution Record Deleted:'+recExecutionRecordId);
            }

        } catch (e) {
            log.error(stLogTitle, JSON.stringify(e));
            throw e.message;
        }
        log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
    };

    EntryPoint.config = {retryCount: 3, exitOnError: false};

    return EntryPoint;
});
