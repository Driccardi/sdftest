/**
 *    Copyright (c) 2023, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data. It is best suited for situations where the data can be divided into small, independent parts. When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * This script will be used as library that will cancel the transactions selected in the Customer Service Hub Suitelet
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/06           shekainah.castillo                       Initial Commit
 * 
 * 
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', 'N/task'],  (runtime, search, record, task) => {
    let strLogTitle;
    const getInputData = () => {
        try{
            strLogTitle = 'getInputData';
            let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_cancel_search');
            let objTransactionSearch = search.load(intSavedSearch);
            let objSearchResultCount = objTransactionSearch.runPaged().count;
            log.debug("SearchObj result count", objSearchResultCount);

            if (objSearchResultCount > 0) {
                return objTransactionSearch;
            } else {
                log.audit('No data to process', 'Saved search is not getting results')
                return false;
            }
        }catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const map = (context) => {
        try{
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);

            let idTransaction = parseInt(objSearchResults.values.custrecord_cshub_casestep_prnt_tran.value);
            let strTransaction = objSearchResults.values.custrecord_cshub_casestep_prnt_tran.text;
            let intTranLine = objSearchResults.values.custrecord_cshub_casestep_tran_line_id;
            let intReason = parseInt(objSearchResults.values.custrecord_cshub_casestep_rsn_code.value);
            let intAssociatedReason = parseInt(objSearchResults.values["custrecord_cshub_glreasoncode.CUSTRECORD_CSHUB_CASESTEP_RSN_CODE"].value);
            let arrCaseStep = objSearchResults.values["custevent_cshub_casestep_array_ids.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE"];
            let strCurrentActionStep = objSearchResults.values.custrecord_cshub_csactnstep_crntstp_id;
            let idCaseActionStep = parseInt(objSearchResults.id)
            let strType = getTransactionType(idTransaction)
            log.debug(strLogTitle + ' Result Values:','idTransaction: ' + idTransaction +' | strTransaction: ' + strTransaction+' | strType: ' + strType +' | intTranLine: ' + intTranLine+' | intReason: ' + intReason+' | intAssociatedReason: ' + intAssociatedReason+'| arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' +strCurrentActionStep);


            context.write({
                key: {
                    idTransaction : idTransaction,
                    strType : strType,
                    idCaseActionStep : idCaseActionStep,
                    arrCaseStep : arrCaseStep,
                    strCurrentActionStep : strCurrentActionStep
                },//idTransaction + '_' + strType + '_' + idCaseActionStep+ '_'+ arrCaseStep + '_'+strCurrentActionStep ,
                value: {
                    intTranLine : intTranLine,
                    intReason : intReason,
                    intAssociatedReason : intAssociatedReason
                }
            })

        }catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try{
            strLogTitle = 'reduce';
            let objKey = JSON.parse(context.key)//context.key.split('_');
            let idTransaction = parseInt(objKey.idTransaction);
            let strRecType = objKey.strType;

            let recTransaction = record.load({
                id: idTransaction,
                type: strRecType,
                isDynamic: true
            });

            for (let i = 0; i < context.values.length; i++) {
                let objResultValues = JSON.parse(context.values[i]);
                log.debug(strLogTitle + ' objResultValues',objResultValues);
                let intTranLine = objResultValues.intTranLine;
                getSublistDetails(idTransaction, intTranLine, recTransaction)
            }
            let idTransactionCreated;
            try{
                idTransactionCreated = recTransaction.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });

                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: objKey.idCaseActionStep,
                    values:{
                        custrecord_cshub_actnstep_stts : 3
                    }
                });
            }catch (e) {
                record.submitFields({
                    type: 'customrecord_cshub_caseactionstep',
                    id: objKey.idCaseActionStep,
                    values:{
                        custrecord_cshub_actnstep_stts : 4
                    }
                });
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }

            if(idTransactionCreated){
                const arrCaseStep = objKey.arrCaseStep.split(',')
                executeNextStep(arrCaseStep, objKey.strType)
            }

        }catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const summarize = (summary)=>  {
        try{
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

        }catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const executeNextStep =(arrCaseStep,strCurrentActionStep) =>{
        strLogTitle = 'executeNextStep';

        let intCurrentStep = arrCaseStep.indexOf(strCurrentActionStep)
        log.debug('intCurrentStep', intCurrentStep)
        if(intCurrentStep < arrCaseStep.length){
            const intNextStep = arrCaseStep[parseInt(intCurrentStep) + 1]
            log.debug('intNextStep', intNextStep)
            let objNextStepSrch = search.load('customsearch_cshub_ue_002_caseactionst_2');
            objNextStepSrch.filters.push(
                search.createFilter({
                    name: "custrecord_cshub_csactnstep_crntstp_id",
                    operator: search.Operator.IS,
                    values: intNextStep,
                })
            );

            let searchResultCount = objNextStepSrch.runPaged().count;
            if(searchResultCount > 0){
                let strDeploymentID;
                let strScriptID;
                let strExpectedRecord;
                objNextStepSrch.run().each(function (result) {
                    strScriptID = result.getValue('custrecord_cshub_automation_to_trigger');
                    strDeploymentID = result.getValue('custrecord_cshub_trigger_script_dep_id');
                    strExpectedRecord = result.getText('custrecord_cshcd_csactn_step_exp_tran')
                });
                log.debug('Result', 'strScriptID: ' + strScriptID + '| strDeploymentID: '+ strDeploymentID + '| strExpectedRecord: '+ strExpectedRecord)

                if (strScriptID && strDeploymentID) {
                    let objMapReduce = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: strScriptID,
                        deploymentId: strDeploymentID,
                    });
                    objMapReduce.submit();
                    log.audit('Task Submitted', 'Executing MR Script to create ' + strExpectedRecord);
                }else{
                    log.audit('Process Ends', 'No deployment detail to execute on the step');
                }
            }

        }
    }

    const getSublistDetails = (idTransaction, intTranLine, recTransaction) =>{
        strLogTitle = 'getSublistDetails';
        const objLineUniqueKeySearch = search.load(runtime.getCurrentScript().getParameter('custscript_ns_br_unique_etail_search'))

        //new:
        let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id');

        objLineUniqueKeySearch.filters.push(
            search.createFilter({
                name: "internalid",
                operator: search.Operator.ANYOF,
                values: idTransaction,
            }),

            search.createFilter({
                // old:
                // name: "custcol_celigo_etail_order_line_id",
                // new:
                name: strEtailID,
                operator: search.Operator.IS,
                values: intTranLine,
            }),
        );

        const searchResultCount = objLineUniqueKeySearch.runPaged().count;

        log.debug("transactionSearchObj result count", searchResultCount);

        objLineUniqueKeySearch.run().each(function (result) {
            log.debug(strLogTitle + ' Result',result)
            let intUniqueKey = parseInt(result.getValue('lineuniquekey'));
            let intSublistLine = recTransaction.findSublistLineWithValue({
                sublistId: 'item',
                fieldId: 'lineuniquekey',
                value: intUniqueKey
            });
            log.debug(strLogTitle + ' intSublistLine',intSublistLine)
            if(intSublistLine != -1){
                closeLine(intSublistLine, recTransaction)
            }
            return true;
        });

    }

    const getTransactionType = (idTransaction) => {
        strLogTitle = 'getTransactionType';
        let strTranType = search.lookupFields({
            id: idTransaction,
            type: search.Type.TRANSACTION,
            columns: ['type']
        }).type[0].text
        log.debug(strLogTitle + ' strType:',strTranType)
        return strTranType.toLowerCase().replace(/\s/g, '');
    }

    const closeLine = (intSublistLine, recTransaction) => {
        strLogTitle = 'closeLine';
        recTransaction.selectLine({
            sublistId: 'item',
            line: intSublistLine
        })

        recTransaction.setCurrentSublistValue({
            sublistId:'item',
            fieldId: 'isclosed',
            value: true
        });
        recTransaction.commitLine('item')

        log.audit(strLogTitle, '--LINE ' + intSublistLine +' CLOSED--')
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})