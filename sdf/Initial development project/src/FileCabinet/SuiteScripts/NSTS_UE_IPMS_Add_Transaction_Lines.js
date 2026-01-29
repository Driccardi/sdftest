/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],

    (record, runtime, search) => {

        const afterSubmit = (scriptContext) => {
            try{
                let runTimeContext = runtime.executionContext;
                log.debug("Run Time Context", runTimeContext);
                log.debug("Record Type",scriptContext.type);
                if (scriptContext.type === scriptContext.UserEventType.CREATE){
                    let objCurrentRecord = scriptContext.newRecord;
                    let objCurrentRec = record.load({ type: objCurrentRecord.type, id: objCurrentRecord.id , isDynamic: true});
                    let intBillMode = objCurrentRec.getValue('custrecord_ns_psw_polrec_billmode');
                    let intState = objCurrentRec.getValue('custrecord_ns_psw_polrec_stateofinsured');
                    let intPolicyId = objCurrentRec.getValue('recordid');
                    let intPolicyNo = objCurrentRec.getValue('custrecord_ns_psw_polrec_policynumber');
                    let intInsuredCustomer = objCurrentRec.getValue('custrecord_ns_psw_polrec_insuredname');
                    let intPMS = objCurrentRec.getValue('custrecord_ns_psw_polrec_pmssource');
                    let intPolicyType = objCurrentRec.getValue('custrecord_ns_psw_polrec_policytype');
                    let intBillingCompany = objCurrentRec.getValue('custrecord_ns_psw_polrec_billingcompany');

                    log.debug("Details: ",{
                        id: objCurrentRecord.id,
                        billmode : intBillMode,
                        state : intState,
                        PMS : intPMS
                    });

                    let objScript = runtime.getCurrentScript();
                    let intPolicyAccSrchParam = objScript.getParameter({name: 'custscript_ns_policy_acc_srch_param'});
                    let objSearch = search.load({id: intPolicyAccSrchParam});
                    let additionalFilters = [
                        search.createFilter({
                            name: 'custrecord_ns_psw_polacc_billmode',
                            operator: search.Operator.ANYOF,
                            values: intBillMode
                        }),
                        search.createFilter({
                            name: 'custrecord_ns_psw_polacc_state',
                            operator: search.Operator.ANYOF,
                            values: intState
                        }),
                        search.createFilter({
                            name: 'custrecord_ns_psw_polaccc_pmssource',
                            operator: search.Operator.ANYOF,
                            values: intPMS
                        }),search.createFilter({
                            name: 'custrecord_ns_psw_polacc_policytype',
                            operator: search.Operator.ANYOF,
                            values: intPolicyType
                        })
                    ];
                    objSearch.filters = (objSearch.filters || []).concat(additionalFilters);
                    let objPolicyAccountTrans = getAllResults(objSearch);
                    log.debug("Obj Policy Accounting Trans Search Results: ",objPolicyAccountTrans);
                    objPolicyAccountTrans.forEach((result, index) => {
                        try {
                            log.debug("Result [" + index + "]", result);

                            let intBillMode = result.getValue('custrecord_ns_psw_polacc_billmode');
                            let intState = result.getValue('custrecord_ns_psw_polacc_state');
                            let intStateChargeType = result.getValue('custrecord_ns_psw_polacc_statechgtype');
                            let intTransGrouping = result.getValue('custrecord_ns_psw_polacc_trxngrouping');
                            let intStateAgencyVendor = result.getValue('custrecord_ns_psw_polacc_statevendor');
                            let intPolicyTranType = result.getValue('custrecord_ns_psw_polacc_typeofpoltrxn');
                            let intItem = result.getValue('custrecord_ns_psw_polacc_invchgitem');
                            let intTransType = result.getValue('custrecord_ns_psw_polacc_trxntype');
                            let intTypeofBill = result.getValue('custrecord_ns_psw_polacc_typeofpoltrxn');
                            let strTypeofBill = result.getText('custrecord_ns_psw_polacc_typeofpoltrxn');
                            let strTransType = result.getText('custrecord_ns_psw_polacc_trxntype');
                            let intDebitAcc = result.getValue('custrecord_ns_psw_polacc_debitaccount');
                            let strDebitAmt = result.getValue('custrecord_ns_psw_polacc_debitamtfield');
                            let intCreditAcc = result.getValue('custrecord_ns_psw_polacc_creditaccount');
                            let strCreditAmt = result.getValue('custrecord_ns_psw_polacc_creditamtfield');

                            let intCreditAmt = strCreditAmt ? evaluateFormula(strCreditAmt, objCurrentRec) : 0;
                            let intDebitAmt = strDebitAmt ? evaluateFormula(strDebitAmt, objCurrentRec) : 0;

                            let intDebitDept = result.getValue('custrecord_ns_psw_polacc_debitdepartment') || null;
                            let intDebitClass = result.getValue('custrecord_ns_psw_polacc_debitclass') || null;
                            let intDebitLoc = result.getValue('custrecord_ns_psw_polacc_debitlocation') || null;
                            let intCreditDept = result.getValue('custrecord_ns_psw_polacc_creditdeprtmt') || null;
                            let intCreditClass = result.getValue('custrecord_ns_psw_polacc_creditclass') || null;
                            let intCreditLoc = result.getValue('custrecord_ns_psw_polacc_creditlocation') || null;

                            log.debug("Credit Formula Evaluation: ", strCreditAmt + " : " + intCreditAmt);
                            log.debug("Debit Formula Evaluation: ", strDebitAmt + " : " + intDebitAmt);
                            log.debug("Details: ",{
                                intDebitDept: intDebitDept,
                                intCreditDept: intCreditDept
                            });

                            if (intDebitAmt || intCreditAmt) {
                                let objPolicyTran = record.create({ type: 'customrecord_ns_psw_policytransactions', isDynamic: true });
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_policyid', intPolicyId);
                                objPolicyTran.setValue('custrecordns_psw_poltrxn_policynumber',intPolicyNo);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_typeofpoltrxn', intPolicyTranType);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_policytrxngrp', intTransGrouping);

                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_policytrxntype', intTransType);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_invchgitem', intItem);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_debitaccount', intDebitAcc);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_debitamount', intDebitAmt);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_creditaccount', intCreditAcc);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_creditamount', intCreditAmt);
                                log.debug("Type of Bill: ",strTypeofBill);
                                log.debug("Transaction type: ",strTransType);
                                if(strTypeofBill == 'Carrier Payment'){
                                    log.debug("Carrier Payment: ",intBillingCompany);
                                    objPolicyTran.setValue('custrecord_ns_psw_poltrxn_vendor', intBillingCompany);
                                }else if(strTransType == 'Bill'){
                                    log.debug("Other Bills",intStateAgencyVendor);
                                    objPolicyTran.setValue('custrecord_ns_psw_poltrxn_vendor', intStateAgencyVendor);
                                }else{
                                    log.debug("Customer Not a Bill",intInsuredCustomer);
                                    objPolicyTran.setValue('custrecord_ns_psw_poltrxn_customer', intInsuredCustomer);
                                }
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_debitdepartmen', intDebitDept);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_debitclass', intDebitClass);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_debitlocation', intDebitLoc);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_creditdeprtmt', intCreditDept);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_creditclass', intCreditClass);
                                objPolicyTran.setValue('custrecord_ns_psw_poltrxn_creditlocation', intCreditLoc);

                                let recId = objPolicyTran.save();
                                log.debug("Policy Transaction Saved: ", recId);
                            }

                        } catch (e) {
                            log.error("Error processing result[" + index + "]", e);
                        }
                    });

                }

            }catch (e) {
                log.error("Error in After Submit: ",e);
            }
        }

        const evaluateFormula = (formula, rec) => {
            try {
                // Remove leading '=' and whitespace
                const expr = formula.replace(/^=/, '').trim();

                // Match all words starting with an alphabet and followed by alphanumerics/underscores
                const fieldRegex = /[a-zA-Z][a-zA-Z0-9_]*/g;
                const matches = expr.match(fieldRegex) || [];

                // Get unique tokens
                const tokens = [...new Set(matches)];


                log.debug("Tokens: ",tokens);
                // Replace field tokens with actual values from the record
                let evaluatedExpr = expr;

                tokens.forEach(fieldId => {
                    let fieldValue = rec.getValue({ fieldId });
                    let fieldType = rec.getField({ fieldId }).type;  // Get the field type

                    log.debug("Field Values", "Field: " + fieldId + " | Value: " + fieldValue + " | Type: " + fieldType);

                    // Check if the field type is 'percent'
                    if (fieldType === 'percent') {
                        // Convert percentage value to decimal (e.g., 30 -> 0.30)
                        fieldValue = parseFloat(fieldValue) / 100;
                    } else {
                        // If fieldValue is a string or number, parse it into a float
                        fieldValue = parseFloat(fieldValue) || 0;
                    }

                    // Replace all occurrences of the fieldId with its value
                    const regex = new RegExp(`\\b${fieldId}\\b`, 'g');
                    evaluatedExpr = evaluatedExpr.replace(regex, fieldValue);
                });

                // Handle numeric literals (e.g., 1, 0, etc.) by ensuring they are treated correctly
                evaluatedExpr = evaluatedExpr.replace(/(\b\d+\b)/g, (match) => {
                    return parseFloat(match);
                });

                // Handle expressions like (1 - custrecord_field2) properly
                // We'll check for cases where "1" is part of an operation like subtraction and ensure it's treated properly.
                evaluatedExpr = evaluatedExpr.replace(/\b1\b/g, '1'); // Ensure we capture the literal "1" (and other literals like 0, etc.)

                // Use Function constructor for safe isolated evaluation
                const result = Function('"use strict"; return (' + evaluatedExpr + ')')();
                log.debug('Evaluated Expression', `${evaluatedExpr} = ${result}`);
                return result;

            } catch (error) {
                log.error('Error evaluating formula', error);
                return 0;
            }
        };



        const getAllResults = (objSearch, maxResults) => {
            try {
                let intPageSize = 1000;
                if (maxResults && maxResults < 1000) {
                    intPageSize = maxResults;
                }

                let objResultSet = objSearch.runPaged({pageSize: intPageSize});
                let arrReturnSearchResults = [];
                let j = objResultSet.pageRanges.length;

                if (j && maxResults) {
                    j = Math.min(Math.ceil(maxResults / intPageSize), j);
                }

                for (let i = 0; i < j; i++) {
                    let objResultSlice = objResultSet.fetch({
                        index: objResultSet.pageRanges[i].index
                    });
                    arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
                }

                return maxResults ? arrReturnSearchResults.slice(0, maxResults) : arrReturnSearchResults;

            } catch (e) {
                log.error({title: 'getAllResults Error', details: e.toString()});
            }
        }


        return { afterSubmit}

    });
