/*
 * Copyright (c) 1998-2021 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @changeLog: 1.00           21May2021         Manuel Teodoro Jr. 	        Initial version
 */
define(//using require instead for better module loading especially for the have dependencies.
    (require) =>
    {
        //Custom modules
        let nsutil = require('../Library/NSUtilvSS2.js');
        let scriptutil = require('./NSTS_MD_CommonLibrary');

        //Native modules
        let record = require('N/record');
        let http = require('N/http');
        let runtime = require('N/runtime');
        let search = require('N/search');
        let url = require('N/url');

        let EntryPoint = {};

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        EntryPoint.onRequest = (context) =>
        {
            let stLogTitle = 'onRequest';
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

            try
            {
                let paramsHttp = context.request.parameters;
                log.debug(stLogTitle, JSON.stringify(paramsHttp));

                if (context.request.method === http.Method.GET)
                {
                    let stResponse = 'failed';
                    let stRecordURL;
                    let objData;

                    if (paramsHttp.action === 'APPROVE') {
                        objData = approveEquityPickupRecords(paramsHttp);
                    } else
                    {
                        objData = undoEquityPickupRecords(paramsHttp);
                    }

                    if (nsutil.isEmpty(objData.error))
                    {
                        stResponse = "success";
                        stRecordURL = url.resolveRecord({
                            recordType: 'customrecord_ns_epu_execution',
                            recordId: objData.id
                        });
                    }

                    let objResponse = {
                        status: stResponse,
                        id : objData.id,
                        url: stRecordURL,
                        error: objData.error
                    }
                    log.debug(stLogTitle, 'objResponse:'+JSON.stringify(objResponse))
                    context.response.write({
                        output : JSON.stringify(objResponse)
                    });
                }
                log.audit(stLogTitle, 'Remaining Units: ' + runtime.getCurrentScript().getRemainingUsage());
            }
            catch (e)
            {
                log.error(stLogTitle, JSON.stringify(e));
                throw e.message;
            }
        };

        const approveEquityPickupRecords = (paramsHttp) =>
        {
            let stLogTitle = 'approveEquityPickupRecords';
            let arrError = [];

            let objSearchData = search.create({
                type: "transaction",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                filters:
                    [
                        ["type","anyof","Custom106"],
                        "AND",
                        ["mainline","is","T"],
                        "AND",
                        ["custbody_epu_source","anyof",paramsHttp.id],
                        "AND",
                        ["status","anyof","Custom106:A"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "transactionnumber",
                            summary: "GROUP",
                            label: "Transaction Number"
                        }),
                        search.createColumn({
                            name: "statusref",
                            summary: "GROUP",
                            label: "Status"
                        })
                    ]
            });
            objSearchData.run().each(function(result)
            {
                let intEquityPickupId = result.getValue({ name: 'internalid', summary: 'GROUP'});
                let strTransactionNumber = result.getValue({ name: 'transactionnumber', summary: 'GROUP'});

                try
                {
                    record.submitFields({
                        type: 'customtransaction_ns_equitypickup',
                        id: intEquityPickupId,
                        values: {
                            'transtatus': 'B'
                        }
                    });
                }
                catch (ex)
                {
                    log.error('UE.beforeSubmit | Error ', ex.name + ' : ' + ex.message);
                    arrError.push('Error for '+strTransactionNumber+' : '+ex.name + ' : ' + ex.message);
                }
                return true;
            });
            log.debug(stLogTitle, 'arrError:'+arrError)

            return {
                id: paramsHttp.id,
                error:  arrError
            };
        }

        const undoEquityPickupRecords = (paramsHttp) =>
        {
            let stLogTitle = 'undoEquityPickupRecords';
            log.debug(stLogTitle, 'paramsHttp:' + JSON.stringify(paramsHttp))
            let arrError = [];

            var options = {
                script: 'customscript_ns_mr_reverse_epu',
                params: {
                    custscript_mr_undoepu_execid: paramsHttp.id
                }
            };
            log.debug(stLogTitle, 'options:'+JSON.stringify(options))
            let blIsSuccess = scriptutil.callMRWithDelay(options);

            return {
                id: paramsHttp.id,
                error:  arrError
            };
        }

        return EntryPoint;
    });