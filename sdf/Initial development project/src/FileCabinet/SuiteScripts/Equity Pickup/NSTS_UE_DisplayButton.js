/**
 * Copyright (c) 1998-2025 Oracle-NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @changeLog:   1.0       13 May 2025       Manuel Teodoro       Initial version
 *
 */
define(function(require)
{
        let record = require("N/record");
        let runtime = require("N/runtime");
        let search = require("N/search");
        let nsutil = require('../Library/NSUtilvSS2.js');
        let scriptutil = require('./NSTS_MD_CommonLibrary');


    let UE = {};
        let Helper = {};

    //Script parameter definition
    let PARAM_DEF =
        {
            lblundo: {
                id: 'undo_epu',
                optional: false
            },
            lblapproove: {
                id: 'approve_epu',
                optional: false
            },
            cancelled: {
                id: 'status_cancelled',
                optional: false
            }
        }

        UE.beforeLoad = function (context)
        {
                let stLogTitle = "UE.beforeLoad";
                log.debug(stLogTitle);

                try
                {
                    if (context.type !== context.UserEventType.VIEW) return;

                    let objParams = {};
                    let recExecution = context.newRecord;
                    let params = scriptutil.getParameters(PARAM_DEF, true);
                    let intExecutionStatus = recExecution.getValue({ fieldId: 'custrecord_epue_executionstatus'});
                    let blIsApproved = Helper.getAssociatedTransactionStatus(recExecution);
                    log.debug(stLogTitle, 'blIsApproved:' + blIsApproved+' | intExecutionStatus:' + intExecutionStatus);

                    if (intExecutionStatus === params.cancelled) return;

                    context.form.clientScriptModulePath = './NS_CS_EquityPickupDisplayButton.js';

                    if (blIsApproved)
                    {
                        objParams.suiteletid = 'customscript_ns_sl_process_eup_exec';
                        objParams.deploymentid = 'customdeploy_ns_sl_process_eup_exec';
                        objParams.action = 'UNDO';
                        context.form.addButton({
                            id: 'custpage_undo_epu',
                            label: params.lblundo,
                            functionName: 'processEquityPickupExecution("' + objParams.suiteletid + '","' + objParams.deploymentid + '","' + objParams.action + '")'
                        });
                    }
                    else
                    {
                        objParams.suiteletid = 'customscript_ns_sl_process_eup_exec';
                        objParams.deploymentid = 'customdeploy_ns_sl_process_eup_exec';
                        objParams.action = 'APPROVE';
                        context.form.addButton({
                            id: 'custpage_approve_epu',
                            label: params.lblapproove,
                            functionName: 'processEquityPickupExecution("' + objParams.suiteletid + '","' + objParams.deploymentid + '","' + objParams.action + '")'
                        });
                    }
                }
                catch (ex)
                {
                        log.error('UE.beforeSubmit | Error ', ex.name + ' : ' + ex.message);
                }
        };

        Helper.getAssociatedTransactionStatus = function(recExecution)
        {
                let stLogTitle = "Helper.getAssociatedTransactionStatus";
                log.debug(stLogTitle);

                let objSearchData = search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                            [
                                    ["type","anyof","Custom106"],
                                    "AND",
                                    ["mainline","is","T"],
                                    "AND",
                                    ["custbody_epu_source","anyof",recExecution.id],
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
                                            name: "statusref",
                                            summary: "GROUP",
                                            label: "Status"
                                    })
                            ]
                });
                let intResultCount = objSearchData.runPaged().count;

                if (intResultCount > 0)
                { return false; }
                else
                { return true; }
        }

        return UE;
});
