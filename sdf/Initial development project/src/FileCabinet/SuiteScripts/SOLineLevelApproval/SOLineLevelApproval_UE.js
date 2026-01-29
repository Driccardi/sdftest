/**
 * Copyright NetSuite, Inc. 2025 All rights reserved. 
 * The following code is a demo prototype. Due to time constraints of a demo,
 * the code may contain bugs, may not accurately reflect user requirements 
 * and may not be the best approach. Actual implementation should not reuse 
 * this code without due verification.
 * 
 * (Module description here. Whole header length should not exceed 
 * 100 characters in width. Use another line if needed.)
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Feb 2025     SDEGUZMA
 * 
 */
/*
 * Task: SD140618
 * TSTDRV: Stairway for Retail US v2024.2 01.28 (TD2982761)
 */ 
{
    var SCRIPT_SL = 'customscript_sd_so_line_approval_sl';
    var DEPLOY_SL = 'customdeploy_sd_so_line_approval_sl';
    
    var BTN_APPROVE_ITEMS = 'custpage_sd_line_approval_btn';
    
    var PARAM_SO_ID = 'custparam_sd_so_id';
    
    var HC_REC_DIV_NAME = 'div_po_fields';
    var HC_REC_POPUP_WIDTH = 900;
    var HC_REC_POPUP_HEIGHT = 500;
    
    var HC_IS_REGULATED_ITEM = '1'; //Yes
    var HC_IS_NOT_REGULATED_ITEM = '2'; //No
    var HC_LINE_STATUS_PENDING_APPROVAL = '1';
    var HC_LINE_STATUS_APPROVED = '2';
    var HC_ADMINISTRATOR = 3;
    
    var COL_SO_REGULATED_ITEM = 'custcol_sd_regulated_item';
    var COL_SO_LINE_STATUS = 'custcol_sd_line_status';
    
    var FLD_SO_SUPERVISOR = 'custbody_sd_sales_rep_supervisor';
}

/**
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @return {void}
 */
function soLineLevelApprovalBeforeLoad(type, form, request) {
    if (type == 'view') {
        var idSO = nlapiGetRecordId();
        
        var sURLApproval = nlapiResolveURL('SUITELET', SCRIPT_SL, DEPLOY_SL);
        sURLApproval += '&'+PARAM_SO_ID+'='+idSO;
        
        var sScriptApproval = 'nlExtOpenWindow(\'' + sURLApproval + '&' + '\', \'' + HC_REC_DIV_NAME + '\', '
        + HC_REC_POPUP_WIDTH  + ', ' + HC_REC_POPUP_HEIGHT + ', this, true, \'Regulated Items Approval\', null)';
        
        var aItems = getItems(idSO);
        var idSupervisor = nlapiGetFieldValue(FLD_SO_SUPERVISOR);
        
        if((aItems && aItems.length > 0) && 
           (nlapiGetContext().getRole() == HC_ADMINISTRATOR) || nlapiGetContext().getUser() == idSupervisor){
            form.addButton(BTN_APPROVE_ITEMS, 'Regulated Items Approval', sScriptApproval);
        }
    }
}

/**
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @return {void}
 */
function approveNonRegulatedItemsBeforeSubmit(type) {
    if (type == 'create' || type == 'edit') {
        var nLines = nlapiGetLineItemCount('item');
        
        for(var nCount = 1; nCount <= nLines; nCount++){
            var idRegulatedItem = nlapiGetLineItemValue('item', COL_SO_REGULATED_ITEM, nCount);
            
            if(idRegulatedItem == HC_IS_NOT_REGULATED_ITEM){
                nlapiSelectLineItem('item', nCount);
                nlapiSetCurrentLineItemValue('item', COL_SO_LINE_STATUS, HC_LINE_STATUS_APPROVED);
                nlapiCommitLineItem('item');
            }
        }
    }
}

function getItems(idSO){
    var aFilter = [new nlobjSearchFilter('type','null','anyof',['SalesOrd']),
                   new nlobjSearchFilter('mainline','null','is','F'),
                   new nlobjSearchFilter('taxline','null','is','F'),
                   new nlobjSearchFilter('cogs','null','is','F'),
                   new nlobjSearchFilter('shipping','null','is','F'),
                   new nlobjSearchFilter('internalid','null','is',idSO),
                   new nlobjSearchFilter('shiprecvstatusline','null','is','F'),
                   new nlobjSearchFilter(COL_SO_REGULATED_ITEM,'null','is',HC_IS_REGULATED_ITEM),
                   new nlobjSearchFilter(COL_SO_LINE_STATUS,'null','is',HC_LINE_STATUS_PENDING_APPROVAL)];
    var aColumn = [new nlobjSearchColumn('linesequencenumber'),
                   new nlobjSearchColumn('item'),
                   new nlobjSearchColumn('rate'),
                   new nlobjSearchColumn('quantity'),
                   new nlobjSearchColumn('amount'),
                   new nlobjSearchColumn('location'),
                   new nlobjSearchColumn(COL_SO_LINE_STATUS)];
    return nlapiSearchRecord('transaction', null, aFilter, aColumn);
}