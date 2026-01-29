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
 * A set of automations have been developed to facilitate the creation of transactions based on details on the NetSuite case record.
 * The said automations depend on the existence of custom record entries underneath the case in the CS Hub Action Step custom record {customrecord_cshub_caseactionstep}
 * This document details the scripted utility that will create these custom record entries.
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2023/12/19           shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record'], (runtime, search, record) => {
    let strLogTitle;
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intSavedSearch = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_crt_actn_001_srch');
            let objTransactionSearch = search.load(intSavedSearch);
            //TODO: filter by specific case
            let intCase = runtime.getCurrentScript().getParameter('custscript_cshub_mr_createactionstep_cid')
            log.debug(strLogTitle + ' intCase', intCase)
            if(!isEmpty(intCase)) {
                objTransactionSearch.filters.push(
                    search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: intCase
                    })
                )
            }
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
            log.debug(strLogTitle + ' objSearchResults', objSearchResults)
            let strCaseDetails = objSearchResults.values.custevent_cshub_casedtls_scrpt_use;
            let strParentCaseNum = objSearchResults.values.casenumber;
            let intParentCaseNum = objSearchResults.id;
            let intParentConfig = objSearchResults.values.custevent_cshub_case_type.value;
            let strSubject = objSearchResults.values.title;
            let arrCaseAction = objSearchResults.values.custevent_cshub_casestep_array_ids
            if (strCaseDetails) {
                let arrActionStep = getActionStepName(intParentConfig, arrCaseAction);
                log.debug(strLogTitle + ' arrActionStep', arrActionStep)
                // for(let i=0; arrActionStep.length > i; i++){
                let objCaseDetails = JSON.parse(strCaseDetails);
                //     // log.debug(strLogTitle+' objCaseDetails', objCaseDetails);
                //     let intConfigStep = arrActionStep[i].value;
                //     let strConfigStep = arrActionStep[i].text;
                //     log.debug(strLogTitle+' strActionStep', 'intConfigStep: '+ intConfigStep +'| strConfigStep: '+ strConfigStep +'| strParentCaseNum: '+ strParentCaseNum);

                for (let j = 0; objCaseDetails.length > j; j++) {
                    context.write({
                        key: {
                            id: intParentCaseNum,
                            name: `${strParentCaseNum} ${strSubject} For` //${strConfigStep}`
                        },
                        //intParentCaseNum+','+strParentCaseNum +' ' +strSubject+' For ' + strConfigStep,
                        value: {
                            actionStep: arrActionStep,
                            // intConfigStep : intConfigStep,
                            values: objCaseDetails[j]
                        }
                    });
                }

                // }

            }

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const getActionStepName = (intActionStep, arrCaseAction) => {
        strLogTitle = 'getActionStepName'
        let objActionStep = search.lookupFields({
            id: intActionStep,
            type: 'customrecord_cshub_caseactions',
            columns: ['custrecord_cshcd_caseactions_step_parent', 'custrecord_cshcd_caseactions_step_parent.custrecord_cshub_csactnstep_crntstp_id']
        });
        log.debug(strLogTitle + ' objActionStep', objActionStep);
        let arrUnorderedSteps = objActionStep.custrecord_cshcd_caseactions_step_parent
        log.debug(strLogTitle + ' objActionStep', arrUnorderedSteps);


        if(arrUnorderedSteps.hasOwnProperty('value')){
            let arrCaseStep = []
            let arrStep = arrUnorderedSteps.value.split(',')
            let arrStepText = arrUnorderedSteps.text.split(',')
            for(let i=0; i < arrStep.length;i++){
                arrCaseStep.push({
                    value: arrStep[i],
                    text: arrStepText[i]
                })
            }
            log.debug(arrCaseStep);
            arrUnorderedSteps = arrCaseStep
            log.debug(strLogTitle + ' arrUnorderedSteps', arrUnorderedSteps);
        }


        // arrCaseAction = JSON.parse(arrCaseAction)
        // let strSearch = runtime.getCurrentScript().getParameter('custscript_ns_cshubcase_action_arr');
        // let objSearch = search.load(strSearch);
        let arrSteps = []
        let objSteps = {}
        arrCaseAction = arrCaseAction.split(',')
        log.debug(strLogTitle + ' arrCaseAction', arrCaseAction);
        log.debug(strLogTitle + ' arrCaseAction', typeof arrCaseAction);
        for (let i = 0; i < arrUnorderedSteps.length; i++) {
            let objCaseActionStep = search.lookupFields({
                id: arrUnorderedSteps[i].value,
                type: 'customrecord_cshub_caseactionstep',
                columns: ['custrecord_cshub_csactnstep_crntstp_id', 'name']
            });
            let strStep = objCaseActionStep.custrecord_cshub_csactnstep_crntstp_id
            let intOrder = arrCaseAction.indexOf(String(strStep))
            objSteps[intOrder] = {
                value: arrUnorderedSteps[i].value,
                text: objCaseActionStep.name
            }
        }

        return Object.values(objSteps);
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let objKey = JSON.parse(context.key)
            log.debug(strLogTitle + ' context', context)

            let intParentCaseNum = parseInt(objKey.id)
            // log.audit('key', context.key);
            // log.audit('intParentCaseNum', intParentCaseNum)
            // log.audit('strName', strName)
            // log.debug(strLogTitle+' strName', strName)
            for (let i = 0; context.values.length > i; i++) {
                let objValues = JSON.parse(context.values[i]);
                log.debug(strLogTitle + ' objValues', objValues)
                for (let i = 0; objValues.actionStep.length > i; i++) {
                    let strName = objKey.name + objValues.actionStep[i].text
                    let idCaseAction = createCaseActnStep(objValues, strName, intParentCaseNum, i)
                    log.audit('CS Hub Case Action Step Created', 'ID: ' + idCaseAction);
                }
            }

            // try{
            const recCase = record.submitFields({
                type: 'supportcase',
                id: parseInt(intParentCaseNum),
                values: {
                    custevent_cshub_act_stps_ctrd: true
                }
            });
            //
            // const recCase = record.load({
            //    type: record.Type.SUPPORT_CASE,
            //     id: parseInt(intParentCaseNum),
            //     isDynamic: true
            // });
            log.audit('recCase', recCase)

            // recCase.setValue({
            //     fieldId:'custevent_cshub_act_stps_ctrd',
            //     value: true
            // });

            // recCase.save();
            log.audit('----CHECKBOX IS TRUE----');
            // }catch (e) {
            //     log.error(e)
            // }


        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const createCaseActnStep = (objValues, strName, intParentCaseNum, i) => {
        strLogTitle = 'createCaseActnStep';
        // let intParentCaseNum = parseInt(objValues.id);
        let intConfigStep = parseInt(objValues.intConfigStep);

        let objRecDetails = objValues.values;
        let intTranid = parseInt(objRecDetails.tranid);
        let intLineID = objRecDetails.lineid;
        let intQuantity = parseInt(objRecDetails.quantity);
        let intReturnReason = objRecDetails.returnReason;
        let intItem = objRecDetails.itemName;
        let intReceiptLoc = parseInt(objRecDetails.receiptLocation);
        let bProcessRefund = objRecDetails.processRefund;
        let fltRefundAmt = forceFloat(objRecDetails.refAmt);
        log.debug(strLogTitle + ' objRecDetails ', 'intParentCaseNum: ' + intParentCaseNum + '| intConfigStep: ' + intConfigStep + '| intTranid: ' + intTranid + '| intLineID: ' + intLineID + '| intQuantity: ' + intQuantity + '| intReturnReason: ' + intReturnReason + '| intItem: ' + intItem + '| intReceiptLoc: ' + intReceiptLoc + '| bProcessRefund: ' + bProcessRefund + '| fltRefundAmt: ' + fltRefundAmt);
        log.debug(strLogTitle + ' objRecDetails ', objValues.actionStep[i])

        let recCaseAction = record.create({
            type: 'customrecord_cshub_caseactionstep',
            isDynamic: true
        });
        try {
            recCaseAction.setValue({
                fieldId: 'name',
                value: strName
            });

            recCaseAction.setValue({
                fieldId: 'custrecord_schub_parent_config_step',
                value: objValues.actionStep[i].value
            });

            recCaseAction.setValue({
                fieldId: 'custrecord_cshcd_csactn_step_parent_case',
                value: intParentCaseNum
            });

            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_casestep_prnt_tran',
                value: intTranid
            });

            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_casestep_tran_line_id',
                value: intLineID
            });

            if (!intQuantity) {
                intQuantity = 0
            }

            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_casestep_qty',
                value: intQuantity
            });

            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_casestep_rsn_code',
                value: intReturnReason
            });
            if (intItem) {
                recCaseAction.setValue({
                    fieldId: 'custrecord_cshub_actnstep_item',
                    value: parseInt(intItem)
                });
            }

            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_actnstep_intrns_rec_loc',
                value: intReceiptLoc
            });

            bProcessRefund = bProcessRefund === 'T';
            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_actnstep_dntrfnd_flag',
                value: bProcessRefund
            });


            recCaseAction.setValue({
                fieldId: 'custrecord_cshub_casestep_amt',
                value: fltRefundAmt
            })

        } catch (e) {
            log.debug('Unable to populate a field', e.message)
        }

        //
        let idCaseAction = recCaseAction.save({
            ignoreMandatoryFields: true,
            enableSourcing: true
        });

        return idCaseAction;

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
    const forceFloat = (stValue) => {
        var flValue = parseFloat(stValue);

        if (isNaN(flValue) || (stValue == Infinity)) {
            return 0.00;
        }

        return flValue;
    };

    const isEmpty = (stValue) =>
    {
        return ((stValue === '' || stValue == null || stValue == undefined)
            || (stValue.constructor === Array && stValue.length == 0)
            || (stValue.constructor === Object && (function(v){for(var k in v)return false;return true;})(stValue)));
    };


    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})