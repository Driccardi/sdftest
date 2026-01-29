/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
    /**
     * @param{record} record
     * @param{redirect} redirect
     * @param{runtime} runtime
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (record, redirect, runtime, search, serverWidget) => {
        function isEmpty(stValue) {
            return ((stValue === 'none' || stValue === '' || stValue === null || stValue === undefined) || (stValue.constructor === Array && stValue.length === 0) ||
                (stValue.constructor === Object && (function(v) { for (var k in v) return false;return true; }) (stValue)));
        }
        function populateSublist(policyID,clientScriptID){
            let populateObj = runtime.getCurrentScript();
            let searchID = populateObj.getParameter('custscript_policy_transactions');

            let recordForm = serverWidget.createForm({
                title: 'Approve Proposed Transactions'
            });
            let policyField = recordForm.addField({
                id:'custpage_policy',
                label:'Policy',
                type:serverWidget.FieldType.SELECT,
                source:'customrecord_ns_psw_policyrecord'
            });
            if(!isEmpty(policyID)){
                policyField.defaultValue = policyID;
            }
            let helpText = recordForm.addField({
                id:'custpage_help_text',
                label:'Note',
                type:serverWidget.FieldType.TEXT
            });
            helpText.defaultValue = "Please enter a Policy to filter the list or select proposed policy transaction(s) below and click 'Submit' to create transactions in NetSuite. Click 'Reset' button to clear filter and reload page.";
            helpText.updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});
            let policySublist = recordForm.addSublist({
                id:'custpage_policy_sublist',
                label:'Policy Transactions',
                type:serverWidget.SublistType.LIST
            });
            policySublist.addMarkAllButtons();
            let transactionCheck = policySublist.addField({
                id:'custpage_select_transaction',
                label:'Select',
                type:serverWidget.FieldType.CHECKBOX
            });
            transactionCheck.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
            policySublist.addField({
                id:'custpage_policy_number',
                label:'Policy',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_trans_type',
                label:'Transaction Type',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_policytype',
                label:'Type of Policy Transaction',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_customer',
                label:'Customer',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_vendor',
                label:'Vendor',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_grouping',
                label:'Transaction Grouping',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_item',
                label:'Invoice/Charge Item',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_credit_amt',
                label:'Credit Amount',
                type:serverWidget.FieldType.CURRENCY
            });
            policySublist.addField({
                id:'custpage_credit_acct',
                label:'Credit Account',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_debit_amt',
                label:'Debit Amount',
                type:serverWidget.FieldType.CURRENCY
            });
            policySublist.addField({
                id:'custpage_debit_acct',
                label:'Debit Account',
                type:serverWidget.FieldType.TEXT
            });
            policySublist.addField({
                id:'custpage_record_id',
                label:'Internal ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_policy_id',
                label:'Policy ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });

            policySublist.addField({
                id:'custpage_item_id',
                label:'Item ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_credacct_id',
                label:'Credit Acct ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_debitacct_id',
                label:'Debit Acct ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_vendor_id',
                label:'Vendor ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_customer_id',
                label:'Customer ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_credit_dept_id',
                label:'Credit Department ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_credit_loc_id',
                label:'Credit Location ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_cred_class_id',
                label:'Credit Class ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_debit_dept_id',
                label:'Debit Department ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_debit_loc_id',
                label:'Debit Location ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_debit_class_id',
                label:'Debit Class ID',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            policySublist.addField({
                id:'custpage_policy_display',
                label:'Policy Display Number',
                type:serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType:serverWidget.FieldDisplayType.HIDDEN
            });
            let recordSearch = search.load({
                type:'customrecord_ns_psw_policytransactions',
                id:searchID
            });
            if(!isEmpty(policyID)){
                let policyFilter = search.createFilter({
                    name:'custrecord_ns_psw_poltrxn_policyid',
                    operator:search.Operator.ANYOF,
                    values:policyID
                });
                recordSearch.filters.push(policyFilter);
            }
            var recordResults = recordSearch.run().getRange({start:0,end:999});
            for(var i=0;i<recordResults.length;i++){
                let result = recordResults[i];
                let recID = result.getValue('internalid');
                let policyNumberID = result.getValue('custrecord_ns_psw_poltrxn_policyid');
                let policyObj = search.lookupFields({
                    type:'customrecord_ns_psw_policyrecord',
                    id:policyNumberID,
                    columns:['custrecord_ns_psw_polrec_policynumber']
                });
                log.debug('policyObj', policyObj)
                let policyNumber = policyObj.custrecord_ns_psw_polrec_policynumber;
                let customerID = result.getValue('custrecord_ns_psw_poltrxn_customer');
                let vendorID = result.getValue('custrecord_ns_psw_poltrxn_vendor');
                let customerName = result.getText('custrecord_ns_psw_poltrxn_customer');
                let vendorName = result.getText('custrecord_ns_psw_poltrxn_vendor');
                let transactionGroup = result.getText('custrecord_ns_psw_poltrxn_policytrxngrp');
                let tranType = result.getText('custrecord_ns_psw_poltrxn_policytrxntype');
                let policyType = result.getText('custrecord_ns_psw_poltrxn_typeofpoltrxn');
                let recItem = result.getValue('custrecord_ns_psw_poltrxn_invchgitem');
                let recItemName = result.getText('custrecord_ns_psw_poltrxn_invchgitem');
                let credAcct = result.getValue('custrecord_ns_psw_poltrxn_creditaccount');
                let credLocation = result.getValue('custrecord_ns_psw_poltrxn_creditlocation');
                let credDepartment = result.getValue('custrecord_ns_psw_poltrxn_creditdeprtmt');
                let credClass = result.getValue('custrecord_ns_psw_poltrxn_creditclass');
                let credAcctNum = result.getText('custrecord_ns_psw_poltrxn_creditaccount');
                let credAmt = result.getValue('custrecord_ns_psw_poltrxn_creditamount');
                let debitAcct = result.getValue('custrecord_ns_psw_poltrxn_debitaccount');
                let debitLocation = result.getValue('custrecord_ns_psw_poltrxn_debitlocation');
                let debitDepartment = result.getValue('custrecord_ns_psw_poltrxn_debitdepartmen');
                let debitClass = result.getValue('custrecord_ns_psw_poltrxn_debitclass');
                let debitAcctNum = result.getText('custrecord_ns_psw_poltrxn_debitaccount');
                let debitAmt = result.getValue('custrecord_ns_psw_poltrxn_debitamount');
                log.debug('itemID', recItem)
                if(tranType==='Invoice'&&isEmpty(debitAcct)){
                    let saleItemObj = search.lookupFields({
                        type:search.Type.ITEM,
                        id:recItem,
                        columns:['incomeaccount']
                    });
                    log.debug('saleItemObj', saleItemObj)
                    if(!isEmpty(saleItemObj.incomeaccount[0])) {
                        var incomeAcctNum = saleItemObj.incomeaccount[0].text;
                        var incomeAcctID = saleItemObj.incomeaccount[0].value;
                    }
                }
                if(tranType==='Bill'&&isEmpty(credAcct)){
                    let purchaseItemObj = search.lookupFields({
                        type:search.Type.ITEM,
                        id:recItem,
                        columns:['expenseaccount']
                    });
                    log.debug('purchaseItemObj', purchaseItemObj)
                    if(!isEmpty(purchaseItemObj.expenseaccount[0])) {
                        var expenseAcctNum = purchaseItemObj.expenseaccount[0].text;
                        var expenseAcctID = purchaseItemObj.expenseaccount[0].value;
                    }
                }
                policySublist.setSublistValue({
                    id:'custpage_policy_number',
                    line:i,
                    value:policyNumberID
                })
                policySublist.setSublistValue({
                    id:'custpage_trans_type',
                    line:i,
                    value:tranType
                });
                policySublist.setSublistValue({
                    id:'custpage_record_id',
                    line:i,
                    value:recID
                });
                if(!isEmpty(customerName)) {
                    policySublist.setSublistValue({
                        id: 'custpage_customer',
                        line: i,
                        value: customerName
                    });
                    policySublist.setSublistValue({
                        id: 'custpage_customer_id',
                        line: i,
                        value: customerID
                    });
                }
                if(!isEmpty(vendorName)) {
                    policySublist.setSublistValue({
                        id: 'custpage_vendor',
                        line: i,
                        value: vendorName
                    });
                    policySublist.setSublistValue({
                        id: 'custpage_vendor_id',
                        line: i,
                        value: vendorID
                    });
                }
                policySublist.setSublistValue({
                    id:'custpage_policytype',
                    line:i,
                    value:policyType
                });
                policySublist.setSublistValue({
                    id:'custpage_grouping',
                    line:i,
                    value:transactionGroup
                });
                policySublist.setSublistValue({
                    id:'custpage_item',
                    line:i,
                    value:recItemName
                });
                if(!isEmpty(credAmt)) {
                    policySublist.setSublistValue({
                        id: 'custpage_credit_amt',
                        line: i,
                        value: credAmt
                    });
                }
                if(!isEmpty(credAcct)) {
                    policySublist.setSublistValue({
                        id: 'custpage_credit_acct',
                        line: i,
                        value: credAcctNum
                    });
                }else if(!isEmpty(expenseAcctNum)){
                    policySublist.setSublistValue({
                        id: 'custpage_credit_acct',
                        line: i,
                        value: expenseAcctNum
                    });
                }
                if(!isEmpty(debitAmt)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debit_amt',
                        line: i,
                        value: debitAmt
                    });
                }
                if(!isEmpty(debitAcctNum)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debit_acct',
                        line: i,
                        value: debitAcctNum
                    });
                }else if(!isEmpty(incomeAcctNum)){
                    policySublist.setSublistValue({
                        id: 'custpage_debit_acct',
                        line: i,
                        value: incomeAcctNum
                    });
                }
                policySublist.setSublistValue({
                    id:'custpage_policy_id',
                    line:i,
                    value:policyNumberID
                });
                policySublist.setSublistValue({
                    id:'custpage_item_id',
                    line:i,
                    value:recItem
                });
                if(!isEmpty(credAcctNum)) {
                    policySublist.setSublistValue({
                        id: 'custpage_credacct_id',
                        line: i,
                        value: credAcct
                    });
                }else if(!isEmpty(expenseAcctID)){
                    policySublist.setSublistValue({
                        id: 'custpage_credacct_id',
                        line: i,
                        value: expenseAcctID
                    });
                }
                if(!isEmpty(debitAcct)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debitacct_id',
                        line: i,
                        value: debitAcct
                    });
                }else if(!isEmpty(incomeAcctID)){
                    policySublist.setSublistValue({
                        id: 'custpage_debitacct_id',
                        line: i,
                        value: incomeAcctID
                    });
                }
                if(!isEmpty(credLocation)) {
                    policySublist.setSublistValue({
                        id: 'custpage_credit_loc_id',
                        line: i,
                        value: credLocation
                    });
                }
                if(!isEmpty(credDepartment)) {
                    policySublist.setSublistValue({
                        id: 'custpage_credit_dept_id',
                        line: i,
                        value: credDepartment
                    });
                }
                if(!isEmpty(credClass)) {
                    policySublist.setSublistValue({
                        id: 'custpage_cred_class_id',
                        line: i,
                        value: credClass
                    });
                }
                if(!isEmpty(debitLocation)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debit_loc_id',
                        line: i,
                        value: debitLocation
                    });
                }
                if(!isEmpty(debitDepartment)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debit_dept_id',
                        line: i,
                        value: debitDepartment
                    });
                }
                if(!isEmpty(debitClass)) {
                    policySublist.setSublistValue({
                        id: 'custpage_debit_class_id',
                        line: i,
                        value: debitClass
                    });
                }
                policySublist.setSublistValue({
                    id: 'custpage_policy_display',
                    line: i,
                    value: policyNumber
                });

            }
            recordForm.clientScriptFileId = clientScriptID;
            recordForm.addButton({
                id: 'custpage_refreshbtn',
                label: 'Reset',
                functionName:'cancelFilter'
            });
            recordForm.addSubmitButton({label: 'Submit'});
            return recordForm;
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const arrErroredPolicies = [];
            const policyID = scriptContext.request.parameters.custparam_policy_id;
            try{
                if(scriptContext.request.method === 'GET'){
                    let scriptObj = runtime.getCurrentScript();
                    let clientScriptID = scriptObj.getParameter('custscript_client_script');
                    let searchID = scriptObj.getParameter('custscript_policy_transactions');
                    let clientMsg = scriptContext.request.parameters.custparam_load_msg;
                    log.debug('Client Script Params', 'Policy: '+policyID+' message: '+clientMsg)

                    var policyForm = serverWidget.createForm({
                        title: 'Approve Proposed Transactions'
                    });
                    let policyField = policyForm.addField({
                        id:'custpage_policy',
                        label:'Policy',
                        type:serverWidget.FieldType.SELECT,
                        source:'customrecord_ns_psw_policyrecord'
                    });
                    let helpText = policyForm.addField({
                        id:'custpage_help_text',
                        label:'Note',
                        type:serverWidget.FieldType.TEXT
                    });
                    helpText.defaultValue = "Please enter a Policy to filter the list or select proposed policy transaction(s) below and click 'Submit' to create transactions in NetSuite. Click 'Reset' button to clear filter and reload page.";
                    helpText.updateDisplayType({displayType:serverWidget.FieldDisplayType.INLINE});
                    let policySublist = policyForm.addSublist({
                        id:'custpage_policy_sublist',
                        label:'Policy Transactions',
                        type:serverWidget.SublistType.LIST
                    });
                    policySublist.addMarkAllButtons();
                    let transactionCheck = policySublist.addField({
                        id:'custpage_select_transaction',
                        label:'Select',
                        type:serverWidget.FieldType.CHECKBOX
                    });
                    transactionCheck.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
                    policySublist.addField({
                        id:'custpage_policy_number',
                        label:'Policy',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_trans_type',
                        label:'Transaction Type',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_policytype',
                        label:'Type of Policy Transaction',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_customer',
                        label:'Customer',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_vendor',
                        label:'Vendor',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_grouping',
                        label:'Transaction Grouping',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_item',
                        label:'Invoice/Charge Item',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_credit_amt',
                        label:'Credit Amount',
                        type:serverWidget.FieldType.CURRENCY
                    });
                    policySublist.addField({
                        id:'custpage_credit_acct',
                        label:'Credit Account',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_debit_amt',
                        label:'Debit Amount',
                        type:serverWidget.FieldType.CURRENCY
                    });
                    policySublist.addField({
                        id:'custpage_debit_acct',
                        label:'Debit Account',
                        type:serverWidget.FieldType.TEXT
                    });
                    policySublist.addField({
                        id:'custpage_record_id',
                        label:'Internal ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_policy_id',
                        label:'Policy ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });

                    policySublist.addField({
                        id:'custpage_item_id',
                        label:'Item ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_credacct_id',
                        label:'Credit Acct ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_debitacct_id',
                        label:'Debit Acct ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_vendor_id',
                        label:'Vendor ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_customer_id',
                        label:'Customer ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_credit_dept_id',
                        label:'Credit Department ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_credit_loc_id',
                        label:'Credit Location ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_cred_class_id',
                        label:'Credit Class ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_debit_dept_id',
                        label:'Debit Department ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_debit_loc_id',
                        label:'Debit Location ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_debit_class_id',
                        label:'Debit Class ID',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    policySublist.addField({
                        id:'custpage_policy_display',
                        label:'Policy Display Number',
                        type:serverWidget.FieldType.TEXT
                    }).updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });
                    let recordSearch = search.load({
                        type:'customrecord_ns_psw_policytransactions',
                        id:searchID
                    });
                    var recordResults = recordSearch.run().getRange({start:0,end:999});
                    log.debug('recordResults', recordResults)
                    for(var i=0;i<recordResults.length;i++){
                        const result = recordResults[i];
                        let recID = result.getValue('internalid');
                        let policyNumberID = result.getValue('custrecord_ns_psw_poltrxn_policyid');
                        let policyObj = search.lookupFields({
                            type:'customrecord_ns_psw_policyrecord',
                            id:policyNumberID,
                            columns:['custrecord_ns_psw_polrec_policynumber']
                        });
                        log.debug('policyObj', policyObj)
                        let policyNumber = policyObj.custrecord_ns_psw_polrec_policynumber;
                        let customerID = result.getValue('custrecord_ns_psw_poltrxn_customer');
                        let vendorID = result.getValue('custrecord_ns_psw_poltrxn_vendor');
                        let customerName = result.getText('custrecord_ns_psw_poltrxn_customer');
                        let vendorName = result.getText('custrecord_ns_psw_poltrxn_vendor');
                        let transactionGroup = result.getText('custrecord_ns_psw_poltrxn_policytrxngrp');
                        let tranType = result.getText('custrecord_ns_psw_poltrxn_policytrxntype');
                        let policyType = result.getText('custrecord_ns_psw_poltrxn_typeofpoltrxn');
                        let recItem = result.getValue('custrecord_ns_psw_poltrxn_invchgitem');
                        let recItemName = result.getText('custrecord_ns_psw_poltrxn_invchgitem');
                        let credAcct = result.getValue('custrecord_ns_psw_poltrxn_creditaccount');
                        let credLocation = result.getValue('custrecord_ns_psw_poltrxn_creditlocation');
                        let credDepartment = result.getValue('custrecord_ns_psw_poltrxn_creditdeprtmt');
                        let credClass = result.getValue('custrecord_ns_psw_poltrxn_creditclass');
                        let credAcctNum = result.getText('custrecord_ns_psw_poltrxn_creditaccount');
                        let credAmt = result.getValue('custrecord_ns_psw_poltrxn_creditamount');
                        let debitAcct = result.getValue('custrecord_ns_psw_poltrxn_debitaccount');
                        let debitLocation = result.getValue('custrecord_ns_psw_poltrxn_debitlocation');
                        let debitDepartment = result.getValue('custrecord_ns_psw_poltrxn_debitdepartmen');
                        let debitClass = result.getValue('custrecord_ns_psw_poltrxn_debitclass');
                        let debitAcctNum = result.getText('custrecord_ns_psw_poltrxn_debitaccount');
                        let debitAmt = result.getValue('custrecord_ns_psw_poltrxn_debitamount');
                        log.debug('itemID', recItem)
                        if(tranType==='Invoice'&&isEmpty(debitAcct)){
                            let saleItemObj = search.lookupFields({
                                type:search.Type.ITEM,
                                id:recItem,
                                columns:['incomeaccount']
                            });
                            log.debug('saleItemObj', saleItemObj)
                            if(!isEmpty(saleItemObj.incomeaccount[0])) {
                                var incomeAcctNum = saleItemObj.incomeaccount[0].text;
                                var incomeAcctID = saleItemObj.incomeaccount[0].value;
                            }
                        }
                        if(tranType==='Bill'&&isEmpty(credAcct)){
                            let purchaseItemObj = search.lookupFields({
                                type:search.Type.ITEM,
                                id:recItem,
                                columns:['expenseaccount']
                            });
                            log.debug('purchaseItemObj', purchaseItemObj)
                            if(!isEmpty(purchaseItemObj.expenseaccount[0])) {
                                var expenseAcctNum = purchaseItemObj.expenseaccount[0].text;
                                var expenseAcctID = purchaseItemObj.expenseaccount[0].value;
                            }
                        }
                        policySublist.setSublistValue({
                            id:'custpage_policy_number',
                            line:i,
                            value:policyNumberID
                        })
                        policySublist.setSublistValue({
                            id:'custpage_trans_type',
                            line:i,
                            value:tranType
                        });
                        policySublist.setSublistValue({
                            id:'custpage_record_id',
                            line:i,
                            value:recID
                        });
                        if(!isEmpty(customerName)) {
                            policySublist.setSublistValue({
                                id: 'custpage_customer',
                                line: i,
                                value: customerName
                            });
                            policySublist.setSublistValue({
                                id: 'custpage_customer_id',
                                line: i,
                                value: customerID
                            });
                        }
                        if(!isEmpty(vendorName)) {
                            policySublist.setSublistValue({
                                id: 'custpage_vendor',
                                line: i,
                                value: vendorName
                            });
                            policySublist.setSublistValue({
                                id: 'custpage_vendor_id',
                                line: i,
                                value: vendorID
                            });
                        }
                        policySublist.setSublistValue({
                            id:'custpage_policytype',
                            line:i,
                            value:policyType
                        });
                        policySublist.setSublistValue({
                            id:'custpage_grouping',
                            line:i,
                            value:transactionGroup
                        });
                        policySublist.setSublistValue({
                            id:'custpage_item',
                            line:i,
                            value:recItemName
                        });
                        if(!isEmpty(credAmt)) {
                            policySublist.setSublistValue({
                                id: 'custpage_credit_amt',
                                line: i,
                                value: credAmt
                            });
                        }
                        if(!isEmpty(credLocation)) {
                            policySublist.setSublistValue({
                                id: 'custpage_credit_loc_id',
                                line: i,
                                value: credLocation
                            });
                        }
                        if(!isEmpty(credDepartment)) {
                            policySublist.setSublistValue({
                                id: 'custpage_credit_dept_id',
                                line: i,
                                value: credDepartment
                            });
                        }
                        if(!isEmpty(credClass)) {
                            policySublist.setSublistValue({
                                id: 'custpage_cred_class_id',
                                line: i,
                                value: credClass
                            });
                        }
                        if(!isEmpty(debitLocation)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debit_loc_id',
                                line: i,
                                value: debitLocation
                            });
                        }
                        if(!isEmpty(debitDepartment)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debit_dept_id',
                                line: i,
                                value: debitDepartment
                            });
                        }
                        if(!isEmpty(debitClass)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debit_class_id',
                                line: i,
                                value: debitClass
                            });
                        }
                        if(!isEmpty(credAcct)) {
                            policySublist.setSublistValue({
                                id: 'custpage_credit_acct',
                                line: i,
                                value: credAcctNum
                            });
                        }else if(!isEmpty(expenseAcctNum)){
                            policySublist.setSublistValue({
                                id: 'custpage_credit_acct',
                                line: i,
                                value: expenseAcctNum
                            });
                        }
                        if(!isEmpty(debitAmt)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debit_amt',
                                line: i,
                                value: debitAmt
                            });
                        }
                        if(!isEmpty(debitAcctNum)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debit_acct',
                                line: i,
                                value: debitAcctNum
                            });
                        }else if(!isEmpty(incomeAcctNum)){
                            policySublist.setSublistValue({
                                id: 'custpage_debit_acct',
                                line: i,
                                value: incomeAcctNum
                            });
                        }
                        policySublist.setSublistValue({
                            id:'custpage_policy_id',
                            line:i,
                            value:policyNumberID
                        });
                        policySublist.setSublistValue({
                            id:'custpage_item_id',
                            line:i,
                            value:recItem
                        });
                        if(!isEmpty(credAcctNum)) {
                            policySublist.setSublistValue({
                                id: 'custpage_credacct_id',
                                line: i,
                                value: credAcct
                            });
                        }else if(!isEmpty(expenseAcctID)){
                            policySublist.setSublistValue({
                                id: 'custpage_credacct_id',
                                line: i,
                                value: expenseAcctID
                            });
                        }
                        if(!isEmpty(debitAcct)) {
                            policySublist.setSublistValue({
                                id: 'custpage_debitacct_id',
                                line: i,
                                value: debitAcct
                            });
                        }else if(!isEmpty(incomeAcctID)){
                            policySublist.setSublistValue({
                                id: 'custpage_debitacct_id',
                                line: i,
                                value: incomeAcctID
                            });
                        }
                        policySublist.setSublistValue({
                            id: 'custpage_policy_display',
                            line: i,
                            value: policyNumber
                        });
                    }
                    /*policyForm.addButton({
                        id: 'custpage_refreshbtn',
                        label: 'Load Policy Transactions',
                        functionName:'loadTransactions'
                    });*/
                    policyForm.addButton({
                        id: 'custpage_refreshbtn',
                        label: 'Reset',
                        functionName:'cancelFilter'
                    });
                    policyForm.clientScriptFileId = clientScriptID;
                    policyForm.addSubmitButton({label: 'Submit'});

                    if(clientMsg === 'Suitelet Reloaded'){
                        policyForm = populateSublist(policyID,clientScriptID);
                    }

                    scriptContext.response.writePage(policyForm);

                }else{
                    log.debug('parameters', scriptContext.request.parameters)
                    log.debug('request', scriptContext.request)

                    let postObj = runtime.getCurrentScript();
                    //let vendorID = postObj.getParameter('custscript_psw_bill_vendor');
                    //let customerID = postObj.getParameter('custscript_psw_inv_customer');
                    //let locationID = postObj.getParameter('custscript_psw_location');
                    let policyLines = scriptContext.request.getLineCount('custpage_policy_sublist');
                    log.debug('policyLines', policyLines)
                    let inv_arr = [];
                    let bill_arr = [];
                    let created_recs = [];
                    let recIDs = [];
                    for(var x=0;x<policyLines;x++){
                        let selectField = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_select_transaction',x);
                        //log.debug('selectField', selectField)
                        if(selectField==='T'){
                            let policyNum = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_policy_display',x);
                            let policyID = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_policy_id',x);
                            log.debug('policyID', policyID)
                            let lineVendor = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_vendor_id',x);
                            let lineCustomer = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_customer_id',x);
                            let transactionType = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_trans_type',x);
                            let tranGroup = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_grouping',x);
                            let itemValue = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_item_id',x);
                            let creditAcct = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_credacct_id',x);
                            let creditLoc = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_credit_loc_id',x);
                            let creditDept = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_credit_dept_id',x);
                            let creditClass = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_cred_class_id',x);
                            let creditAmt = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_credit_amt',x);
                            let debitAcct = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_debitacct_id',x);
                            let debitLoc = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_debit_loc_id',x);
                            let debitDept = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_debit_dept_id',x);
                            let debitClass = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_debit_class_id',x);
                            let debitAmt = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_debit_amt',x);
                            let tranRecID = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_record_id',x);
                            log.debug('sublist fields','tranType: '+transactionType+' customer: '+lineCustomer+' vendor: '+lineVendor+' group: '+tranGroup+' item: '+itemValue+' creditAcct: '+creditAcct+' credAmt: '+creditAmt+' debitAcct: '+debitAcct+' debitAmt: '+debitAmt)
                            if(transactionType==='Invoice'){
                                var invObj = {
                                    customer: lineCustomer,
                                    item: itemValue,
                                    amount: Number(creditAmt),
                                    account: creditAcct,
                                    group: tranGroup,
                                    recid: tranRecID,
                                    policy: policyID,
                                    location:creditLoc,
                                    department:creditDept,
                                    class:creditClass
                                }
                                inv_arr.push(invObj)
                            }
                            if(transactionType==='Bill'){
                                var billObj = {
                                    vendor: lineVendor,
                                    item: itemValue,
                                    amount: Number(debitAmt),
                                    account: debitAcct,
                                    group: tranGroup,
                                    recid: tranRecID,
                                    policy: policyID,
                                    location:debitLoc,
                                    department: debitDept,
                                    class:debitClass
                                }
                                bill_arr.push(billObj);
                            }
                        }
                    }
                    log.debug('inv_arr', inv_arr)
                    let errorsTransaction = []
                    let errorsRecord = []
                    let errorsMessage = []
                    let grouping = []
                    let type = []
                    if(inv_arr.length!==0){
                        let invCount = -1;
                        try{
                            var invoices = {};
                            inv_arr.forEach(function(obj) {
                                if (!invoices[obj.group]) {
                                    invoices[obj.group] = [];
                                }
                                invoices[obj.group].push(obj);
                            });
                            log.debug('inv obj', invoices)
                            // Create an invoice for each group
                            for (var group in invoices) {

                                var invRec = record.create({
                                    type: record.Type.INVOICE,
                                    isDynamic: true
                                });
                                // Set the vendor
                                invRec.setValue({
                                    fieldId: 'entity',
                                    value: invoices[group][0].customer
                                });

                                // Set the location
                                if(!isEmpty(invoices[group][0].location)) {
                                    invRec.setValue({
                                        fieldId: 'location',
                                        value: invoices[group][0].location
                                    });
                                }
                                if(!isEmpty(invoices[group][0].department)) {
                                    invRec.setValue({
                                        fieldId: 'department',
                                        value: invoices[group][0].department
                                    });
                                }
                                if(!isEmpty(invoices[group][0].class)) {
                                    invRec.setValue({
                                        fieldId: 'class',
                                        value: invoices[group][0].class
                                    });
                                }
                                invRec.setValue({
                                    fieldId: 'custbody_ns_psw_tran_pol_id',
                                    value: invoices[group][0].policy
                                });

                                // Add items to the vendor bill
                                invoices[group].forEach(function(item) {
                                    invCount ++;
                                    invRec.selectNewLine({
                                        sublistId: 'item'
                                    });

                                    invRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        value: item.item
                                    });

                                    invRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        value: 1
                                    });
                                    if(!isEmpty(item.location)) {
                                        invRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'location',
                                            value: item.location
                                        });
                                    }
                                    if(!isEmpty(item.department)) {
                                        invRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'department',
                                            value: item.department
                                        });
                                    }
                                    if(!isEmpty(item.class)) {
                                        invRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'class',
                                            value: item.class
                                        });
                                    }
                                    invRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: item.amount
                                    });

                                    invRec.commitLine({
                                        sublistId: 'item'
                                    });
                                    recIDs.push(item.recid);
                                });
                                let invRecID = invRec.save();
                                created_recs.push(invRecID);
                                log.debug('invRecID', invRecID)
                            }


                        }catch(e){
                            log.error('error in invoices', e)
                            let recType = 'Invoice';
                            log.audit('invCount', invCount)
                            if(invCount > -1) {
                                errorsRecord.push(invoices[group][invCount].recid)
                                errorsTransaction.push(invoices[group][invCount].policy)
                                errorsMessage.push(e.message)
                                grouping.push(invoices[group][invCount].group)
                                type.push(recType)
                                log.debug('invoices[group][invCount].recid', invoices[group][invCount].recid)
                                //arrErroredPolicies.push(invoices[group][0].policy)
                                record.submitFields({
                                    type:'customrecord_ns_psw_policytransactions',
                                    id:invoices[group][invCount].recid,
                                    values:{
                                        custrecord_ns_psw_poltrxn_errormsg: e.message
                                    }
                                });
                            }


                        }

                    }
                    log.debug('bill_arr', bill_arr)
                    if(bill_arr.length!==0){
                        var vendorBills = {};
                        var createdBills = {};
                        let billCount = -1;
                        try{
                            bill_arr.forEach(function(obj) {
                                if (!vendorBills[obj.group]) {
                                    vendorBills[obj.group] = [];
                                }
                                vendorBills[obj.group].push(obj);
                            });
                            log.debug('vendorBills', vendorBills)
                            // Create a vendor bill for each group
                            for (var group in vendorBills) {
                                var vendorBill = record.create({
                                    type: record.Type.VENDOR_BILL,
                                    isDynamic: true
                                });

                                // Set the vendor
                                vendorBill.setValue({
                                    fieldId: 'entity',
                                    value: vendorBills[group][0].vendor
                                });
                                // Set the location
                                if(!isEmpty(vendorBills[group][0].location)) {
                                    vendorBill.setValue({
                                        fieldId: 'location',
                                        value: vendorBills[group][0].location
                                    });
                                }
                                if(!isEmpty(vendorBills[group][0].department)) {
                                    vendorBill.setValue({
                                        fieldId: 'department',
                                        value: vendorBills[group][0].department
                                    });
                                }
                                if(!isEmpty(vendorBills[group][0].class)) {
                                    vendorBill.setValue({
                                        fieldId: 'class',
                                        value: vendorBills[group][0].class
                                    });
                                }
                                vendorBill.setValue({
                                    fieldId: 'custbody_ns_psw_tran_pol_id',
                                    value: vendorBills[group][0].policy
                                });
                                // Add items to the vendor bill
                                log.debug('vendorBills[group]', vendorBills[group])

                                vendorBills[group].forEach(function (item) {
                                    billCount ++;
                                    vendorBill.selectNewLine({
                                        sublistId: 'item'
                                    });
                                    vendorBill.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        value: item.item
                                    });

                                    vendorBill.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        value: 1
                                    });
                                    if(!isEmpty(item.location)) {
                                        vendorBill.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'location',
                                            value: item.location
                                        });
                                    }
                                    if(!isEmpty(item.department)) {
                                        vendorBill.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'department',
                                            value: item.department
                                        });
                                    }
                                    if(!isEmpty(item.class)) {
                                        vendorBill.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'class',
                                            value: item.class
                                        });
                                    }
                                    vendorBill.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        value: item.amount
                                    });

                                    vendorBill.commitLine({
                                        sublistId: 'item'
                                    });
                                    recIDs.push(item.recid);
                                });

                                let billRecID = vendorBill.save();
                                createdBills[group] = billRecID;
                                created_recs.push(billRecID);
                                log.debug('Vendor Bill Created', 'Vendor Bill ID: ' + billRecID + ' for Group: ' + group);
                            }


                        }catch(e){
                            log.error('error in vendor bills', e)
                            let recType = 'Bill';
                            log.audit('billCount', billCount)
                            if(billCount >-1) {
                                errorsRecord.push(vendorBills[group][billCount].recid)
                                errorsTransaction.push(vendorBills[group][billCount].policy)
                                errorsMessage.push(e.message)
                                grouping.push(vendorBills[group][billCount].group)
                                type.push(recType)
                                //arrErroredPolicies.push(vendorBills[group][0].policy)
                                log.debug('vendorBills[group][billCount].recid', vendorBills[group][billCount].recid)
                                record.submitFields({
                                    type: 'customrecord_ns_psw_policytransactions',
                                    id: vendorBills[group][billCount].recid,
                                    values: {
                                        custrecord_ns_psw_poltrxn_errormsg: e.message
                                    }
                                });
                            }
                        }

                    }

                    log.debug('created_recs', created_recs)
                    if(errorsRecord.length===0) {
                        if (created_recs.length !== 0) {
                            if(recIDs.length!==0) {
                                for (var r = 0; r < recIDs.length; r++) {
                                    record.submitFields({
                                        type: 'customrecord_ns_psw_policytransactions',
                                        id: recIDs[r],
                                        values: {
                                            custrecord_ns_psw_poltrxn_processedflag: true,
                                            custrecord_ns_psw_poltrxn_errormsg: ""
                                        }
                                    });
                                }
                            }

                            const form = serverWidget.createForm({title: 'Generated Transactions'});
                            const confirmField = form.addField({
                                id: 'custpage_msg_txt',
                                type: serverWidget.FieldType.LONGTEXT,
                                label: 'Message'
                            });
                            confirmField.defaultValue = 'Please see the generated transactions below.';
                            confirmField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.INLINE
                            });
                            let trxnSublist = form.addSublist({
                                id: 'custpage_policy_sublist',
                                label: 'Transactions',
                                type: serverWidget.SublistType.LIST
                            });
                            trxnSublist.addField({
                                id: 'custpage_rec_type',
                                label: 'Record Type',
                                type: serverWidget.FieldType.TEXT
                            });
                            trxnSublist.addField({
                                id: 'custpage_trxn_number',
                                label: 'Transaction Number',
                                type: serverWidget.FieldType.TEXT
                            });
                            trxnSublist.addField({
                                id: 'custpage_doc_number',
                                label: 'Document Number',
                                type: serverWidget.FieldType.TEXT
                            });
                            trxnSublist.addField({
                                id: 'custpage_entity_name',
                                label: 'Entity',
                                type: serverWidget.FieldType.TEXT
                            });
                            trxnSublist.addField({
                                id: 'custpage_trxn_amt',
                                label: 'Amount',
                                type: serverWidget.FieldType.CURRENCY
                            });
                            let trxnSearchID = postObj.getParameter('custscript_created_trxns_ss');
                            let trxnSearch = search.load({
                                type: search.Type.TRANSACTION,
                                id: trxnSearchID
                            });
                            let idFilter = search.createFilter({
                                name: 'internalid',
                                operator: search.Operator.ANYOF,
                                values: created_recs
                            });
                            trxnSearch.filters.push(idFilter);
                            let trxnResults = trxnSearch.run().getRange({start: 0, end: 999});
                            if (trxnResults.length !== 0) {
                                for (var n = 0; n < trxnResults.length; n++) {
                                    let tranID = trxnResults[n].getValue('tranid');
                                    let tranNum = trxnResults[n].getValue('transactionnumber');
                                    let recType = trxnResults[n].getText('type');
                                    let entityName = trxnResults[n].getText('entity');
                                    let recAmt = trxnResults[n].getValue('amount');
                                    trxnSublist.setSublistValue({
                                        id: 'custpage_trxn_number',
                                        line: n,
                                        value: tranNum
                                    });
                                    if (!isEmpty(tranID)) {
                                        trxnSublist.setSublistValue({
                                            id: 'custpage_doc_number',
                                            line: n,
                                            value: tranID
                                        });
                                    }
                                    trxnSublist.setSublistValue({
                                        id: 'custpage_rec_type',
                                        line: n,
                                        value: recType
                                    });
                                    trxnSublist.setSublistValue({
                                        id: 'custpage_entity_name',
                                        line: n,
                                        value: entityName
                                    });
                                    trxnSublist.setSublistValue({
                                        id: 'custpage_trxn_amt',
                                        line: n,
                                        value: recAmt
                                    });
                                }
                                scriptContext.response.writePage(form);
                            }
                        }else{
                            const form = serverWidget.createForm({ title: 'No Transactions were created in NetSuite' });

                            const confirmField = form.addField({
                                id: 'custpage_msg_txt',
                                type: serverWidget.FieldType.LONGTEXT,
                                label: 'Message'
                            });
                            confirmField.defaultValue = 'Please make sure the necessary data is populated on your Policy Transaction records and try again.';
                            confirmField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.INLINE
                            });
                            scriptContext.response.writePage(form);
                        }
                    }else if(errorsRecord.length!==0&&created_recs.length!==0){
                        if(recIDs.length!==0) {
                            for (var r = 0; r < recIDs.length; r++) {
                                record.submitFields({
                                    type: 'customrecord_ns_psw_policytransactions',
                                    id: recIDs[r],
                                    values: {
                                        custrecord_ns_psw_poltrxn_processedflag: true,
                                        custrecord_ns_psw_poltrxn_errormsg: ""
                                    }
                                });
                            }
                        }
                        const form = serverWidget.createForm({ title: 'Please see transactions below' });

                        const errorField = form.addField({
                            id: 'custpage_error_txt',
                            type: serverWidget.FieldType.LONGTEXT,
                            label: 'Error'
                        });

                        errorField.defaultValue = 'Please see unsuccessful and successfully created transactions below <br >';
                        errorField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        let errorSublist = form.addSublist({
                            id: "custpage_error_sublist",
                            label: "Failed Transactions",
                            type: serverWidget.SublistType.LIST,
                        });
                        errorSublist.addField({
                            id: "custpage_policyrec",
                            label: "Policy Record ID",
                            type: serverWidget.FieldType.TEXT,
                        });
                        errorSublist.addField({
                            id: "custpage_policy",
                            label: "Policy ID",
                            type: serverWidget.FieldType.TEXT,
                        });
                        errorSublist.addField({
                            id: "custpage_record_type",
                            label: "Record Type",
                            type: serverWidget.FieldType.TEXT,
                        });
                        errorSublist.addField({
                            id: "custpage_grouping",
                            label: "Grouping",
                            type: serverWidget.FieldType.TEXT,
                        });
                        errorSublist.addField({
                            id: "custpage_errormessage",
                            label: "Error Message",
                            type: serverWidget.FieldType.TEXT,
                        });
                        for(let intCount = 0; intCount<errorsTransaction.length; intCount++){
                            errorSublist.setSublistValue({
                                id: "custpage_policyrec",
                                line: intCount,
                                value: errorsRecord[intCount],
                            });
                            errorSublist.setSublistValue({
                                id: "custpage_policy",
                                line: intCount,
                                value: errorsTransaction[intCount],
                            });
                            errorSublist.setSublistValue({
                                id: "custpage_record_type",
                                line: intCount,
                                value: type[intCount],
                            });
                            errorSublist.setSublistValue({
                                id: "custpage_grouping",
                                line: intCount,
                                value: grouping[intCount],
                            });
                            errorSublist.setSublistValue({
                                id: "custpage_errormessage",
                                line: intCount,
                                value: errorsMessage[intCount],
                            });

                        }

                        let createdSublist = form.addSublist({
                            id: 'custpage_created_sublist',
                            label: 'Created Transactions',
                            type: serverWidget.SublistType.LIST
                        });
                        form.insertSublist({
                            sublist : createdSublist,
                            nextsublist : 'custpage_error_sublist'
                        });
                        createdSublist.addField({
                            id: 'custpage_rec_type',
                            label: 'Record Type',
                            type: serverWidget.FieldType.TEXT
                        });
                        createdSublist.addField({
                            id: 'custpage_trxn_number',
                            label: 'Transaction Number',
                            type: serverWidget.FieldType.TEXT
                        });
                        createdSublist.addField({
                            id: 'custpage_doc_number',
                            label: 'Document Number',
                            type: serverWidget.FieldType.TEXT
                        });
                        createdSublist.addField({
                            id: 'custpage_entity_name',
                            label: 'Entity',
                            type: serverWidget.FieldType.TEXT
                        });
                        createdSublist.addField({
                            id: 'custpage_trxn_amt',
                            label: 'Amount',
                            type: serverWidget.FieldType.CURRENCY
                        });
                        let trxnSearchID = postObj.getParameter('custscript_created_trxns_ss');
                        let trxnSearch = search.load({
                            type: search.Type.TRANSACTION,
                            id: trxnSearchID
                        });
                        let idFilter = search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: created_recs
                        });
                        trxnSearch.filters.push(idFilter);
                        let trxnResults = trxnSearch.run().getRange({start: 0, end: 999});
                        if (trxnResults.length !== 0) {
                            for (var n = 0; n < trxnResults.length; n++) {
                                let tranID = trxnResults[n].getValue('tranid');
                                let tranNum = trxnResults[n].getValue('transactionnumber');
                                let recType = trxnResults[n].getText('type');
                                let entityName = trxnResults[n].getText('entity');
                                let recAmt = trxnResults[n].getValue('amount');
                                createdSublist.setSublistValue({
                                    id: 'custpage_trxn_number',
                                    line: n,
                                    value: tranNum
                                });
                                if (!isEmpty(tranID)) {
                                    createdSublist.setSublistValue({
                                        id: 'custpage_doc_number',
                                        line: n,
                                        value: tranID
                                    });
                                }
                                createdSublist.setSublistValue({
                                    id: 'custpage_rec_type',
                                    line: n,
                                    value: recType
                                });
                                createdSublist.setSublistValue({
                                    id: 'custpage_entity_name',
                                    line: n,
                                    value: entityName
                                });
                                createdSublist.setSublistValue({
                                    id: 'custpage_trxn_amt',
                                    line: n,
                                    value: recAmt
                                });
                            }
                        }
                        scriptContext.response.writePage(form);
                    }else{
                        const form = serverWidget.createForm({title: 'Error Generating Transactions in NetSuite'});

                        const confirmField = form.addField({
                            id: 'custpage_error_txt',
                            type: serverWidget.FieldType.LONGTEXT,
                            label: 'Error'
                        });

                        confirmField.defaultValue = 'Please try to go back, refresh the page, and reselect! <br >';
                        confirmField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });

                        let trxnSublist = form.addSublist({
                            id: "custpage_policy_sublist",
                            label: "Policy Records",
                            type: serverWidget.SublistType.LIST,
                        });
                        trxnSublist.addField({
                            id: "custpage_policyrec",
                            label: "Policy Record ID",
                            type: serverWidget.FieldType.TEXT,
                        });
                        trxnSublist.addField({
                            id: "custpage_policy",
                            label: "Policy ID",
                            type: serverWidget.FieldType.TEXT,
                        });
                        trxnSublist.addField({
                            id: "custpage_rec_type",
                            label: "Record Type",
                            type: serverWidget.FieldType.TEXT,
                        });
                        trxnSublist.addField({
                            id: "custpage_grouping",
                            label: "Grouping",
                            type: serverWidget.FieldType.TEXT,
                        });
                        trxnSublist.addField({
                            id: "custpage_errormessage",
                            label: "Error Message",
                            type: serverWidget.FieldType.TEXT,
                        });
                        for(let intCount = 0; intCount<errorsTransaction.length; intCount++){
                            trxnSublist.setSublistValue({
                                id: "custpage_policyrec",
                                line: intCount,
                                value: errorsRecord[intCount],
                            });
                            trxnSublist.setSublistValue({
                                id: "custpage_policy",
                                line: intCount,
                                value: errorsTransaction[intCount],
                            });
                            trxnSublist.setSublistValue({
                                id: "custpage_rec_type",
                                line: intCount,
                                value: type[intCount],
                            });
                            trxnSublist.setSublistValue({
                                id: "custpage_grouping",
                                line: intCount,
                                value: grouping[intCount],
                            });
                            trxnSublist.setSublistValue({
                                id: "custpage_errormessage",
                                line: intCount,
                                value: errorsMessage[intCount],
                            });

                        }
                        scriptContext.response.writePage(form);
                    }
                }
            }catch(error){
                log.debug('arrErroredPolicies', arrErroredPolicies)
                log.error('error', error)
                if(arrErroredPolicies.length > 0){
                    log.error('Error', error)
                    let policyLines = scriptContext.request.getLineCount('custpage_policy_sublist');
                    log.debug('policyLines Error', policyLines)

                    let arrErrorsTransaction = []
                    let arrErrorsRecord = []
                    let arrErrorsMessage = []
                    let arrGrouping = []
                    let arrType = []
                    for(var e=0;e<policyLines;e++){
                        let selectField = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_select_transaction',e);
                        //log.debug('selectField', selectField)
                        if(selectField==="T") {
                            let transRecID = scriptContext.request.getSublistValue('custpage_policy_sublist', 'custpage_record_id', e);
                            let transRecNumber = scriptContext.request.getSublistValue('custpage_policy_sublist', 'custpage_policy_id', e);
                            let transRecGrouping = scriptContext.request.getSublistValue('custpage_policy_sublist', 'custpage_grouping', e);
                            let transType = scriptContext.request.getSublistValue('custpage_policy_sublist','custpage_policytype',e)
                            log.debug('error rec id', transRecID)

                            if(arrErroredPolicies.includes[transRecID]){
                                arrErrorsRecord.push(transRecID)
                                arrErrorsTransaction.push(transRecNumber)
                                arrErrorsMessage.push(error.message)
                                arrGrouping.push(transRecGrouping)
                                arrType.push(transType)
                                record.submitFields({
                                    type:'customrecord_ns_psw_policytransactions',
                                    id:transRecID,
                                    values:{
                                        custrecord_ns_psw_poltrxn_errormsg: error.message
                                    }
                                });

                            }


                        }
                    }
                    const form = serverWidget.createForm({ title: 'Error Generating Transactions in NetSuite' });

                    const confirmField = form.addField({
                        id: 'custpage_error_txt',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'Error'
                    });

                    confirmField.defaultValue = 'Please try to go back, refresh the page, and reselect! <br >';
                    confirmField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });
                    // scriptContext.response.writePage(form);

                    let trxnSublist = form.addSublist({
                        id: "custpage_policy_sublist",
                        label: "Policy Records",
                        type: serverWidget.SublistType.LIST,
                    });
                    trxnSublist.addField({
                        id: "custpage_policyrec",
                        label: "Policy Record ID",
                        type: serverWidget.FieldType.TEXT,
                    });
                    trxnSublist.addField({
                        id: "custpage_policy",
                        label: "Policy ID",
                        type: serverWidget.FieldType.TEXT,
                    });
                    trxnSublist.addField({
                        id: "custpage_rec_type",
                        label: "Record Type",
                        type: serverWidget.FieldType.TEXT,
                    });
                    trxnSublist.addField({
                        id: "custpage_grouping",
                        label: "Grouping",
                        type: serverWidget.FieldType.TEXT,
                    });
                    trxnSublist.addField({
                        id: "custpage_errormessage",
                        label: "Error Message",
                        type: serverWidget.FieldType.TEXT,
                    });

                    for(let intCount = 0; intCount<arrErrorsTransaction.length; intCount++){
                        trxnSublist.setSublistValue({
                            id: "custpage_policyrec",
                            line: intCount,
                            value: arrErrorsRecord[intCount],
                        });
                        trxnSublist.setSublistValue({
                            id: "custpage_policy",
                            line: intCount,
                            value: arrErrorsTransaction[intCount],
                        });
                        trxnSublist.setSublistValue({
                            id: "custpage_rec_type",
                            line: intCount,
                            value: arrType[intCount],
                        });
                        trxnSublist.setSublistValue({
                            id: "custpage_grouping",
                            line: intCount,
                            value: arrGrouping[intCount],
                        });
                        trxnSublist.setSublistValue({
                            id: "custpage_errormessage",
                            line: intCount,
                            value: arrErrorsMessage[intCount],
                        });

                    }

                    scriptContext.response.writePage(form);
                }
            }
        }

        return {onRequest}

    });
