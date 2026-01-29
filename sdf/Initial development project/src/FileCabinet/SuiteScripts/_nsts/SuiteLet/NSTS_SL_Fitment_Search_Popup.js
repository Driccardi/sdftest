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
 * 	 1.00		10 Jan 2023     Shalabh Saxena		Initial version
 */

/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/runtime','N/search','N/redirect', 'N/runtime','N/record','N/error', '../LibraryFiles/NSTS_Fitment_Search_Library.js'],

function(serverWidget, Runtime, search, redirect, runtime,record,error, fitmentsearchlibrary) {

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

       /**
        * Definition of the Suitelet script trigger point.
        *
        * @param {Object}
        *            context
        * @param {ServerRequest}
        *            context.request - Encapsulation of the incoming
        *            request
        * @param {ServerResponse}
        *            context.response - Encapsulation of the Suitelet
        *            response
        * @Since 2015.2
        */
       function onRequest(context){

           try{
                   if (context.request.method == "GET") {

                       var fitmentSearchFields, 
                           fitmentSearchFieldOrderObj = new Object, 
                           fitmentSearchFieldOrderReturnObj = new Object,
                           fitmentSearchTranRecordItemQtyObj = new Object;

                       var form = serverWidget.createForm({title: "Fitment Search" , hideNavBar: true}),
                           recordType = new String,
                           fitmentSearchFields = new Object;

                       form.clientScriptModulePath = '../Client Side/NSTS_CS_Fitment_Search_Popup.js';

                       form.addFieldGroup({ id: 'custpage_nsts_fs_container', label: 'Fitment Search' });

                       var fitmentSearchSourceRecordType = form.addField ({id : 'custpage_nsts_fs_sourcerectype' ,type : serverWidget.FieldType.TEXT ,label : 'Fitment Search Source Record Type' ,container : 'custpage_nsts_fs_container'} );
                           fitmentSearchSourceRecordType.updateDisplayType ({displayType : serverWidget.FieldDisplayType.HIDDEN });

                       if(context.request.parameters.hasOwnProperty('recordType')){

                               recordType = decodeURIComponent(context.request.parameters.recordType) || '';
   
                               fitmentSearchSourceRecordType.defaultValue = decodeURIComponent(context.request.parameters.recordType) || '';
                       }

                       if (!isEmpty(recordType)){

                                var fitmentSearchFieldOrder = form.addField ({id : 'custpage_nsts_fitmentsearch_fieldorder' ,type : serverWidget.FieldType.LONGTEXT ,label : 'Fitment Search Field Order' ,container : 'custpage_nsts_fs_container'} );
                                   fitmentSearchFieldOrder.updateDisplayType ({displayType : serverWidget.FieldDisplayType.HIDDEN });
       
                               var transactionItemQuantity = form.addField ({id : 'custpage_nsts_fs_itemqty' ,type : serverWidget.FieldType.LONGTEXT ,label : 'Transaction Item Quantity' ,container : 'custpage_nsts_fs_container'} );
                                   transactionItemQuantity.updateDisplayType ({displayType : serverWidget.FieldDisplayType.HIDDEN });

                               var fitmentSearchReturnObject = form.addField ({id : 'custpage_nsts_fitmentsearch_return_object' ,type : serverWidget.FieldType.LONGTEXT ,label : 'ACES Vehicle Search Return Object' ,container : 'custpage_nsts_fitmentsearch_container'} );
                                   fitmentSearchReturnObject.updateDisplayType ({displayType : serverWidget.FieldDisplayType.HIDDEN });
       
                               var fitmentSearchReturnString = form.addField ({id : 'custpage_nsts_fitmentsearch_return_string' ,type : serverWidget.FieldType.LONGTEXT ,label : 'ACES Vehicle Search Return Object' ,container : 'custpage_nsts_fitmentsearch_container'} );
                                   fitmentSearchReturnString.updateDisplayType ({displayType : serverWidget.FieldDisplayType.HIDDEN });
       
                               if(context.request.parameters.hasOwnProperty('fitmentSearchFieldOrderRetStr')){

                                   fitmentSearchReturnString.defaultValue = decodeURIComponent(context.request.parameters.fitmentSearchFieldOrderRetStr) || '';
                               }
       
                               if(context.request.parameters.hasOwnProperty('recordType')){
       
                                       recordType = decodeURIComponent(context.request.parameters.recordType) || '';
           
                                       fitmentSearchSourceRecordType.defaultValue = decodeURIComponent(context.request.parameters.recordType) || '';
                               }

                               if(recordType === 'salesord'){
       
                                   if(context.request.parameters.hasOwnProperty('transactionRecordItemQtyObj')){

                                        if (!isEmpty(context.request.parameters.transactionRecordItemQtyObj)){

                                            fitmentSearchTranRecordItemQtyObj = JSON.parse(decodeURIComponent(context.request.parameters.transactionRecordItemQtyObj)) || '';
           
                                            transactionItemQuantity.defaultValue = decodeURIComponent(context.request.parameters.transactionRecordItemQtyObj) || '';
                                        }
                                   }
                               }

                               var fitmentSearchFields = fitmentsearchlibrary.getFitmentFields(recordType);

                               if (isObjectEmpty(fitmentSearchFields)){
                                 
                                   var invalidFitmentSearchConfig = error.create({
                                        name: 'INVALID_FITMENT_SEARCH_CONFIG',
                                        message: 'Invalid Fitment Search Configuration',
                                        notifyOff: false
                                    });

                                    throw invalidFitmentSearchConfig;
                               }
                               else{
                                       if(context.request.parameters.hasOwnProperty('fitmentSearchFieldOrderReturnObj')){

                                           if(!isEmpty(context.request.parameters.fitmentSearchFieldOrderReturnObj) && context.request.parameters.fitmentSearchFieldOrderReturnObj !== '""' ){
       
                                               if(context.request.parameters.hasOwnProperty('executeFitmentSearch')){
       
                                                   if (context.request.parameters.executeFitmentSearch === 'true'){//POST Redirect
       
                                                       fitmentSearchFieldOrderReturnObj = JSON.parse(decodeURIComponent(context.request.parameters.fitmentSearchFieldOrderReturnObj)) || '';
       
                                                       fitmentSearchReturnObject.defaultValue = fitmentSearchFieldOrderReturnObj;
                                                   }
                                               }
                                           }
                                       }
       
                                       if(context.request.parameters.hasOwnProperty('fitmentSearchFieldOrderRetStr')){
       
                                           if(!isEmpty(context.request.parameters.fitmentSearchFieldOrderRetStr) && context.request.parameters.fitmentSearchFieldOrderRetStr !== '""' ){
                                           
                                               var fitmentSearchFieldOrderRetArr = decodeURIComponent(context.request.parameters.fitmentSearchFieldOrderRetStr).split('|');
       
                                               for (var i = 0 ; i < fitmentSearchFieldOrderRetArr.length ; i++){
       
                                                       if(!isEmpty(fitmentSearchFieldOrderRetArr[i])){
       
                                                           var fitmentSearchFieldNameValue = fitmentSearchFieldOrderRetArr[i].replace(/"/g,'').replace(/\\/g,'').split(':');
       
                                                           if(!isEmpty(fitmentSearchFieldNameValue[0]) && !isEmpty(fitmentSearchFieldNameValue[1])){
       
                                                               fitmentSearchFieldOrderReturnObj[fitmentSearchFieldNameValue[0].replace(/'/g,'')] = fitmentSearchFieldNameValue[1].replace(/'/g,'');
                                                           }
                                                       }
                                               }
       
                                               fitmentSearchReturnObject.defaultValue = fitmentSearchFieldOrderReturnObj;
                                           }
                                       }

                                       for(var fields in fitmentSearchFields){

                                               fitmentSearchFieldOrderObj[fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage')] = parseInt(fitmentSearchFields[fields].fieldorder)

                                               if(isObjectEmpty(fitmentSearchFieldOrderReturnObj)){

                                                   var addedFields = form.addField({
                                                       id: fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage'),
                                                       type: fitmentSearchFields[fields].fieldType,
                                                       label: fields,
                                                       source: fitmentSearchFields[fields].fieldId || '',
                                                       container : 'custpage_nsts_fs_container'
                                                   });

                                                   if (fitmentSearchFields[fields].fieldType === 'SELECT'){

                                                       if(fitmentSearchFields[fields].fieldId.replace('custpage_','') === 'location'){

                                                            addedFields.addSelectOption({
                                                                value: ' ',
                                                                text: ' '
                                                            });

                                                            search.create({
                                                                type: record.Type.LOCATION,				
                                                                filters:[],
                                                                columns: [
                                                                                "name",
                                                                                search.createColumn({
                                                                                                        name: "internalid",
                                                                                                        sort: search.Sort.ASC
                                                                                })
                                                                        ]
                                                            }).run().each(function (result) {

                                                                addedFields.addSelectOption({
                                                                    value: result.id,
                                                                    text: result.getValue({ name: 'name' })
                                                                });

                                                                return true;
                                                                
                                                            });
                                                       }
                                                   }
                                                   
                                               }
                                               else{
                                                       fitmentSearchFieldOrderObj[fitmentSearchFields[fields].fieldId] = parseInt(fitmentSearchFields[fields].rank);

                                                       if (!isEmpty(fitmentSearchFieldOrderReturnObj[fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage')])){

                                                           var addedFields = form.addField({
                                                               id: fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage'),
                                                               type: fitmentSearchFields[fields].fieldType,
                                                               label: fields,
                                                               container : 'custpage_nsts_fs_container'
                                                           });
   
                                                           if (fitmentSearchFields[fields].fieldType === 'SELECT'){
   
                                                               addedFields.addSelectOption({
                                                                   value: ' ',
                                                                   text: ' '
                                                               });
                                                               
                                                               addedFields.addSelectOption({
                                                                   value: fitmentSearchFieldOrderReturnObj[fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage')],
                                                                   text: fitmentSearchFieldOrderReturnObj["inpt_" + fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage')]
                                                               });
                                                           }
                                                       }
                                                       else{
                                                               var addedFields = form.addField({
                                                                   id: fitmentSearchFields[fields].fieldId.replace('customlist', 'custpage').replace('customrecord', 'custpage'),
                                                                   type: fitmentSearchFields[fields].fieldType,
                                                                   label: fields,
                                                                   source: fitmentSearchFields[fields].fieldId || '',
                                                                   container : 'custpage_nsts_fs_container'
                                                               });
               
                                                               /*
                                                               if (fitmentSearchFields[fields].fieldType === 'SELECT'){
               
                                                                   if(fitmentSearchFields[fields].fieldId.replace('custpage_','') === 'location'){
                               
                                                                       if (!isEmpty(runtime.getCurrentScript().getParameter('custscript_nsts_sl_fs_default_location'))){
               
                                                                           var locationSearch = search.lookupFields({
                                                                               type : 'location',
                                                                               id : runtime.getCurrentScript().getParameter('custscript_nsts_sl_fs_default_location'),
                                                                               columns : 'name'
                                                                           });
               
                                                                           if(!isObjectEmpty(locationSearch)){
               
                                                                               addedFields.addSelectOption({
                                                                                   value: runtime.getCurrentScript().getParameter('custscript_nsts_sl_fs_default_location') || '',
                                                                                   text: locationSearch.name
                                                                               });
                                                                           }
                                                                       }
                                                                       
                                                                   }
                                                               }
                                                               */
                                                       }
                                               }
                                       }     
                               }

                               fitmentSearchFieldOrder.defaultValue = decodeURIComponent(JSON.stringify(fitmentSearchFieldOrderObj)) || '';

                               form.updateDefaultValues(fitmentSearchFieldOrderReturnObj);

                               var sublist = form.addSublist({
                                   id: 'custpage_fitment_search_result',
                                   type: serverWidget.SublistType.LIST,
                                   label: 'Fitment Search Result',
                                   container : 'custpage_nsts_fs_container'
                               });

                               if (!isObjectEmpty(fitmentSearchFieldOrderReturnObj)){

                                   if(context.request.parameters.hasOwnProperty('executeFitmentSearch')){
       
                                       if (context.request.parameters.executeFitmentSearch === 'true'){

                                            fitmentsearchlibrary.getFitmentSearchResult(fitmentSearchFieldOrderReturnObj,sublist,fitmentSearchTranRecordItemQtyObj);
                                       }
                                   }
                               }
                               else{
                                       var fitmentSearchColumns = fitmentsearchlibrary.getFitmentSearchColumns();
       
                                       for (var fitmentSearchColumn in fitmentSearchColumns){

                                           if(fitmentSearchColumn.name === 'internalid'){
               
                                               var itemField = sublist.addField({
                                                   id: 'custpage_' + fitmentSearchColumns[fitmentSearchColumn].name,
                                                   type: 'select',
                                                   label: fitmentSearchColumns[fitmentSearchColumn].label,
                                                   source: 'item'
                                               });
                                               
                                               itemField.updateDisplayType({
                                                   displayType: serverWidget.FieldDisplayType.INLINE
                                               });
                   
                                           }else{
               
                                               sublist.addField({
                                                   id: 'custpage_' + fitmentSearchColumns[fitmentSearchColumn].name,
                                                   type: 'text',
                                                   label: fitmentSearchColumns[fitmentSearchColumn].label
                                               });
                                           }
                                       }
                               }

                               form.addButton({
                                   id: 'custpage_complete_submit',
                                   label: 'Complete/Submit',
                                   functionName: 'soSubmit'
                               });

                               form.addButton({
                                    id: 'custpage_rem_veh_sel',
                                    label: 'Remove Selection',
                                    functionName: 'redirectToSuitelet'
                                });
                                
                               form.addButton({
                                   id: 'custpage_close',
                                   label: 'Cancel',
                                   functionName: 'windowClose'
                               });
       
                               form.addResetButton({
                                   label : 'Clear Item Selection'
                               });
       
                               form.addSubmitButton ({
                                   label : 'Fitment Search'
                               });
                       }
                       else{
                                var recordTypeError = error.create({
                                    name: 'INVALID_REC_TYPE',
                                    message: 'Invalid Record Type.',
                                    notifyOff: false
                                });

                                throw recordTypeError;
                       }
                   }
                   else if (context.request.method == "POST") {

                       if (isEmpty(context.request.parameters.loadtype )){

                               var fitmentSearchFieldOrder = new Object,
                                   fitmentSearchFieldOrderRetObj = new Object,
                                   fitmentSearchFieldOrderRetStr = new String;

                               var fitmentSearchFieldOrder = new Object,
                                   fitmentSearchFieldOrderRetObj = new Object,
                                   fitmentSearchFieldOrderRetStr = new String;

                               var fieldorderCount = 0;

                               if(context.request.parameters.hasOwnProperty('custpage_nsts_fitmentsearch_fieldorder')){

                                       fitmentSearchFieldOrder = JSON.parse(context.request.parameters.custpage_nsts_fitmentsearch_fieldorder);
                               }

                               for (var fitmentSearchField in fitmentSearchFieldOrder){

                                   fieldorderCount++;

                                   if(context.request.parameters.hasOwnProperty(fitmentSearchField)){

                                       fitmentSearchFieldOrderRetObj[fitmentSearchField] = context.request.parameters[fitmentSearchField] || '';

                                       fitmentSearchFieldOrderRetStr += fitmentSearchField + ":" + "'" + context.request.parameters[fitmentSearchField] + "'" + "|";
                                   }

                                   if(context.request.parameters.hasOwnProperty("inpt_" + fitmentSearchField)){

                                       fitmentSearchFieldOrderRetObj["inpt_" + fitmentSearchField] = context.request.parameters["inpt_" + fitmentSearchField] || '';

                                       if (fieldorderCount == Object.keys(fitmentSearchFieldOrder).length){

                                           fitmentSearchFieldOrderRetStr += "inpt_" + fitmentSearchField  + ":" + "'" +  context.request.parameters["inpt_" + fitmentSearchField] + "'";
                                       }
                                       else{

                                           fitmentSearchFieldOrderRetStr += "inpt_" + fitmentSearchField  + ":" + "'" +  context.request.parameters["inpt_" + fitmentSearchField] + "'" + "|";
                                       }
                                   }
                               }

                               log.audit('Usage Remaining After Updates: ' , Runtime.getCurrentScript().getRemainingUsage());

                               redirect.toSuitelet({
                                   scriptId: Runtime.getCurrentScript().id,
                                   deploymentId: Runtime.getCurrentScript().deploymentId,
                                   parameters: {
                                                   transactionRecordItemQtyObj : JSON.stringify(context.request.parameters.custpage_nsts_fs_itemqty),
                                                   fitmentSearchTranCust : context.request.parameters.custpage_nsts_fitmentsearch_tran_cust,
                                                   fitmentSearchFieldOrder : JSON.stringify(fitmentSearchFieldOrder),
                                                   fitmentSearchFieldOrderRetStr : JSON.stringify(fitmentSearchFieldOrderRetStr),
                                                   recordType: context.request.parameters.custpage_nsts_fs_sourcerectype,
                                                   executeFitmentSearch : true
                                               }
                               });

                               if (window.opener) {

                                   window.onbeforeunload = '';
                               }
                       }
                       else{
                                return true;
                       }
                   }
           }
           catch (err){

               var form = serverWidget.createForm({title: "Fitment Search Error" , hideNavBar: true});

               form.addButton({
                   id: 'custpage_close',
                   label: 'Close',
                   functionName: 'window.close();return true;'
               });

               form.addFieldGroup({
                   id: 'FitmentSearchError',
                   label: 'Error : '
               });

               var field = form.addField({ id: 'custpage_nsts_fs_result', 
                                               type: serverWidget.FieldType.INLINEHTML, 
                                               label: 'Error',
                                               container: 'FitmentSearchResult' 
                                       });

               field.defaultValue = '<div style="font-size:15px; padding-top:10px;">' +
                                   '<h1>Error : </h1><br>' +err.message.toString();

               log.error('Status', err);
           }
           finally{

               context.response.writePage(form);
           }
       }

     return	{
       onRequest : onRequest
   };
});