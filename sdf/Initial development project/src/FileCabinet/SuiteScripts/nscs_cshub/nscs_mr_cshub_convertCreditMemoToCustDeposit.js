/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/02/18           shekainah.castillo                       Initial Commit
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', './cshub_library'],

    (record, search, runtime, cshub) => {
        let strLogTitle;
        const objScriptParameterIds = Object.freeze({
            savedSearch: 'custscript_cshub_mr_cmtocd_search',
            depositAccount: 'custscript_cshub_mr_cmtocd_depacc',
            paymentMethod: 'custscript_cshub_mr_cmtocd_paymethod',
            mapCaseSearch: 'custscript_cshub_mr_cmtocd_search_case',
            mapSOSearch: 'custscript_cshub_mr_cmtocd_search_so',
            customForm: 'custscript_cshub_mr_cmtocd_cdcustomform'
        });

        //internal ID of payment method "Convert Credit To Deposit" - SB1
        const stDepositPaymentMethod = '134';

        /**
         * @name isEmpty
         * @param value
         * @returns {boolean}
         */
        const isEmpty = (value) => {
            if (value === null)
                return true;
            if (value === undefined)
                return true;
            if (value === 'undefined')
                return true;
            if (value === '')
                return true;
            if (value.constructor === Object && Object.keys(value).length === 0)
                return true;
            if (value.constructor === Array && value.length === 0)
                return true;
            return false;
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            //get all Credit Memos with unapplied amounts that have CSHUB Case Detail for one of the valid CSHUB Case Types
            //use saved search customsearch_cshub_mr_cmtocd (CSHUB MR Convert CM to CD) as example
            try {
                strLogTitle = 'getInputData';
                // let intSavedSearch = runtime.getCurrentScript().getParameter(objScriptParameterIds.savedSearch);
                // let objTransactionSearch = search.load(intSavedSearch);

                let objTransactionSearch;
                let savedSearchBuilder = cshub.general.mrSearchBuilder();
                if (cshub.general.isEmpty(savedSearchBuilder)) {
                    throw {
                        name: 'ERR_SEARCH_BUILDER',
                        message: 'mrSearchBuilder returned no result.'
                    }
                } else {
                    objTransactionSearch = search.load({id: savedSearchBuilder.savedSearchId});
                    objTransactionSearch.filters.push(search.createFilter({
                        name: savedSearchBuilder.filterName,
                        join: 'CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL',
                        operator: search.Operator.ANYOF,
                        values: savedSearchBuilder.filterValue
                    }));
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

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {
                strLogTitle = 'map';
                let debug_mapObjParams = getParameters();
                log.debug({
                    title: 'debug_mapObjParams',
                    details: JSON.stringify(debug_mapObjParams)
                });
                let objSearchResults = JSON.parse(mapContext.value);
                log.debug(strLogTitle + ' objSearchResults', objSearchResults);
                let objData = {
                    entity: objSearchResults.values.entity.value,
                    arAccount: objSearchResults.values.account.value,
                    unappliedAmount: objSearchResults.values.amountremaining,
                    location: objSearchResults.values.location.value,
                    subsidiary: objSearchResults.values.subsidiary.value,
                    transactionId: objSearchResults.id,
                    documentNumber: objSearchResults.values.tranid,
                    'class': objSearchResults.values.class,
                    'department': objSearchResults.values.department,
                    lineId: objSearchResults.values["custrecord_cshub_casestep_tran_line_id.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL"],
                }
                log.debug(strLogTitle + ' objData', objData);
                let objCSHub = {
                    caseCreatedFrom: objSearchResults.values.custbody_cshub_createdfromcasedetail.value,
                    caseType: objSearchResults.values["custrecord_cshcd_csactn_stp_prnt_cs_typ.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL"].value,
                    caseParent: objSearchResults.values["custrecord_cshcd_csactn_step_parent_case.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL"].value,
                }
                log.debug(strLogTitle + ' objCSHub', objCSHub);
                let bConvertCMToCD = validateCaseDetails(objData, objCSHub);
                log.debug({
                    title: 'map validateCaseDetails objData',
                    details: JSON.stringify(objData)
                });
                if (bConvertCMToCD) {
                    let objCaseDetails = findCaseActionID(objData.lineId, objCSHub.caseParent);
                    cshub.caseActionStep.changeCaseActionStepStatus(objCaseDetails.idCaseAction, cshub.caseActionStep.objCaseActionStepStatus.inProgress);
                    mapContext.write({
                        key: {
                            idTransaction: objData.transactionId,
                            params: getParameters()
                        },
                        value: {objData, objCSHub}
                    })
                }

            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
            /*
            1. prep values FROM Credit Memo saved search
                    i. get Entity
                    ii. get AR Account
                    iii. get Unapplied Amount
                    iv. get CSHUB Field Values
                    v. get segment values
            Run saved search CSHUB MR CM To CD - Case to check whether Case is ready for CM to CD conversion. Pass Case internal ID to search.
                If search returns result, continue. Else skip.
            Run saved search CSHUB MR CM To CD - Sales Order to check whether Case has sales order for Customer Deposit. Pass case internal ID to search.
                If search returns result, continue. Else skip.
            2. prep value FOR Customer Deposit & Journal Entry
                    i. get script parameter Account
                    ii. get Sales Order to apply

            3. pass values to Reduce
             */
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            /*
            1. Create Journal Entry in subsidiary of Credit Memo
                    JE Line 1 - DEBIT AR Account of the Credit Memo for the unapplied amount of the Credit Memo;
                            Set Entity to same entity as Credit Memo
                    JE Line 2 - CREDIT Account from Script Parameter (Deposit account for Customer Deposit)
                    Set same segments on both lines
            2. Apply Credit Memo to Journal Entry
            3. Create Customer Deposit
                i. set account
                ii. set sales order
                iii. set amount
                iv. set payment method to "Convert Credit To Deposit" ... see const
                v. set segments
             */
            try {
                strLogTitle = 'reduce';
                log.debug(strLogTitle + ' context', reduceContext.key);
                log.debug(strLogTitle + ' context', reduceContext.values);
                let objKey = JSON.parse(reduceContext.key);
                let objValues = JSON.parse(reduceContext.values[0]);
                log.debug(strLogTitle + ' objValues', objValues);

                const objCaseDetails = findCaseActionID(objValues.objData.lineId, objValues.objCSHub.caseParent);
                log.debug({
                    title: 'reduce_objCaseDetails',
                    details: JSON.stringify(objCaseDetails)
                });
                const idCustomerDeposit = createCustomerDeposit(objKey, objValues, objCaseDetails.idCaseAction)
                log.debug({
                    title: 'reduce_idCustomerDeposit',
                    details: idCustomerDeposit
                });

                if (!cshub.general.isEmpty(idCustomerDeposit)) {
                    log.debug({
                        title: 'reduce',
                        details: 'Customer Deposit created. Creating JE.'
                    });
                    let idJE = createJE(objKey, objValues);
                    log.debug({
                        title: 'reduce_idJE',
                        details: idJE
                    });
                    if (!cshub.general.isEmpty(idJE)) {
                        log.debug({
                            title: 'reduce',
                            details: 'JE created. Applying JE to Credit Memo.'
                        });
                        applyJEtoCreditMemo(idJE, objKey.idTransaction);
                    }
                    log.debug({
                        title: 'reduce_afterApplyJE',
                        details: 'idCustomerDeposit: ' + idCustomerDeposit + '; objCaseDetails.idCaseAction: ' + objCaseDetails.idCaseAction
                    });
                    let updatedActionStepID = record.submitFields({
                        type: 'customrecord_cshub_caseactionstep',
                        id: objCaseDetails.idCaseAction,
                        values: {
                            custrecord_cshcd_csactn_step_crtd_tran: idCustomerDeposit,
                            custrecord_cshub_actnstep_stts: 3
                        }
                    });
                    log.debug({
                        title: 'reduce_afterSubmitFields',
                        details: 'updatedActionStepID: ' + updatedActionStepID
                    });
                } else {
                    record.submitFields({
                        type: 'customrecord_cshub_caseactionstep',
                        id: objCaseDetails.idCaseAction,
                        values: {
                            custrecord_cshub_actnstep_stts: 4
                        }
                    });
                }
                // for(let i=0; reduceContext.values.length > i; i++){
                //     let objValues = JSON.parse(reduceContext.values[i]);

                // }
            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
            try {
                strLogTitle = 'summarize';

                log.audit(strLogTitle, 'Execution time in seconds: ' + summaryContext.seconds +
                    ' | Usage Consumed: ' + summaryContext.usage +
                    ' | Usage Consumed: ' + summaryContext.yields +
                    ' | Concurrency Number: ' + summaryContext.concurrency
                );
                if (summaryContext.inputSummary.error !== null) {
                    log.error('Input Error: ', summaryContext.inputSummary.error);
                }
                summaryContext.mapSummary.errors.iterator().each(function (key, error) {
                    log.error('Map Error: ', error);
                    return true;
                });

            } catch (e) {
                log.error("Error at [" + strLogTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        const validateCaseDetails = (objData, objCSHub) => {
            strLogTitle = 'validateCaseDetails'
            // Runs saved search CSHUB MR CM To CD - Case to check whether Case is ready for CM to CD conversion. Pass Case internal ID to search.
            //     If search returns result, continue. Else skip.
            let intSavedSearch = runtime.getCurrentScript().getParameter(objScriptParameterIds.mapCaseSearch);
            let objCaseSearch = search.load(intSavedSearch);
            objCaseSearch.filters.push(
                search.createFilter({
                    name: "internalid",
                    operator: search.Operator.ANYOF,
                    values: objCSHub.caseParent
                })
            )
            let intCaseResultCount = objCaseSearch.runPaged().count;
            log.debug("validateCase intCaseResultCount", intCaseResultCount);
            if (intCaseResultCount === 0) return false;
            //     Run saved search CSHUB MR CM To CD - Sales Order to check whether Case has sales order for Customer Deposit. Pass case internal ID to search.
            //     If search returns result, continue. Else skip.
            let intSOCaseSavedSearch = runtime.getCurrentScript().getParameter(objScriptParameterIds.mapSOSearch);
            let objTransactionSearch = search.load(intSOCaseSavedSearch);
            objTransactionSearch.filters.push(
                search.createFilter({
                    name: "internalid",
                    operator: search.Operator.ANYOF,
                    values: objCSHub.caseParent
                })
            )
            let intResultCount = objTransactionSearch.runPaged().count;
            log.debug("validateCase SearchObj result count", intResultCount);
            if (intCaseResultCount > 0) {
                objTransactionSearch.run().each(function (result) {
                    //getting the created transaction
                    objData.salesOrder = result.getValue({
                        name: "custrecord_cshcd_csactn_step_crtd_tran",
                        join: "CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE",
                    });

                });
                return true;
            }
        }

        const getParameters = () => {
            strLogTitle = 'getParameters'
            let objParams = {}
            for (let params in objScriptParameterIds) {
                objParams[params] = runtime.getCurrentScript().getParameter(objScriptParameterIds[params])
            }
            return objParams;
        }

        const createJE = (objKey, objValues) => {
            strLogTitle = 'createJE'
            // JE Line 1 - DEBIT AR Account of the Credit Memo for the unapplied amount of the Credit Memo;
            // Set Entity to same entity as Credit Memo
            // JE Line 2 - CREDIT Account from Script Parameter (Deposit account for Customer Deposit)
            // Set same segments on both lines
            log.debug(strLogTitle, {objKey})
            log.debug(strLogTitle, {objValues})
            try {
                const recJE = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true,
                });

                recJE.setValue({
                    fieldId: 'subsidiary',
                    value: objValues.objData.subsidiary
                })

                recJE.setValue({
                    fieldId: 'approvalstatus',
                    value: 2 //setting status to approved
                })


                //Debit
                log.debug(strLogTitle + ' Debit Values: ', {
                    account: objValues.objData.arAccount,
                    amount: objValues.objData.unappliedAmount,
                    entity: objValues.objData.entity,
                    location: objValues.objData.location,
                    department: objValues.objData.department,
                    'class': objValues.objData.class
                })

                recJE.selectNewLine({sublistId: 'line'});
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: parseInt(objValues.objData.arAccount)
                });
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: objValues.objData.unappliedAmount
                });
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: objValues.objData.entity
                })

                if (!isEmpty(objValues.objData.location)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        value: objValues.objData.location
                    })
                }

                if (!isEmpty(objValues.objData.department)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: objValues.objData.department
                    })
                }

                if (!isEmpty(objValues.objData.class)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: objValues.objData.class
                    })
                }
                recJE.commitLine({sublistId: 'line'});

                //Credit
                log.debug(strLogTitle + ' Credit Values: ', {
                    account: objKey.params.depositAccount,
                    amount: objValues.objData.unappliedAmount,
                    entity: objValues.objData.entity,
                    location: objValues.objData.location,
                    department: objValues.objData.department,
                    'class': objValues.objData.class
                })

                recJE.selectNewLine({sublistId: 'line'});
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: parseInt(objKey.params.depositAccount)
                });
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: objValues.objData.unappliedAmount
                });
                recJE.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: objValues.objData.entity
                })

                //set segments
                if (!isEmpty(objValues.objData.location)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        value: objValues.objData.location
                    })
                }

                if (!isEmpty(objValues.objData.department)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: objValues.objData.department
                    })
                }

                if (!isEmpty(objValues.objData.class)) {
                    recJE.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: objValues.objData.class
                    })
                }

                recJE.commitLine({sublistId: 'line'});
                let idRec = recJE.save()
                log.audit(strLogTitle + 'Journal Entry Generated', `journalentry: ${idRec}`)
                return idRec
            } catch (e) {
                log.error(strLogTitle + 'Unable to generate Journal Entry', e.message)
            }

        }

        const applyJEtoCreditMemo = (idJE, transactionID) => {
            strLogTitle = 'applyJEtoCreditMemo'
            let recCreditMemo = record.load({
                type: record.Type.CREDIT_MEMO,
                id: transactionID,
                isDynamic: true
            });

            let intJELine = recCreditMemo.findSublistLineWithValue({
                sublistId: 'apply',
                fieldId: 'internalid',
                value: idJE
            })

            if(intJELine !== -1){
                recCreditMemo.selectLine({
                    sublistId: 'apply',
                    line: intJELine
                });
                recCreditMemo.setCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    value: true
                })
                recCreditMemo.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                log.audit(strLogTitle, 'Journal Entry is now applied to Credit Memo')
            }else{
                log.debug(strLogTitle, 'Unable to find JE within the Credit Memo')
            }
        }

        const createCustomerDeposit = (objKey, objValues, intCaseID) => {
            strLogTitle = 'createCustomerDeposit '
            // JE Line 1 - DEBIT AR Account of the Credit Memo for the unapplied amount of the Credit Memo;
            // Set Entity to same entity as Credit Memo
            // JE Line 2 - CREDIT Account from Script Parameter (Deposit account for Customer Deposit)
            // Set same segments on both lines
            log.debug(strLogTitle, {
                entity: objValues.objData.entity,
                docnum: objValues.objData.documentNumber,
                amount: objValues.objData.unappliedAmount,
                paymentMethod: objKey.params.paymentMethod,
                salesOrder: objValues.objData.salesOrder
            });
            try {
                //2025-06-18 GGNS Added because CD form in prod had Location made mandatory
                let customFormId = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.customForm});
                let objDefaultValues = {};
                objDefaultValues['entity'] = objValues.objData.entity;
                if (!isEmpty(customFormId)) {
                    objDefaultValues['customform'] = customFormId;
                }
                const recCustDeposit = record.create({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    isDynamic: true,
                    defaultValues: objDefaultValues
                });

                recCustDeposit.setValue({
                    fieldId: 'memo',
                    value: 'Converted From Credit Memo: ' + objValues.objData.documentNumber
                });

                if(!isEmpty(intCaseID)){
                    recCustDeposit.setValue({
                        fieldId: 'custbody_cshub_createdfromcasedetail',
                        value: intCaseID
                    });
                }

                recCustDeposit.setValue({
                    fieldId: 'paymentoption',
                    value: objKey.params.paymentMethod
                })

                recCustDeposit.setValue({
                    fieldId: 'salesorder',
                    value: objValues.objData.salesOrder
                });
                log.debug({
                    title: 'parseFloat(objValues.objData.unappliedAmount)',
                    details: parseFloat(objValues.objData.unappliedAmount)
                });
                recCustDeposit.setValue({
                    fieldId: 'payment',
                    value: parseFloat(objValues.objData.unappliedAmount)
                });

                let idRec = recCustDeposit.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });
                log.audit(strLogTitle, `customerdeposit: ${idRec}`)
                return idRec
            } catch (e) {
                log.error(strLogTitle + 'Unable to generate Customer Deposit', e.message)
            }
        }

        const findCaseActionID = (intTranLine, intParentCase) => {
            let intRecordID = parseInt(runtime.getCurrentScript().getParameter('custscript_cshub_mr_cmtocd_trantype'));
            //let enumRecordType = cshub.general.objTransactionRecordIDs()[intRecordID];
            let intFindActionStepSrch = parseInt(runtime.getCurrentScript().getParameter('custscript_cshub_mr_cmtocd_cas_search'));
            let objSearchCase = search.load({id: intFindActionStepSrch});
            objSearchCase.filters.push(
                search.createFilter({
                    name: "custrecord_cshcd_csactn_step_parent_case",
                    operator: search.Operator.ANYOF,
                    values: parseInt(intParentCase),
                }),
                search.createFilter({
                    name: "custrecord_cshub_casestep_tran_line_id",
                    operator: search.Operator.IS,
                    values: intTranLine,
                }),
                search.createFilter({
                    name: "custrecord_cshcd_csactn_step_exp_tran",
                    operator: search.Operator.ANYOF,
                    values: intRecordID
                })
            );
            log.debug('Current Search', objSearchCase)
            let idCaseAction;
            let arrCaseStep;
            let strCurrentActionStep;
            let searchResultCount = objSearchCase.runPaged().count;
            log.debug("objSearchCase result count", searchResultCount);
            if (searchResultCount > 0) {
                objSearchCase.run().each(function (result) {
                    log.debug('result', result)
                    idCaseAction = result.id;
                    arrCaseStep = result.getValue({
                        name: 'custevent_cshub_casestep_array_ids',
                        join: 'CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE'
                    });
                    strCurrentActionStep = result.getValue('custrecord_cshub_csactnstep_crntstp_id')
                });
                log.audit('result', 'idCaseAction: ' + idCaseAction + ' | arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep);

                return {
                    idCaseAction: idCaseAction,
                    strCurrentActionStep: strCurrentActionStep,
                    arrCaseStep: arrCaseStep
                };
            } else {
                log.audit('No case action found.');
                return 0;
            }
        }
        return {getInputData, map, reduce, summarize}

    });
