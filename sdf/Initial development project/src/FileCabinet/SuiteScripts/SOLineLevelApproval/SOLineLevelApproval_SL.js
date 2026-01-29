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
    var PARAM_SO_ID = 'custparam_sd_so_id';
    
    var FLD_SL_SO = 'custpage_sd_sl_so';
    
    var COL_SO_REGULATED_ITEM = 'custcol_sd_regulated_item';
    var COL_SO_LINE_STATUS = 'custcol_sd_line_status';
    var LIST_SO_LINE_STATUS = 'customlist_sd_line_status';
    
    var SBL_ITEMS = 'custpage_sd_sbl_items_sbl';
    var COL_LINE = 'custpage_sd_col_line';
    var COL_ITEM = 'custpage_sd_col_item';
    var COL_RATE = 'custpage_sd_col_rate';
    var COL_QTY = 'custpage_sd_col_qty';
    var COL_AMOUNT = 'custpage_sd_col_amount';
    var COL_LINE_STATUS = 'custpage_sd_col_line_status';
    
    var BTN_APPROVE = 'custpage_sd_line_approve_btn';
    var BTN_REJECT = 'custpage_sd_line_reject_btn';
    
    var HC_IS_REGULATED_ITEM = '1'; //Yes
    var HC_LINE_STATUS_PENDING_APPROVAL = '1';
    var HC_LINE_STATUS_APPROVED = '2';
}

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @return {void} Any output is written via response object
 */
function soLineLevelApprovalSuitelet(request, response) {
    if(request.getMethod() == 'GET') {        
        var frm = nlapiCreateForm('Regulated Items Approval', true);
        
        var fldSO = frm.addField(FLD_SL_SO, 'select', 'Order #', 'transaction').setDisplayType('hidden');
        var idSO = request.getParameter(PARAM_SO_ID);
        fldSO.setDefaultValue(idSO);
        
        var sblItems = frm.addSubList(SBL_ITEMS, 'list', 'Items');
        sblItems.addMarkAllButtons();
        
        sblItems.addField(COL_LINE, 'text', 'Line');
        sblItems.addField(COL_ITEM, 'select', 'Item', 'item').setDisplayType('inline');
        sblItems.addField(COL_RATE, 'currency', 'Rate');
        sblItems.addField(COL_QTY, 'integer', 'Quantity').setDisplayType('inline');
        sblItems.addField(COL_AMOUNT, 'currency', 'Amount');
        sblItems.addField(COL_LINE_STATUS, 'select', 'Line Status', LIST_SO_LINE_STATUS);

        var aItems = getItems(idSO);
        if(aItems){
            for(var nCount = 1; nCount <= aItems.length; nCount++){
                var nArray = nCount - 1;
                
                sblItems.setLineItemValue(COL_LINE, nCount, aItems[nArray].getValue('linesequencenumber'));
                sblItems.setLineItemValue(COL_ITEM, nCount, aItems[nArray].getValue('item'));
                sblItems.setLineItemValue(COL_RATE, nCount, aItems[nArray].getValue('rate'));
                sblItems.setLineItemValue(COL_QTY, nCount, aItems[nArray].getValue('quantity'));
                sblItems.setLineItemValue(COL_AMOUNT, nCount, aItems[nArray].getValue('amount'));
                sblItems.setLineItemValue(COL_LINE_STATUS, nCount, aItems[nArray].getValue(COL_SO_LINE_STATUS));
            }
        }
        
        frm.addSubmitButton('Submit');

        response.writePage(frm);
    }else{
        var nLines = request.getLineItemCount(SBL_ITEMS);
        var idSO = request.getParameter(FLD_SL_SO);
        var recSO = nlapiLoadRecord('salesorder', idSO);
        
        for(var nCount = 1; nCount <= nLines; nCount++){
            var nLineNumber = request.getLineItemValue(SBL_ITEMS, COL_LINE, nCount);
            recSO.selectLineItem('item', nLineNumber);
            
            var idLineStatus = request.getLineItemValue(SBL_ITEMS, COL_LINE_STATUS, nCount);
            recSO.setCurrentLineItemValue('item', COL_SO_LINE_STATUS, idLineStatus);
            
            recSO.commitLineItem('item');
        }
        
        try{
            nlapiSubmitRecord(recSO);
        }catch(ex){
            nlapiLogExecution('DEBUG', 'Error on approval of regulated item on SO #'+idSO, ex.message);
        }

        var aHtml = [];
        aHtml.push('<html>');
        aHtml.push('<head>');
        aHtml.push('<script type="text/javascript">');
        aHtml.push('parent.location.reload();');
        aHtml.push('</script>');
        aHtml.push('</head>');
        aHtml.push('</html>');
        var sHtml = aHtml.join("\n");
        response.write(sHtml);
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
                   new nlobjSearchColumn(COL_SO_LINE_STATUS),];
    return nlapiSearchRecord('transaction', null, aFilter, aColumn);
}