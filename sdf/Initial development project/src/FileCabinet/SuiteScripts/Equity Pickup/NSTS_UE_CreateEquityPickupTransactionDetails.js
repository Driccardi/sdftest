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
define(function (require)
{
    let record = require("N/record");
    let runtime = require("N/runtime");
    let task = require("N/task");
    let nsutil = require('../Library/NSUtilvSS2.js');
    let scriptutil = require('./NSTS_MD_CommonLibrary');


    let UE = {};
    let Helper = {};

    UE.afterSubmit = function (context)
    {
        let stLogTitle = "UE.afterSubmit";
        log.debug(stLogTitle);

        try {
            if (context.type !== context.UserEventType.CREATE) return;

            let objData = {};
            let recExecution = context.newRecord;
            objData.accountingperiod = recExecution.getValue({fieldId: 'custrecord_epue_accountingperiod'});
            objData.postingperiod = recExecution.getValue({fieldId: 'custrecord_epue_accountingperiod'});
            objData.subsidiary = recExecution.getValue({fieldId: 'custrecord_epue_lowerlvl_subsidiary'});
            log.debug(stLogTitle, 'objData:' + JSON.stringify(objData));

            let objMRTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: runtime.getCurrentScript().getParameter('custscript_ceputd_mrscript'),
                params: {
                    custscript_ceputd_postingperiod: objData.postingperiod,
                    custscript_ceputd_subsidiary: objData.subsidiary,
                    custscript_ceputd_executionrecord: recExecution.id,
                }
            })
            let intTaskId = objMRTask.submit();
            log.debug(stLogTitle, 'intTaskId:'+intTaskId);


        } catch (ex) {
            log.error('UE.beforeSubmit | Error ', ex.name + ' : ' + ex.message);
        }
    };

    return UE;
});
