/**
 * Copyright (c) 1998-2020 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 *
 * * Version	Date			Author				Remarks
 * 	 1.00		10 Nov 2022     Shalah Saxena		Initial version
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Owner Shalabh Saxena
 */
 define(['N/currentRecord','N/runtime', 'N/url'], 
 
 function (currentRecord, runtime, url) {
 
    function pageInit(context) {
        
        var currentRecord = context.currentRecord;
    }

    function isEmpty(fieldValue) {
        if (typeof fieldValue == "object") {
            if (Object.keys(fieldValue).length > 0) {
                return false;
            } else {
                return true;
            }
        }
        return (fieldValue === '' || fieldValue === null || fieldValue === undefined || fieldValue == {} || fieldValue == "{}");
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return (Object.getOwnPropertyNames(obj).length === 0);
        } else {
            var k;
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function getFitmentSearchPopup(){

        try{
                var currRecord = currentRecord.get(),
                    transactionRecordItemQtyObj = new Object(),
                    fitmentSearchParams = new Object(),
                    fitmentSearchSuitelet = new Object();

                if (currRecord.getValue({fieldId: 'type'}) === 'salesord'){

                    if (!isEmpty(currRecord.getValue({fieldId: 'id'}))){

                        return true;
                    }
                    else{
                            for (var i = 0; i < currRecord.getLineCount({sublistId: 'item'}) ; i++) {
            
                                currRecord.selectLine({
                                    sublistId: 'item',
                                    line: i
                                });

                                if (currRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype'}) == 'InvtPart'){

                                    transactionRecordItemQtyObj[currRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item'})] = currRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity'});
                                }
                            }

                            fitmentSearchParams = {
                                        transactionRecordItemQtyObj: JSON.stringify(transactionRecordItemQtyObj) || '',
                                        fitmentSearchFieldOrderRetStr: JSON.stringify(currRecord.getValue({fieldId: 'custbody_nsts_fitment_search_criteria'})) || '',
                                        recordType : currRecord.getValue({fieldId: 'type'}) || '',
                                        executeFitmentSearch : false
                            }
                    }
                }
                else{
                        return true;
                }
        
                if (!isObjectEmpty(fitmentSearchParams)){

                    var leftPos, topPos, heightPos, widthPos;

                    heightPos = (screen.availHeight) * (60/100);
                    widthPos = (screen.availWidth) * (70/100);
                    leftPos = (screen.availWidth - widthPos) / 2 ;
                    topPos = (screen.availHeight - heightPos) / 2;
    
                    var params = 'height=' + heightPos + ', width=' + widthPos;
                        params += ',left=' + leftPos + ', top=' + topPos;
                        params += ', status=no';
                        params += ' ,toolbar=no';
                        params += ' ,menubar=no';
                        params += ', resizable=yes';
                        params += ' ,scrollbars=no';
                        params += ' ,location=no';
                        params += ' ,directories=no';

                        fitmentSearchSuitelet = url.resolveScript({
                            scriptId:'customscript_nsts_oop_sl_fitment_search',
                            deploymentId:'customdeploy_nsts_oop_sl_fitment_search',
                            returnExternalUrl: false,
                            params: fitmentSearchParams
                        });

                        window.onbeforeunload = null;

                        window.open(fitmentSearchSuitelet,"Fitment Search", params);        
                }

                return true;
            }
            catch(error){
                log.error('error',error);
            }
    }


    return {
        pageInit: pageInit,
        getFitmentSearchPopup : getFitmentSearchPopup
    }
});