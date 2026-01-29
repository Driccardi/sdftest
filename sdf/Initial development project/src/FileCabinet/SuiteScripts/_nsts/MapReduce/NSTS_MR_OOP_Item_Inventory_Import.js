/*
 * Copyright (c) 1998-2023 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @changeLog: 1.0            10 May 2023        Shalabh Saxena            Initial version.
 */
 define( //using require instead for better module loading especially for the have dependencies.
    (require) =>
    {
        //Custom modules
        let nsutil = require('../LibraryFiles/NSUtilvSS2');

        //Native Modules
        let runtime = require('N/runtime');
        let search = require('N/search');
        let record = require('N/record');
        let format = require('N/format');
        let file = require('N/file');
        let cache = require('N/cache');
        let email = require('N/email');
        let Error = require('N/error');

        //Script parameter definition
        //Usage: PARAM_DEF = {parameter1:{id:'custcript_etc', optional:true}}

        let PARAM_DEF = {
                toprocessfolder: {
                        id: 'custscript_nsts_oop_mr_to_process_folder',
                        optional: false
                },
                processedfolder: {
                        id: 'custscript_nsts_oop_mr_processed_folder',
                        optional: false
                },
                errorfolder: {
                        id: 'custscript_nsts_oop_mr_error_folder',
                        optional: false
                },
                noninventoryitemform: {
                        id: 'custscript_nsts_oop_mr_item_form',
                        optional: false
                },
                noninventoryitemsubsidiary: {
                        id: 'custscript_nsts_oop_mr_subsidiary',
                        optional: false
                },
                noninventoryitemincomeaccount: {
                        id: 'custscript_nsts_oop_mr_income_account',
                        optional: false
                },
                classaftermarket :{
                        id: 'custscript_nsts_oop_mr_class_aftermarket',
                        optional: false
                },
                emailsender: {
                        id: 'custscript_nsts_oop_mr_email_sender',
                        optional: false
                },
                emailreciever: {
                        id: 'custscript_nsts_oop_mr_email_receiver',
                        optional: false
                }
        };

        let EntryPoint = {};

        let Helper = {};

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
        EntryPoint.getInputData = () =>
        {
                let stLogTitle = 'getInputData';

                log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

                let fileSearchResults = new Object;

                try{
                        let paramsScript = Helper.getParameters(PARAM_DEF);

                        let fileSearchObj = search.create({
                                type: "file",
                                filters:
                                [
                                ["folder","anyof",paramsScript.toprocessfolder]
                                ],
                                columns:
                                [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                                }),
                                search.createColumn({name: "folder", label: "Folder"}),
                                search.createColumn({name: "url", label: "URL"}),
                                search.createColumn({name: "filetype", label: "Type"})
                                ]
                        });

                        fileSearchResults = Util.getAllResults(fileSearchObj,1);

                        if(Util.isEmpty(fileSearchResults)){

                                let nonInventoryItemDataCache = cache.getCache({ name: 'nonInventoryItemDataCache', scope: cache.Scope.PRIVATE });

                                nonInventoryItemDataCache.remove({key: 'nonInventoryItemDataCache' });

                                log.audit(stLogTitle,'No Files found for processing.')
                        }
                        else{
                                return fileSearchResults;
                        }
                }
                catch(error){

                        log.error(stLogTitle, JSON.stringify(error));
                
                        throw error.message;
                }

                log.debug(stLogTitle, '**** END: Entry Point Invocation ****');
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
        EntryPoint.map = (mapContext) =>
        {
            let stLogTitle = 'map (' + mapContext.key + ')';

            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

            let currentRowNumber = 0,
                incorrectRow = '', 
                currentFileRowError = false;
            
            try{
                    //log.debug(stLogTitle, 'Context = ' + JSON.stringify(mapContext));

                    let objContextData = JSON.parse(mapContext.value);

                    let objRaw = objContextData.values;

                    let nonInventoryItemDataCache = cache.getCache({ name: 'nonInventoryItemDataCache', scope: cache.Scope.PRIVATE });

                    nonInventoryItemDataCache.put({ key: 'nonInventoryItemDataCache', value: Util.getNonInventoryItemDataLookup(objRaw['name'],objRaw['internalid'][0].value)});

                    //log.debug(stLogTitle, 'objRaw = ' + JSON.stringify(objRaw));

                    let fileObj = file.load({
                        id: objRaw['internalid'][0].value  
                    });

                    let fileContents = fileObj.getContents();
                    
                    let fileLines = fileContents.split('\n');

                    for(let x = 1; x < fileLines.length; x++){

                        currentRowNumber = x+1;

                        fileLines[x] = fileLines[x].replace(
                                              /(["'])(?:(?=(\\?))\2.)*?\1/g,
                                              function(match, capture) {
                                                return match.replace(/\,/g, '&&');
                                              }
                                        );
                        
                        let currentLineInfo = fileLines[x].split(',');

                        if (currentLineInfo.length <= 1){ 

                                log.debug(stLogTitle, 'Blank line in File: ' + fileObj.name + ' at Row : ' +  currentRowNumber);
                        }
                        else{
                                if(currentLineInfo.length != 14){

                                        globalErrorCount++;
    
                                        incorrectRow += currentRowNumber +',';
                                        
                                        if(currentFileRowError === false){
                                            currentFileRowError = true;
                                        }
    
                                        log.error('File Lines for '+ fileObj.name, "Breaking Loop because of incorrect file length."+ incorrectRow);
                                        
                                        break;
                                }
                                else{
                                        mapContext.write({
                                                key: x,
                                                value: {
                                                            'RNumber' : currentLineInfo[0].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'OnHand' : currentLineInfo[1].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'HollanderNumber' : currentLineInfo[2].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'BwNumber' : currentLineInfo[3].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'PartNumber' : currentLineInfo[4].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'FullPartNumber' : currentLineInfo[5].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'Cost' : currentLineInfo[6].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'Grade' : currentLineInfo[7].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'FinishFullText' : currentLineInfo[8].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'FinishText' : currentLineInfo[9].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'Material' : currentLineInfo[10].replace(/\&&/g, ',').replace(/"/g, "") || '', 
                                                            'IsAftermarket' : currentLineInfo[11].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'OEMNumbers' : currentLineInfo[12].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'PartType' : currentLineInfo[13].replace(/\&&/g, ',').replace(/"/g, "") || '',
                                                            'processFileInternalId': objRaw['internalid'][0].value,
                                                            'processFileName' : objRaw['name'] || ''
                                                }
                                        });
                                }
                        }
                    }
            } 
            catch (e) 
            {
                log.error(stLogTitle, JSON.stringify(e));

                throw e.message;
            }

            log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
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
         EntryPoint.reduce = (context) =>
         {
                 let arrKey = context.key;

                 let stLogTitle = 'reduce (' + context.key + ')';

                 let nonInventoryItemInternalId = 0;

                 log.debug(stLogTitle, '**** START: Entry Point Invocation ****');
                 
                 log.debug(stLogTitle, 'searchResult : ' + JSON.stringify(context));

                 try {
                        let paramsScript = Helper.getParameters(PARAM_DEF);

                        objKey = arrKey;

                        let itemInventoryObj = JSON.parse(context.values[0]);

                        let nonInventoryItemDataCache = cache.getCache({ name: 'nonInventoryItemDataCache', scope: cache.Scope.PRIVATE });

                        let nonInventoryItemDataObj = JSON.parse(nonInventoryItemDataCache.get({ key: 'nonInventoryItemDataCache', loader: Util.getNonInventoryItemDataLookup(itemInventoryObj['processFileName'],itemInventoryObj['processFileInternalId'])}));

                        if (Util.isObjectEmpty(nonInventoryItemDataObj)){

                                nonInventoryItemDataObj = JSON.parse(nonInventoryItemDataCache.get({ key: 'nonInventoryItemDataCache', loader: Util.getNonInventoryItemDataLookup(itemInventoryObj['processFileName'],itemInventoryObj['processFileInternalId'])}));

                                nonInventoryItemDataCache.put({ key: 'nonInventoryItemDataCache', value: nonInventoryItemDataObj});
                        }

                        let objItemRecord = record.create({
                                                                type: record.Type.NON_INVENTORY_ITEM,
                                                                isDynamic: false,
                                                                defaultValues: {
                                                                        customform : paramsScript.custscript_nsts_oop_mr_item_form || ''
                                                                }
                                                        });
                     
                        if (!Util.isEmpty(itemInventoryObj['PartNumber'])){

                                objItemRecord.setValue({
                                        fieldId: 'itemid',
                                        value: itemInventoryObj['PartNumber'] ||''
                                });

                                objItemRecord.setValue({
                                        fieldId: 'externalid',
                                        value: itemInventoryObj['PartNumber'] ||''
                                });
                        }

                        objItemRecord.setValue({
                                fieldId: 'subtype',
                                value: 'Sale'
                        });

                        objItemRecord.setValue({
                                fieldId: 'taxschedule',
                                value: 1
                        });

                        if (!Util.isEmpty(paramsScript.noninventoryitemsubsidiary)){

                                objItemRecord.setValue({
                                        fieldId: 'subsidiary',
                                        value: paramsScript.noninventoryitemsubsidiary
                                });
                        }
                        
                        objItemRecord.setValue({
                                fieldId: 'isfulfillable',
                                value: true
                        });

                        if (!Util.isEmpty(paramsScript.noninventoryitemincomeaccount)){

                                objItemRecord.setValue({
                                        fieldId: 'incomeaccount',
                                        value: paramsScript.noninventoryitemincomeaccount
                                });
                        }

                        if (!Util.isEmpty(nonInventoryItemDataObj.processfilelocationinternalid)){

                                objItemRecord.setValue({
                                        fieldId: 'location',
                                        value: nonInventoryItemDataObj.processfilelocationinternalid[0]
                                });
                        }

                        if (!Util.isEmpty(itemInventoryObj['Grade'])){

                                if (nonInventoryItemDataObj['itemquality'].hasOwnProperty(itemInventoryObj['Grade'])){

                                        objItemRecord.setValue({
                                                fieldId: 'custitem_gr_item_quality',
                                                value: nonInventoryItemDataObj['itemquality'][itemInventoryObj['Grade']]
                                        });
                                }  
                        }

                        if (!Util.isEmpty(itemInventoryObj['FinishFullText'])){

                                objItemRecord.setValue({
                                        fieldId: 'custitem_gr_item_hollander',
                                        value: itemInventoryObj['FinishFullText'] ||''
                                });
                        }

                        if (!Util.isEmpty(itemInventoryObj['FinishText'])){

                                objItemRecord.setValue({
                                        fieldId: 'salesdescription',
                                        value: itemInventoryObj['FinishText'] ||''
                                });
                        }
                        
                        if (!Util.isEmpty(itemInventoryObj['PartType'])){

                                let partTypeStr = new String;

                                partTypeStr = JSON.stringify(itemInventoryObj['PartType']).replace(/"/g, "").replace(/(?:\\[rn])+/g, "");

                                if (nonInventoryItemDataObj['parttype'].hasOwnProperty(partTypeStr)){

                                        objItemRecord.setValue({
                                                fieldId: 'custitem_gr_item_type',
                                                value: nonInventoryItemDataObj['parttype'][partTypeStr]
                                        });
                                }    
                        }

                        if (!Util.isEmpty(itemInventoryObj['Cost'])){

                                objItemRecord.setValue({
                                        fieldId: 'cost',
                                        value: itemInventoryObj['Cost'] ||''
                                });
        
                                objItemRecord.setValue({
                                        fieldId: 'custitem_gr_it_ampurchprice',
                                        value: itemInventoryObj['Cost'] ||''
                                });
                        }

                        if (!Util.isEmpty(itemInventoryObj['IsAftermarket'])){

                                if (nsutil.forceInt(itemInventoryObj['IsAftermarket']) == 1){

                                        objItemRecord.setValue({
                                                fieldId: 'class',
                                                value: paramsScript.classaftermarket ||''
                                        });
                                }
                        }

                        if (!Util.isEmpty(itemInventoryObj['OnHand'])){

                                objItemRecord.setValue({
                                        fieldId: 'custitem_gr_item_onhandquantity',
                                        value: nsutil.forceInt(itemInventoryObj['OnHand'])
                                });
                        }

                        try{
                                nonInventoryItemInternalId = objItemRecord.save();
                        }
                        catch(err){
                                        if (err.name != 'DUP_ITEM'){
                        
                                                log.error('Item Record Create Status', 'Error : ' + err.message);

                                                throw Error.create(
                                                        {
                                                                name: 'NON_INVENTORY_ITEM_CREATE_ERROR',
                                                                message: 'Error creating Non Inventory Item : ' + itemInventoryObj['PartNumber'] + ' Error : ' + JSON.stringify(err.message)
                                                        });
                                        }
                                        else{
                                                let nonInventoryItemUpdateObj = new Object;
                                        
                                                let nonInventoryItemObjSearch = search.create({
                                                        type: record.Type.NON_INVENTORY_ITEM,
                                                        filters:
                                                        [
                                                                ["itemid","is",itemInventoryObj['PartNumber']]
                                                        ],
                                                        columns:
                                                        [
                                                                search.createColumn({name: "internalid", label: "Item Id"})
                                                        ]
                                                });

                                                let nonInventoryItemObjSearchResult = Util.getAllResults(nonInventoryItemObjSearch);

                                                if(Util.isEmpty(nonInventoryItemObjSearchResult)){

                                                        throw Error.create({
                                                                name: 'NON_INVENTORY_ITEM_NOT_FOUND',
                                                                message: 'Item not found with Part Number : ' + itemInventoryObj['PartNumber']
                                                        });
                                                }
                                                else{
                                                        if (Util.isEmpty(nonInventoryItemObjSearchResult[0].id)){

                                                                throw Error.create({
                                                                        name: 'NON_INVENTORY_ITEM_NOT_FOUND',
                                                                        message: 'Item not found with Part Number : ' + itemInventoryObj['PartNumber']
                                                                });
                                                        }
                                                        else{
                                                                nonInventoryItemInternalId = nonInventoryItemObjSearchResult[0].id
        
                                                                if (!Util.isEmpty(itemInventoryObj['Grade'])){
        
                                                                        if (nonInventoryItemDataObj['itemquality'].hasOwnProperty(itemInventoryObj['Grade'])){
        
                                                                                nonInventoryItemUpdateObj = __assign({custitem_gr_item_quality : nonInventoryItemDataObj['itemquality'][itemInventoryObj['Grade']]}, nonInventoryItemUpdateObj);
                                                                        }                                             
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['FinishFullText'])){
        
                                                                        nonInventoryItemUpdateObj = __assign({custitem_gr_item_hollander : itemInventoryObj['FinishFullText'] ||''}, nonInventoryItemUpdateObj);
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['FinishText'])){
        
                                                                        nonInventoryItemUpdateObj = __assign({salesdescription : itemInventoryObj['FinishText'] ||''}, nonInventoryItemUpdateObj);
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['PartType'])){

                                                                        let partTypeStr = new String;

                                                                        partTypeStr = JSON.stringify(itemInventoryObj['PartType']).replace(/"/g, "").replace(/(?:\\[rn])+/g, "");

                                                                        if (nonInventoryItemDataObj['parttype'].hasOwnProperty(partTypeStr)){
        
                                                                                nonInventoryItemUpdateObj = __assign({custitem_gr_item_type : nonInventoryItemDataObj['parttype'][partTypeStr]}, nonInventoryItemUpdateObj);
                                                                        }
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['Cost'])){
        
                                                                        nonInventoryItemUpdateObj = __assign({cost : itemInventoryObj['Cost'] ||''}, nonInventoryItemUpdateObj);
        
                                                                        nonInventoryItemUpdateObj = __assign({custitem_gr_it_ampurchprice : itemInventoryObj['Cost'] ||''}, nonInventoryItemUpdateObj);
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['IsAftermarket'])){
        
                                                                        if (nsutil.forceInt(itemInventoryObj['IsAftermarket']) == 1){
        
                                                                                nonInventoryItemUpdateObj = __assign({class : paramsScript.classaftermarket}, nonInventoryItemUpdateObj);
                                                                        }
                                                                }
        
                                                                if (!Util.isEmpty(itemInventoryObj['OnHand'])){
        
                                                                        nonInventoryItemUpdateObj = __assign({ custitem_gr_item_onhandquantity : nsutil.forceInt(itemInventoryObj['OnHand'])}, nonInventoryItemUpdateObj);
                                                                }

                                                                record.submitFields({
                                                                        type: record.Type.NON_INVENTORY_ITEM,
                                                                        id: nonInventoryItemObjSearchResult[0].id,
                                                                        values:nonInventoryItemUpdateObj,
                                                                        options: {
                                                                                        enableSourcing: false,
                                                                                        ignoreMandatoryFields : true
                                                                        }
                                                                });
                                                        }
                                                }  
                                        }
                        } 
                 } 
                 
                 catch (err) {

                         log.error(stLogTitle, 'Catch : ' + err.name + ' : ' + err.message);

                         throw err;
                 }
                 finally{
                                context.write({
                                        key: context.key,
                                        value: nonInventoryItemInternalId
                                });
                 }

                 log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
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
         EntryPoint.summarize = (summaryContext) =>
         {
                 let stLogTitle = 'summarize';

                 let errorItemInventoryFileProcess = false,
                     emaiReceiverArr = new Array,
                     processedFileInternalId = 0,
                     processedFileName = new String;

                let paramsScript = Helper.getParameters(PARAM_DEF);

                let stEmailMessageBody = "<style>table{border: 1px solid #000;width: 100%;}tr td {border: 1px solid #c1c1c1;padding: 3px;}table th{background-color: #ccc; text-align: center;font-weight: bold;padding: 5px;}</style>";

                emaiReceiverArr = paramsScript.emailreciever.split(';');

                 log.debug(stLogTitle, '**** START: Entry Point Invocation ****');
                 try
                 {
                        let nonInventoryItemDataCache = cache.getCache({ name: 'nonInventoryItemDataCache', scope: cache.Scope.PRIVATE });

                        let nonInventoryItemDataObj = JSON.parse(nonInventoryItemDataCache.get({ key: 'nonInventoryItemDataCache'}))

                        if (!Util.isObjectEmpty(nonInventoryItemDataObj)){

                                processedFileInternalId = nonInventoryItemDataObj.processfileinternalid || 0;

                                processedFileName = nonInventoryItemDataObj.processfilename || '';
                        }

                        let type = summaryContext.toString();

                        log.audit(stLogTitle, 'Type = ' + type +
                                ' | Usage Consumed = ' + summaryContext.usage +
                                ' | Concurrency Number = ' + summaryContext.concurrency +
                                ' | Number of Yields = ' + summaryContext.yields);

                        if (summaryContext.inputSummary.error) {

                                errorItemInventoryFileProcess = true;

                                stEmailMessageBody += `<tr class="summary_error_tr"><td>${summary.inputSummary.error.message}</td></tr>`;
                                
                                log.error(stLogTitle + ' Input Error', summary.inputSummary.error);
                        }
                        
                        summaryContext.mapSummary.errors.iterator().each(function(code, message) {

                                errorItemInventoryFileProcess = true;

                                stEmailMessageBody += `<tr class="summary_error_tr"><td>${message}</td></tr>`;
                                
                                log.error(stLogTitle + ' Map Error: ' + code, message);

                                return true;
                        });
                        
                        summaryContext.reduceSummary.errors.iterator().each(function(code, message) {

                                errorItemInventoryFileProcess = true;

                                stEmailMessageBody += `<tr class="summary_error_tr"> <td>${message}</td></tr>`;
                            
                                log.error(stLogTitle + ' Reduce Error: ' + code, message);

                                return true;
                        });

                        summaryContext.output.iterator().each(function (key, value){

                                value =  JSON.parse(value);

                                log.debug('value',value);
                        });

                        stEmailMessageBody += `</tbody></table>`;

                        if (errorItemInventoryFileProcess == true){

                                email.send({
                                        author: paramsScript.emailsender,
                                        recipients: emaiReceiverArr,
                                        subject: 'Error processing Item Inventory File : ' + processedFileName,
                                        body: stEmailMessageBody
                                });

                                let copyFileObj = file.copy({
                                                                id: parseInt(processedFileInternalId),
                                                                folder: parseInt(paramsScript.errorfolder)
                                                        });
                
                                copyFileObj.save();
                
                                file.delete({
                                id: parseInt(processedFileInternalId)
                                });
                        }
                        else{
                                if (processedFileInternalId > 0){

                                        let copyFileObj = file.copy({
                                                id: parseInt(processedFileInternalId),
                                                folder: parseInt(paramsScript.processedfolder)
                                        });

                                        copyFileObj.save();

                                        file.delete({
                                        id: parseInt(processedFileInternalId)
                                        });
                                }
                                
                                email.send({
                                                author: paramsScript.emailsender,
                                                recipients: emaiReceiverArr,
                                                subject: 'Item Inventory File Processed Sucessfully : ' + processedFileName,
                                                body: 'Item Inventory File Processed Sucessfully'
                                });
                        }
                 }
                 catch (e)
                    {
                            log.error(stLogTitle, JSON.stringify(e));

                            stEmailMessageBody += `<tr class="summary_error_tr"> <td>${e.message}</td></tr>`;

                            stEmailMessageBody += `</tbody></table>`;

                            email.send({
                                author: paramsScript.emailsender,
                                recipients: emaiReceiverArr,
                                subject: 'Error processing Item Inventory File : ' + processedFileName,
                                body: stEmailMessageBody
                            });

                            if (processedFileInternalId > 0){

                                let copyFileObj = file.copy({
                                        id: parseInt(processedFileInternalId),
                                        folder: parseInt(paramsScript.errorfolder)
                                });

                                copyFileObj.save();

                                file.delete({
                                                        id: parseInt(processedFileInternalId)
                                });
                            }
                    }

                    log.debug(stLogTitle, '**** END: Entry Point Invocation ****');
        }  
        
        EntryPoint.config = {retryCount: 0, exitOnError: false};

        Helper.getParameters = function (parameterIds, baseidProvided)
            {
                    var stLogTitle = 'getParameters';
                    var parametersMap = {};
                    var scriptContext = runtime.getCurrentScript();
                    var obj;
                    var value;
                    var optional;
                    var id;
                    //log.debug(stLogTitle, 'Parameter ids:'+JSON.stringify(parameterIds));
                    for (var key in parameterIds)
                    {
                            if (parameterIds.hasOwnProperty(key))
                            {
                                    obj = parameterIds[key];
                                    if (typeof obj === 'string')
                                    {
                                            if (baseidProvided)
                                            {
                                                    value = scriptContext.getParameter('custscript_' + obj);
                                            }
                                            else
                                            {
                                                    value = scriptContext.getParameter(obj);
                                            }
                                    }
                                    else
                                    {
                                            id = (baseidProvided) ? 'custscript_' + obj.id : obj.id;
                                            optional = obj.optional;
                                            value = scriptContext.getParameter(id);
                                    }

                                    if (value!=='' && value!==null)
                                    {
                                            parametersMap[key] = value;
                                    }
                                    else
                                    {
                                            if (!optional)
                                            {
                                                    throw error.create(
                                                        {
                                                                name: 'MISSING_PARAMETER',
                                                                message: 'Missing Script Parameter:' + key + '[' + id + ']'
                                                        });
                                            }
                                    }
                            }
                    }

                    //log.audit(stLogTitle, 'Parameters:'+JSON.stringify(parametersMap));
                    
                    return parametersMap;
        };

        let Util = {};
        
        Util.search = function(option)
        {
                if (option.type == null && option.id == null)
                {
                        Error.create({
                                name : 'MISSING_REQD_PARAM',
                                message : 'record type, saved search id',
                                notifyOff : true
                        });
                }

                var arrReturnSearchResults = new Array();
                var objSearch;
                var maxResults = 1000;

                if (option.id != null) {
                        var srchOption = { id:option.id };
                        if (option.type) srchOption.type = option.type;
                        objSearch = Search.load(srchOption);
                }
                else {
                        objSearch = Search.create({ type:option.type });
                        objSearch.filterExpression = [];
                        objSearch.filters = [];
                        objSearch.columns = [];
                }

                // Add filters
                if (option.filters && option.filters.length)
                {
                        if (option.filters[0] instanceof Array || (typeof option.filters[0] == 'string')) {
                                objSearch.filterExpression = objSearch.filterExpression.concat(option.filters);
                        }
                        else {
                                objSearch.filters = objSearch.filters.concat(option.filters);
                        }
                }

                // Add columns
                if (option.columns && option.columns.length) {
                        objSearch.columns = objSearch.columns.concat(option.columns);
                }

                var objResultset = objSearch.run();
                var intSearchIndex = 0;
                var arrResultSlice = null;
                do {
                        arrResultSlice = objResultset.getRange(intSearchIndex, intSearchIndex + maxResults);
                        if (arrResultSlice == null) { break; }
                        arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
                        intSearchIndex = arrReturnSearchResults.length;
                }
                while (arrResultSlice.length >= maxResults);
                return arrReturnSearchResults;
        };

        Util.getSearchResults = function(objSearch)
        {
                var arrReturnSearchResults = new Array();
                var maxResults = 1000;
                var objResultset = objSearch.run();
                var intSearchIndex = 0;
                var arrResultSlice = null;
                do {
                        arrResultSlice = objResultset.getRange(intSearchIndex, intSearchIndex + maxResults);
                        if (arrResultSlice == null) { break; }
                        arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
                        intSearchIndex = arrReturnSearchResults.length;
                }
                while (arrResultSlice.length >= maxResults);
                return arrReturnSearchResults;
        };

        Util.addDays = function(dt, days)
        {
                return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()+days);
        };

        Util.getAllResults = function(objSearch, maxResults)
        {
            let intPageSize = 1000;
            // limit page size if the maximum is less than 1000
            if (maxResults && maxResults < 1000) {
                intPageSize = maxResults;
            }
            let objResultSet = objSearch.runPaged({
                pageSize : intPageSize
            });
            let arrReturnSearchResults = [];
            let j = objResultSet.pageRanges.length;
            // retrieve the correct number of pages. page count = maximum / 1000
            if (j && maxResults) {
                j = Math.min(Math.ceil(maxResults / intPageSize), j);
            }
            for (var i = 0; i < j; i++) {
                let objResultSlice = objResultSet.fetch({
                    index : objResultSet.pageRanges[i].index
                });
                arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
            }
            if (maxResults) {
                return arrReturnSearchResults.slice(0, maxResults);
            } else {
                return arrReturnSearchResults;
            }
        }

        Util.isObjectEmpty = function (obj) {
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
    
        Util.isEmpty = function(stValue) {
                return ((stValue === 'none' || stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || 
                    (stValue.constructor === Object && (function(v) { for (var k in v) return false;return true; }) (stValue)));
        }
    
        let __assign = (this && this.__assign) || function () {
                __assign = Object.assign || function(t) {
                    for (let s, i = 1, n = arguments.length; i < n; i++) {
                        s = arguments[i];
                        for (let p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                            t[p] = s[p];
                    }
                    return t;
                };
                return __assign.apply(this, arguments);
        };

        Util.getNonInventoryItemDataLookup  = function (processFileName, processFileInternalId) {

                let nonInventoryItemDataLookup = new Object,
                    arrLocations = new Array,
                    itemQualityObj = new Object,
                    partTypeObj = new Object;

                const arrLocationDataSearch = nsutil.search(record.Type.LOCATION, null,
                        [
                            ["isinactive", search.Operator.IS, "F"],
                            "AND", 
                            ["name","is",processFileName.substring(processFileName.indexOf('_') + 1, processFileName.lastIndexOf('_'))]
                        ],
                        ['internalid','name']
                );       
                
                arrLocationDataSearch.forEach((result) => {

                        arrLocations.push(nsutil.forceInt(result.id));

                        return true;
                });

                search.create({
                        type: "customlist_gr_list_itemquality",				
                        filters:[],
                        columns: [
                                        "name",
                                        search.createColumn({
                                                                name: "internalid",
                                                                sort: search.Sort.DESC
                                        })
                                ]
                }).run().each(function (result) {

                        itemQualityObj[result.getValue({ name: 'name' })] = result.getValue({ name: 'internalid' });

                        return true;
                });

                search.create({
                        type: "customlist_gr_list_itemtype",				
                        filters:[],
                        columns: [
                                        "name",
                                        search.createColumn({
                                                                name: "internalid",
                                                                sort: search.Sort.DESC
                                        })
                                ]
                }).run().each(function (result) {

                        partTypeObj[result.getValue({ name: 'name' })] = result.getValue({ name: 'internalid' });

                        return true;
                });

                nonInventoryItemDataLookup = {

                        processfilename : processFileName,
                        processfilelocation : processFileName.substring(processFileName.indexOf('_') + 1, processFileName.lastIndexOf('_')) || '',
                        processfilelocationinternalid : arrLocations,
                        processfileinternalid : processFileInternalId,
                        itemquality : itemQualityObj,
                        parttype : partTypeObj
                };

                return nonInventoryItemDataLookup;
        }
    
        Util.findByMatchingProperties = function(set, properties) {
                return set.filter(function (entry) {
                    return Object.keys(properties).every(function (key) {
                        return entry[key] === properties[key];
                    });
                });
        }

        return EntryPoint;
 });