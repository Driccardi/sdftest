/**
 * Copyright NetSuite, Inc. 2013 All rights reserved. 
 * The following code is a demo prototype. Due to time constraints of a demo,
 * the code may contain bugs, may not accurately reflect user requirements 
 * and may not be the best approach. Actual implementation should not reuse 
 * this code without due verification.
 * 
 * This is a suitlet script that creates intercompany equity pick up.
 * 
 * Version    Date            Author           Remarks
 * 1.0        23 Sep 2024     rpagcaliwangan   Initial version.
 * 
 */

var FLD_FLT_HIERARCHY = 'custpage_rp_hierarchy';
var FLD_FLT_START_DATE = 'custpage_rp_start_date';
var FLD_FLT_END_DATE = 'custpage_rp_end_date';

var FLDGRP_FILTER = 'custpage_rp_fldgrp_filter';
var FLDGRP_INFORMATION = 'custpage_rp_fldgrp_info';
var FLDGRP_DATA = 'custpage_rp_fldgrp_data';
var FLD_FORM_MESSAGE = 'custpage_rp_form_message';
var COL_CB_ITEM = 'custrecord_rp_hidden_checkbox';
var SBL_LIST = 'custpage_rp_list';
var BTN_FILTER = 'custpage_rp_filter';
var BTN_RESET = 'custpage_rp_reset';

var FLD_DATE = 'custpage_rp_date';
var FLD_DISTRIBUTION_ACCOUNT = 'custpage_rp_dist_acct';
var FLD_INVFROMPARENT_ACCOUNT = 'custpage_rp_invparent_acct';
var FLD_INVFROMCHILD_ACCOUNT = 'custpage_rp_invchild_acct';
var FLD_INVINCOME_ACCOUNT = 'custpage_rp_invincome_acct';
var FLD_NCI_ACCOUNT = 'custpage_rp_nci_acct';

var ACCOUNT_DISTRIBUTION_ACCOUNT = '158';
var ACCOUNT_INVFROMPARENT_ACCOUNT = '22';
var ACCOUNT_INVFROMCHILD_ACCOUNT = '23';
var ACCOUNT_INVINCOME_ACCOUNT = '96';
var ACCOUNT_NCI_ACCOUNT = '184';

var LIST_HIERARCHY = 'customlist_ns_hierarchy_level';
var HC_LIST_SUBSIDIARIES = ['1','2','3'];

var REC_ENTITYOWNERSHIP = 'customrecord_ns_epue_entityownership';
var FLD_EO_LOWERLEVEL = 'custrecord_eo_lowerlevel'; 
var FLD_EO_UPPERLEVEL = 'custrecord_eo_upperlevel'; 
var FLD_ENTITYOWNERSHIP_OWNERSHIPPER = 'custrecord_eo_ownershippercent'; 
var FLD_EO_LOWERHIERARCHY = 'custrecord_eo_lowerhierarchy'; 

var COL_LIST_HIERARCHY_LEVEL = 'custpage_rp_list_hier_level';
var COL_LIST_SOURCE_ENTITY = 'custpage_rp_source_list_ent';
var COL_LIST_DESTINATION_ENTITY = 'custpage_rp_list_dest_enty';
var COL_LIST_NET_INCOME = 'custpage_rp_list_net_inco';
var COL_LIST_OWNERSHIP_PERC = 'custpage_rp_list_own_perc';
var COL_LIST_AMOUNT = 'custpage_rp_list_amount';

var REC_EPUE = 'customrecord_ns_epu_execution';
var FLD_EPUE_HIERARCHY = 'custrecord_epue_hierarchy';
var FLD_EPUE_PERIOD_ENDED = 'custrecord_epue_periodending';
var FLD_EPUE_PICKUP_RUN = 'custrecord_epue_pickuprun';

var REC_EPU = 'customtransaction_epu';
var FLD_EPU_SOURCE = 'custbody_epu_source';
var FLD_EPU_HIERARCHY = 'custbody_epu_sourcehierarchy';
var FLD_EPU_SRC_LOWER = 'custbody_epu_sourcelowerlevel';
var FLD_EPU_SRC_UPPER = 'custbody_epu_sourceupperlevel';
var FLD_EPU_PARENT_CHILD = 'custbody_epu_parentchild';
var FLD_EPU_OWN_PERC = 'custbody_epu_ownershippercent';

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function loadFormSuitelet(request, response){
    var frmMain;
    var fldHTML;
    var fldHierarchy, fldStartDate, fldEndDate;
    var fldDate, fldDistributionAccount, fldInvFromParentAccount, fldInvFromChildAccount, fldInvIncomeAccount, fldNCIAccount;
    var sblList;
    var sContent = '';
    var oNetIncome;

    var aList = []; 

    var aSuccessEPUE = [];
    var recEPUE, idEPUE, oEPUEIds = {};

    var recEPU, idEPU;

    
    //run upon submission of form
    if(request.getMethod() == 'POST') {

        for(var nCount=1; nCount<(request.getLineItemCount(SBL_LIST)+1); nCount++) {
            if(request.getLineItemValue(SBL_LIST, COL_CB_ITEM, nCount) == 'T') {
                if(parseFloat(request.getLineItemValue(SBL_LIST, COL_LIST_AMOUNT, nCount)) > 0) {
                    if(!oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]) {
                        recEPUE = nlapiCreateRecord(REC_EPUE);
                        recEPUE.setFieldValue(FLD_EPUE_HIERARCHY, request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount));
                        recEPUE.setFieldValue(FLD_EPUE_PERIOD_ENDED, request.getParameter(FLD_FLT_END_DATE));
                        recEPUE.setFieldValue(FLD_EPUE_PICKUP_RUN, request.getParameter(FLD_DATE));

                        idEPUE = nlapiSubmitRecord(recEPUE, true);
                        oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)] = {
                            id: idEPUE,
                            child: {},
                            parent: {},
                        };
                        aSuccessEPUE.push('<a href="'+nlapiResolveURL('RECORD', REC_EPUE, idEPUE)+'" target="_blank">'+nlapiLookupField(REC_EPUE, idEPUE, 'name')+'</a>');
                    }

                    if(!oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['child'][request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount)]) {
                        oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['child'][request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount)] = {
                            amount: 0,
                            source: request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount),
                            destination: request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount),
                            percent: 0
                        };
                    }
                    if(!oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['parent'][request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount)]) {
                        oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['parent'][request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount)] = {
                            amount: 0,
                            source: request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount),
                            destination: request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount),
                            percent: 0
                        };
                    }

                    oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['child'][request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount)].amount += parseFloat(request.getLineItemValue(SBL_LIST, COL_LIST_AMOUNT, nCount));
                    oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['parent'][request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount)].amount += parseFloat(request.getLineItemValue(SBL_LIST, COL_LIST_AMOUNT, nCount));

                    oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['child'][request.getLineItemValue(SBL_LIST, COL_LIST_SOURCE_ENTITY, nCount)].percent += parseFloat(request.getLineItemValue(SBL_LIST, COL_LIST_OWNERSHIP_PERC, nCount).replace('%',''));
                    oEPUEIds[request.getLineItemValue(SBL_LIST, COL_LIST_HIERARCHY_LEVEL, nCount)]['parent'][request.getLineItemValue(SBL_LIST, COL_LIST_DESTINATION_ENTITY, nCount)].percent += parseFloat(request.getLineItemValue(SBL_LIST, COL_LIST_OWNERSHIP_PERC, nCount).replace('%',''));
                }
            }
        }

        nlapiLogExecution('DEBUG','oEPUEIds',JSON.stringify(oEPUEIds));

        for(var nHierarchyLevel in oEPUEIds) {
            if (oEPUEIds.hasOwnProperty(nHierarchyLevel)) {
                var oChild = oEPUEIds[nHierarchyLevel].child;
                for(var idKey in oChild) {
                    if (oChild.hasOwnProperty(idKey)) {
                        recEPU = nlapiCreateRecord(REC_EPU);
                        recEPU.setFieldValue('subsidiary',oChild[idKey].source);
                        recEPU.setFieldValue('trandate',request.getParameter(FLD_DATE));
                        recEPU.setFieldValue('memo','Equity Pickup - ' + request.getParameter(FLD_DATE));
                        recEPU.setFieldValue(FLD_EPU_SOURCE,oEPUEIds[nHierarchyLevel].id);
                        recEPU.setFieldValue(FLD_EPU_HIERARCHY,nHierarchyLevel);
                        recEPU.setFieldValue(FLD_EPU_SRC_LOWER,oChild[idKey].source);
                        recEPU.setFieldValue(FLD_EPU_SRC_UPPER,'');
                        recEPU.setFieldValue(FLD_EPU_PARENT_CHILD, 2); //child
                        recEPU.setFieldValue(FLD_EPU_OWN_PERC,oChild[idKey].percent);

                        recEPU.selectNewLineItem('line');
                        recEPU.setCurrentLineItemValue('line', 'account', request.getParameter(FLD_INVFROMPARENT_ACCOUNT));
                        recEPU.setCurrentLineItemValue('line', 'memo', 'Noncontrolling Interest');
                        recEPU.setCurrentLineItemValue('line', 'debit', oChild[idKey].amount);
                        recEPU.commitLineItem('line');
                        recEPU.selectNewLineItem('line');
                        recEPU.setCurrentLineItemValue('line', 'account', request.getParameter(FLD_NCI_ACCOUNT));
                        recEPU.setCurrentLineItemValue('line', 'memo', 'Noncontrolling Interest');
                        recEPU.setCurrentLineItemValue('line', 'credit', oChild[idKey].amount);
                        recEPU.commitLineItem('line');

                        nlapiSubmitRecord(recEPU);
                    }
                }

                var oParent = oEPUEIds[nHierarchyLevel].parent;
                for(var idKey in oParent) {
                    if (oParent.hasOwnProperty(idKey)) {
                        recEPU = nlapiCreateRecord(REC_EPU);
                        recEPU.setFieldValue('subsidiary',oParent[idKey].destination);
                        recEPU.setFieldValue('trandate',request.getParameter(FLD_DATE));
                        recEPU.setFieldValue('memo','Equity Pickup - ' + request.getParameter(FLD_DATE));
                        recEPU.setFieldValue(FLD_EPU_SOURCE,oEPUEIds[nHierarchyLevel].id);
                        recEPU.setFieldValue(FLD_EPU_HIERARCHY,nHierarchyLevel);
                        recEPU.setFieldValue(FLD_EPU_SRC_LOWER,oParent[idKey].source);
                        recEPU.setFieldValue(FLD_EPU_SRC_UPPER,oParent[idKey].destination);
                        recEPU.setFieldValue(FLD_EPU_PARENT_CHILD, 1); //parent
                        recEPU.setFieldValue(FLD_EPU_OWN_PERC,oParent[idKey].percent);

                        recEPU.selectNewLineItem('line');
                        recEPU.setCurrentLineItemValue('line', 'account', request.getParameter(FLD_INVFROMCHILD_ACCOUNT));
                        recEPU.setCurrentLineItemValue('line', 'memo', 'Income from '+nlapiLookupField('subsidiary',oParent[idKey].source,'name'));
                        recEPU.setCurrentLineItemValue('line', 'debit', oParent[idKey].amount);
                        recEPU.commitLineItem('line');
                        recEPU.selectNewLineItem('line');
                        recEPU.setCurrentLineItemValue('line', 'account', request.getParameter(FLD_INVINCOME_ACCOUNT));
                        recEPU.setCurrentLineItemValue('line', 'memo', 'Income from '+nlapiLookupField('subsidiary',oParent[idKey].source,'name'));
                        recEPU.setCurrentLineItemValue('line', 'credit', oParent[idKey].amount);
                        recEPU.commitLineItem('line');

                        nlapiSubmitRecord(recEPU);
                    }
                }
            }
        }
        
        
        if(aSuccessEPUE.length > 0) {
            //HTML that shows success message in the form
            sContent = '<div id="div__alert" style="width:600px;margin-top:35px;">'+
                        '<div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status">'+
                            '<div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div>'+
                            '<div class="content"><div class="title">Successfully Created</div>'+
                            '<div class="descr">Equity Pick Up Execution have been created: </br>' + 
                            aSuccessEPUE.join('</br>') + 
                            '</div></div>'+
                        '</div>'+
                    '</div>';
        }
    }
    
    //define form structure
    frmMain = nlapiCreateForm('Intercompany Equity Pick Up');
    
    frmMain.addFieldGroup(FLDGRP_FILTER,'Filter',null);
    frmMain.addFieldGroup(FLDGRP_INFORMATION,'Transaction Information',null);
    frmMain.addFieldGroup(FLDGRP_DATA,'Data',null);
    
    fldHTML = frmMain.addField(FLD_FORM_MESSAGE, 'inlinehtml', 'Form Message');

    fldHierarchy = frmMain.addField(FLD_FLT_HIERARCHY,'select','Hierarchy',LIST_HIERARCHY, FLDGRP_FILTER).setMandatory(true);
    fldStartDate = frmMain.addField(FLD_FLT_START_DATE,'date','Start Date', null, FLDGRP_FILTER);
    fldEndDate = frmMain.addField(FLD_FLT_END_DATE,'date','End Date', null, FLDGRP_FILTER);

    fldHierarchy.setDefaultValue(request.getParameter(FLD_FLT_HIERARCHY));
    fldStartDate.setDefaultValue(request.getParameter(FLD_FLT_START_DATE));
    fldEndDate.setDefaultValue(request.getParameter(FLD_FLT_END_DATE));

    fldDate = frmMain.addField(FLD_DATE,'date','Date', null, FLDGRP_INFORMATION).setMandatory(true);
    fldDistributionAccount = frmMain.addField(FLD_DISTRIBUTION_ACCOUNT,'select','Distribution Account','account', FLDGRP_INFORMATION);
    fldInvFromParentAccount = frmMain.addField(FLD_INVFROMPARENT_ACCOUNT,'select','Investment from Parent Account','account', FLDGRP_INFORMATION);
    fldInvFromChildAccount = frmMain.addField(FLD_INVFROMCHILD_ACCOUNT,'select','Investment in Child Account','account', FLDGRP_INFORMATION);
    fldInvIncomeAccount = frmMain.addField(FLD_INVINCOME_ACCOUNT,'select','Investment Income Account','account', FLDGRP_INFORMATION);
    fldNCIAccount = frmMain.addField(FLD_NCI_ACCOUNT,'select','NCI Account','account', FLDGRP_INFORMATION);

    fldDate.setDefaultValue((request.getParameter(FLD_DATE)) ? request.getParameter(FLD_DATE) : '');
    fldDistributionAccount.setDefaultValue((request.getParameter(FLD_DISTRIBUTION_ACCOUNT)) ? request.getParameter(FLD_DISTRIBUTION_ACCOUNT) : ACCOUNT_DISTRIBUTION_ACCOUNT);
    fldInvFromParentAccount.setDefaultValue((request.getParameter(FLD_INVFROMPARENT_ACCOUNT)) ? request.getParameter(FLD_INVFROMPARENT_ACCOUNT) : ACCOUNT_INVFROMPARENT_ACCOUNT);
    fldInvFromChildAccount.setDefaultValue((request.getParameter(FLD_INVFROMCHILD_ACCOUNT)) ? request.getParameter(FLD_INVFROMCHILD_ACCOUNT) : ACCOUNT_INVFROMCHILD_ACCOUNT);
    fldInvIncomeAccount.setDefaultValue((request.getParameter(FLD_INVINCOME_ACCOUNT)) ? request.getParameter(FLD_INVINCOME_ACCOUNT) : ACCOUNT_INVINCOME_ACCOUNT);
    fldNCIAccount.setDefaultValue((request.getParameter(FLD_NCI_ACCOUNT)) ? request.getParameter(FLD_NCI_ACCOUNT) : ACCOUNT_NCI_ACCOUNT);

    frmMain.addSubList(SBL_LIST,'list','List',null),
    frmMain.addSubmitButton('Submit');
    frmMain.addButton(BTN_FILTER, 'Filter', SBL_LIST+'MarkAll(false);jQuery(\'#submitter\').click();'); //uses jQuery preloaded in the page
    frmMain.addButton(BTN_RESET, 'Reset', 'location.reload();');
    
    fldHTML.setDefaultValue(sContent);
    fldHTML.setLayoutType('outsidebelow', 'startcol');
    
    //define sublist structure
    sblList = frmMain.getSubList(SBL_LIST);
    sblList.addMarkAllButtons();
    sblList.addField(COL_CB_ITEM,'checkbox','Select').setDisplayType('entry');
    sblList.addField('internalid','text',null).setDisplayType('hidden');

    sblList.addField(COL_LIST_HIERARCHY_LEVEL,'select','Hierarchy Level',LIST_HIERARCHY).setDisplayType('inline');
    sblList.addField(COL_LIST_SOURCE_ENTITY,'select','Source Entity','subsidiary').setDisplayType('inline');
    sblList.addField(COL_LIST_DESTINATION_ENTITY,'select','Destination Entity','subsidiary').setDisplayType('inline');
    sblList.addField(COL_LIST_NET_INCOME,'currency','Net Income');
    sblList.addField(COL_LIST_OWNERSHIP_PERC,'percent','Ownership Percent');
    sblList.addField(COL_LIST_AMOUNT,'currency','Equity Pick Up Amount');

    oNetIncome = getNetIncome(
        (request.getParameter(FLD_FLT_START_DATE)) ? request.getParameter(FLD_FLT_START_DATE) : null,
        (request.getParameter(FLD_FLT_END_DATE)) ? request.getParameter(FLD_FLT_END_DATE) : null
    );
    aList = getEntityOwnership((request.getParameter(FLD_FLT_HIERARCHY)) ? request.getParameter(FLD_FLT_HIERARCHY) : null);
    
    aList.forEach(function(oItem,nKey) { 
        sblList.setLineItemValue('internalid',(nKey+1),oItem.internal_id);
        sblList.setLineItemValue(COL_LIST_HIERARCHY_LEVEL,(nKey+1),oItem.hierarchy_level_lower_sub);
        sblList.setLineItemValue(COL_LIST_SOURCE_ENTITY,(nKey+1),oItem.lower_level_subsidiary);
        sblList.setLineItemValue(COL_LIST_DESTINATION_ENTITY,(nKey+1),oItem.upper_level_subsidiary);
        sblList.setLineItemValue(COL_LIST_NET_INCOME,(nKey+1),(oNetIncome[oItem.lower_level_subsidiary]) ? oNetIncome[oItem.lower_level_subsidiary] : 0);
        sblList.setLineItemValue(COL_LIST_OWNERSHIP_PERC,(nKey+1),parseFloat(oItem.ownership_percent.replace('%','')));
        sblList.setLineItemValue(COL_LIST_AMOUNT,(nKey+1),(((oNetIncome[oItem.lower_level_subsidiary]) ? oNetIncome[oItem.lower_level_subsidiary] : 0) * (parseFloat(oItem.ownership_percent.replace('%',''))/100)).toFixed(2));
    });
    
    response.writePage(frmMain);
}

/**
 * This gets all the entity ownerships
 *
 * @param {ID} Hierarchy
 * @returns {Array} List of entity ownership
 */
function getEntityOwnership(idHierarchy) 
{ 
    var aColSearch = []; 
    var aFltSearch = []; 
    var aReturn = []; 
    var aResult;


  
    aColSearch.push(new nlobjSearchColumn(FLD_EO_LOWERLEVEL)); 
    aColSearch.push(new nlobjSearchColumn(FLD_EO_UPPERLEVEL)); 
    aColSearch.push(new nlobjSearchColumn(FLD_ENTITYOWNERSHIP_OWNERSHIPPER)); 
    aColSearch.push(new nlobjSearchColumn(FLD_EO_LOWERHIERARCHY).setSort('ASC')); 
    if(idHierarchy)
        aFltSearch.push(new nlobjSearchFilter(FLD_EO_LOWERHIERARCHY,'null','is',idHierarchy)); 
  
    aResult = nlapiSearchRecord(REC_ENTITYOWNERSHIP, null, aFltSearch, aColSearch); 
 
 	if(typeof aResult !== 'undefined' && aResult) {
    	aResult.forEach(function(oItem) { 
        	aReturn.push({ 
            	internal_id: oItem.getId(), 
            	lower_level_subsidiary: oItem.getValue(FLD_EO_LOWERLEVEL), 
            	upper_level_subsidiary: oItem.getValue(FLD_EO_UPPERLEVEL), 
            	ownership_percent: oItem.getValue(FLD_ENTITYOWNERSHIP_OWNERSHIPPER), 
            	hierarchy_level_lower_sub: oItem.getValue(FLD_EO_LOWERHIERARCHY), 
        	}); 
    	}); 
    }
    nlapiLogExecution('DEBUG','aReturn',JSON.stringify(aReturn));
    return aReturn; 
} 

/**
 * This gets all net income for all subsidiaries
 *
 * @param {String} Start Date
 * @param {String} End Date
 * @returns {Object} List of net income
 */
function getNetIncome(sStartDate, sEndDate) 
{ 
    var aColSearch = []; 
    var aFltSearch = []; 
    var oReturn = {}; 
    var aResult; 
  
    aColSearch.push(new nlobjSearchColumn('subsidiary',null,'GROUP')); 
    aColSearch.push(new nlobjSearchColumn('formulacurrency',null,'SUM').setFormula('(case when {accounttype} = \'Income\' then {amount} else 0 end) + (case when {accounttype} = \'Cost of Goods Sold\' then {amount} else 0 end) + (case when {accounttype} = \'Expense\' then {amount} else 0 end) + (case when {accounttype} = \'Other Income\' then {amount} else 0 end) + (case when {accounttype} = \'Other Expense\' then {amount} else 0 end)')); 
  
    aFltSearch.push(new nlobjSearchFilter('accounttype','null','anyof',['Income','COGS','Expense','OthIncome','OthExpense'])); 
    aFltSearch.push(new nlobjSearchFilter('posting','null','is','T')); 
    aFltSearch.push(new nlobjSearchFilter('subsidiary','null','anyof',HC_LIST_SUBSIDIARIES)); 

    if(sStartDate) 
        aFltSearch.push(new nlobjSearchFilter('trandate','null','onorafter',sStartDate)); 
    if(sEndDate)
        aFltSearch.push(new nlobjSearchFilter('trandate','null','onorbefore',sEndDate)); 
 
    aResult = nlapiSearchRecord('transaction', null, aFltSearch, aColSearch); 
 
 	if(typeof aResult !== 'undefined' && aResult) {
    	aResult.forEach(function(oItem) { 
            oReturn[oItem.getValue('subsidiary',null,'GROUP')] = parseFloat(oItem.getValue('formulacurrency',null,'SUM')) || 0;
    	}); 
    }
    nlapiLogExecution('DEBUG','oReturn',JSON.stringify(oReturn));
    return oReturn; 
} 