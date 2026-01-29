/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
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
 * 1.0            2024/10/05           shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     * @param {record} record
     */
    (record, search, runtime) => {
        let strLogTitle;

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
            strLogTitle = 'afterSubmit'
            try {
                let strSearchParam = getParameter('custscript_cshub_rsq_extl_search');
                let objRSQSearch = search.load(strSearchParam);
                //ggns 2024-05-13 added filter
                let filterInternalId = search.createFilter({name: 'internalid', operator: search.Operator.ANYOF, values: context.newRecord.id});
                objRSQSearch.filters.push(filterInternalId);
                //
                let intResultCount = objRSQSearch.runPaged().count;
                log.debug(strLogTitle, "Result Count: " + intResultCount);
                let recTransaction = context.newRecord;
                if (intResultCount > 0) {
                    let objResult = objRSQSearch.run().getRange({
                        start: 0,
                        end: 999,
                    });

                    let objCaseValues = getCaseValues(objResult);

                    if (objCaseValues) {
                        createCase(objCaseValues);
                    } else {
                        createTask(recTransaction)
                    }

                } else {
                    createTask(recTransaction)
                }
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        const createTask = (recTransaction) => {
            strLogTitle = 'createTask'
            log.debug(strLogTitle, 'creating task');
            let idTransaction = recTransaction.id;
            let intCompany = recTransaction.getValue('entity');
            let strTitle = getParameter('custscript_ns_cshub_title_prefix') + ' ' + idTransaction
            let intAssigned = getParameter('custscript_cshub_rsq_extl_notifyonerror');

            log.debug(strLogTitle, {
                idTransaction: idTransaction,
                intCompany : intCompany,
                strTitle : strTitle,
                intAssigned : intAssigned
            })
            let recTask = record.create({
                type: record.Type.TASK,
                isDynamic: true
            });

            recTask.setValue({
                fieldId: 'title',
                value: strTitle
            });

            recTask.setValue({
                fieldId: 'assigned',
                value: parseInt(intAssigned)
            });

            recTask.setValue({
                fieldId: 'company',
                value: parseInt(intCompany)
            });

            recTask.setValue({
                fieldId: 'transaction',
                value: parseInt(idTransaction)
            });

            recTask.setValue({
                fieldId: 'message',
                value: strTitle
            });

            recTask.setValue({
                fieldId: 'sendemail',
                value: true
            });
//ggns change: 2024-05-16 
            recTask.setValue({
                fieldId: 'status',
                value: 5
            });
//end ggns change

            let idTask = recTask.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.audit(strLogTitle, 'Task Created with ID: ' + idTask)

        }

        const createCase = (objCase) => {
            strLogTitle = 'createCase'
            log.debug(strLogTitle + 'Creating Case', objCase);
            let recCase = record.create({
                type: record.Type.SUPPORT_CASE,
                isDynamic: true
            });

            recCase.setValue({
                fieldId: 'title',
                value: objCase.objFirstLineValues.title
            });

            recCase.setValue({
                fieldId: 'company',
                value: parseInt(objCase.objFirstLineValues.company)
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_case_type',
                value: parseInt(objCase.objFirstLineValues.caseType)
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_case_tran',
                value: parseInt(objCase.objFirstLineValues.caseTrnsctn)
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_casedtls_scrpt_use',
                value: JSON.stringify(objCase.objCaseDetailsScript)
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_casedtls_rsq',
                value: JSON.stringify(objCase.objCaseDetailsRSQ)
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_act_stps_ctrd',
                value: true
            });

            recCase.setValue({
                fieldId: 'custevent_cshub_scrpt_trgr_cond3',
                value: true
            });

            let idCase = recCase.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.audit(strLogTitle, 'Case Created with ID: ' + idCase)
        }

        const getCaseValues = (result) => {
            strLogTitle = 'getCaseValues'
            let objCaseDetailsScript = [];
            let objCaseDetailsRSQ = [];
            let objFirstLineValues;

            for (let i = 0; i < result.length; i++) {
                let intCreatedFrom = result[0].getValue('createdfrom');
                if (i == 0) {

                    let strEntity = result[i].getText('entity');
                    let strCaseType = result[i].getText('custbody_cshub_case_type');
                    let strCreateFrmTranID = result[i].getValue({
                        name: "tranid",
                        join: "createdFrom",
                    });
                    let intEntity = result[i].getValue('entity');
                    let intCaseType = result[i].getValue('custbody_cshub_case_type');

                    objFirstLineValues = {
                        'title': strEntity + ', ' + strCaseType + ', ' + strCreateFrmTranID,
                        'company': parseInt(intEntity),
                        'caseType': intCaseType ? parseInt(intCaseType) : parseInt(getParameter('custscript_cshub_rsq_extl_casetype')),
                        'caseTrnsctn': parseInt(intCreatedFrom)
                    }

                    log.debug(strLogTitle, objFirstLineValues);
                }
//ggns 2024-05-15 change intTranId
                //let intTranID = result[i].id;
                let intTranID = result[i].getValue({
                        name: "internalid",
                        join: "createdFrom",
                    });
//ggns 2024-05-15 change intTranId
                let intLineID = result[i].getValue('custcol_br_associated_etail_id');
                let intQTY = result[i].getValue('quantity');
                let intReturnReason = result[i].getValue('custcol_atlas_return_reason');
                let intItemName = result[i].getValue('item');
                let intReceiptLoc = result[i].getValue('location');
                let bProcessRefund = result[i].getValue({
                    name: "custrecord_cshub_caseactn_donot_refund",
                    join: "CUSTBODY_CSHUB_CASE_TYPE",
                });

                log.debug(strLogTitle, {
                    intTranID : intTranID,
                    intLineID : intLineID,
                    intQTY : intQTY,
                    intReturnReason : intReturnReason,
                    intItemName : intItemName,
                    intReceiptLoc : intReceiptLoc,
                    bProcessRefund : bProcessRefund
                });

                if (intCreatedFrom && intLineID && intItemName && intQTY) {
                    objCaseDetailsScript.push({
                        'tranid': parseInt(intTranID),
                        'lineid': intLineID,
                        'quantity': parseInt(intQTY),
                        'returnReason': parseInt(intReturnReason),
                        'itemName': parseInt(intItemName),
                        'receiptLocation': parseInt(intReceiptLoc),
                        'processRefund': bProcessRefund = 'F' || 'false' ? false : true,
                    });

                    objCaseDetailsRSQ.push({
                        '1': parseInt(intTranID),
                        '2': intLineID,
                        '3': parseInt(intQTY),
                    });
                } else {
                    return false;
                }

            }

            return {
                'objFirstLineValues': objFirstLineValues,
                'objCaseDetailsScript': objCaseDetailsScript,
                'objCaseDetailsRSQ': objCaseDetailsRSQ
            }
        }

        const getParameter = (id) => {
            return runtime.getCurrentScript().getParameter(id);
        }


        return {
            afterSubmit: afterSubmit
        };

    });
