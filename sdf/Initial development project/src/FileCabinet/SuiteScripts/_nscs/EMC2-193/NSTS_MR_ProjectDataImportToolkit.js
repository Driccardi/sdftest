/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * Version        Date                        Author                               Remarks
 * 1.0            2025/04/02                  manuel.teodoro                       Initial Commit
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define( //using require instead for better module loading especially for the have dependencies.
    (require) => {
        //Custom modules
        let NSUtil = require('/SuiteScripts/_nscs/Library/NSUtilvSS2');
        let Lib = require('/SuiteScripts/_nscs/Library/NSTS_Lib_ProjectDataImportToolkit');

        //Native Modules
        let record = require('N/record');
        let runtime = require('N/runtime');
        let search = require('N/search');

        //Declare global variables
        let PARAM_DEF =
            {
                srchledger: { id: 'custscript_srch_imported', optional: false },
                ledgertype: { id: 'custscript_import_type', optional: false },
            }

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

            try
            {
                let intSearchId = runtime.getCurrentScript().getParameter(PARAM_DEF.srchledger.id);

                let arrSearchFilters = [
                    search.createFilter({
                        name: 'custrecord_ps_imp_typ',
                        operator: search.Operator.ANYOF,
                        values: runtime.getCurrentScript().getParameter(PARAM_DEF.ledgertype.id)
                    })
                ];

                let arrData = NSUtil.search('', intSearchId, arrSearchFilters, null);

                log.debug(stLogTitle, '**** END: Entry Point Invocation ****');

                if(!NSUtil.isEmpty(arrData[0])){
                    return arrData;
                } else{
                    log.error("Error", 'No imported ledger available.')
                }

            }
            catch (e)
            {
                log.error("Error", e)
            }
        };

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

            try
            {
                let objContextValue = JSON.parse(mapContext.value);
                let objRaw = objContextValue.values;
                log.debug(stLogTitle, 'objRaw:'+JSON.stringify(objRaw));

                let arrData = [];
                let inTransactionDataFlowId;
                let intLedgerType = objRaw['custrecord_ps_imp_typ'][0].value;
                let objRecordType = Lib.getRecordType();
                let objSublistId = Lib.getSublistFields();
                let objDataFlow = Lib.getDataFlow(intLedgerType,objRecordType,objSublistId);

                let intNumberofFields = runtime.getCurrentScript().getParameter('custscript_number_of_fields');

                for (let key in objDataFlow)
                {
                    if (objDataFlow[key].ismastertable === true)
                    {
                        for (let i = 0; i < intNumberofFields; i++)
                        {
                            let strFieldId = 'custrecord_ps_imp_fld'+String(i+1).padStart(2, '0');

                            arrData.push({
                                fieldnumber: i+1,
                                value: objRaw[strFieldId]
                            });
                        }


                        for (let i = 0; i < objDataFlow[key].header.length; i++)
                        {
                            let objHeaderFields = objDataFlow[key].header[i];

                            let strValue =  Lib.getLedgerFieldValue(objHeaderFields,arrData,objDataFlow);
                            log.debug(stLogTitle, 'Field:'+objHeaderFields.field_id+' | Value:'+strValue);
                        }

                        for (let sublistid in objDataFlow[key].sublist)
                        {
                            for (let j = 0; j < objDataFlow[key].sublist[sublistid].length; j++)
                            {
                                let objSublistFields = objDataFlow[key].sublist[sublistid][j];
                                let strValue = Lib.getLedgerFieldValue(objSublistFields, arrData);
                                // log.debug(stLogTitle, 'Sublist:' + sublistid + ' | Field:' + objSublistFields.field_id + ' | Value:' + strValue);
                            }
                        }
                    }
                    else
                    {
                        inTransactionDataFlowId = objDataFlow[key].dataflowid
                    }
                }

                let arrFieldKeys = Lib.getFieldKey(intLedgerType,inTransactionDataFlowId);
                log.debug(stLogTitle, 'arrFieldKeys:'+JSON.stringify(arrFieldKeys));

                let objKeys = {};
                if (NSUtil.isEmpty(arrFieldKeys))
                {
                    objKeys.id = objRaw['internalid'][0].value;
                }
                objKeys.ledgertype = intLedgerType;
                let arrFieldData = [];

                for (let i = 0; i < intNumberofFields; i++)
                {
                    let strFieldId = 'custrecord_ps_imp_fld'+String(i+1).padStart(2, '0');

                    if (NSUtil.inArray(strFieldId,arrFieldKeys))
                    {
                        objKeys[i+1] = objRaw[strFieldId];
                    }
                    arrFieldData.push({
                        id: objRaw['internalid'][0].value,
                        fieldnumber: i+1,
                        value: objRaw[strFieldId]
                    });
                }

                mapContext.write({
                    key     :  objKeys,
                    value   :  arrFieldData
                });

            } catch (catchError) {
                let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);
            }
            log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
        };

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
            let objKey = JSON.parse(context.key);
            let objValue = context.values;
            let stLogTitle = 'reduce ('+JSON.stringify(objKey)+')';
            log.debug(stLogTitle, 'objKey:'+JSON.stringify(objKey)+' | objValue:'+JSON.stringify(objValue));

            try
            {
                let objRecordType = Lib.getRecordType();
                let objSublistId = Lib.getSublistFields();

                // EMC updated
                let strRecordType;
                let objDataFlow = Lib.getDataFlow(objKey.ledgertype,objRecordType,objSublistId);


                for (let key in objDataFlow)
                {
                    if (objDataFlow[key].ismastertable === false)
                    {
                        // EMC updated: e.g., Billing Rate Card record has static sublist lines.
                        let isStaticSublist = objDataFlow[key].hasstaticsublist;

                        let arrLedgerRecordId = [];
                        // EMC updated
                        strRecordType = key;
                        // EMC updated 2.0
                        log.debug('Working on record update. objDataFlow[key].header[0].field_id',objDataFlow[key].header[0].field_id) // field label ('external id')

                        let intExternalId = Lib.getLedgerFieldValue(objDataFlow[key].header[0],JSON.parse(objValue[0]),objDataFlow) // Assumption: Field 1 value will always be an external id.

                        log.debug('Working on record update. Lib.doesRecordExist(strRecordType, intExternalId)', Lib.doesRecordExist(strRecordType, intExternalId));


                        // EMC updated 2.0
                        let recTransaction;
                        let idRecIfExist = Lib.doesRecordExist(strRecordType, intExternalId);

                        if(idRecIfExist === false){

                            // EMC updated
                            recTransaction = isStaticSublist ? record.create({
                                type: strRecordType
                            }) : record.create({
                                type: strRecordType,
                                isDynamic: true
                            });
                        } else {
                            // EMC updated 2.0
                            recTransaction = isStaticSublist ? record.load({
                                type: strRecordType,
                                id: idRecIfExist,
                            }) : record.load({
                                type: strRecordType,
                                id: idRecIfExist,
                                isDynamic: true
                            });
                            log.debug('Working on record update. Record exists', recTransaction);
                        }




                        for (let i = 0; i < objDataFlow[key].header.length; i++)
                        {
                            let objHeaderFields = objDataFlow[key].header[i];
                            let arrParsedHeaderFields = JSON.parse(objValue[0]);
                            let strValue =  Lib.getLedgerFieldValue(objHeaderFields,arrParsedHeaderFields,objDataFlow);

                            log.debug(stLogTitle, 'Field:'+objHeaderFields.field_id+' | Value:'+strValue);

                            recTransaction.setValue({
                                fieldId: objHeaderFields.field_id,
                                value: strValue
                            });

                            // EMC updated: if sublist does not exist, push header field ids to arrLedgerRecordId.
                            if(NSUtil.isEmpty(objDataFlow[key].sublist) && !NSUtil.inArray(arrParsedHeaderFields[0].id,arrLedgerRecordId)){
                                arrLedgerRecordId.push(arrParsedHeaderFields[0].id);
                            }
                        }



                        for (let sublistid in objDataFlow[key].sublist)
                        {

                            // EMC updated
                            if(!isStaticSublist){
                                recTransaction.selectNewLine({ sublistId: sublistid});
                            }

                            let intLineNumber;

                            for (let i = 0; i < objValue.length; i++)
                            {
                                let arrParsedSublistFields = JSON.parse(objValue[i]);

                                for (let j = 0; j < objDataFlow[key].sublist[sublistid].length; j++)
                                {
                                    let objSublistFields = objDataFlow[key].sublist[sublistid][j];
                                    let strValue = Lib.getLedgerFieldValue(objSublistFields,arrParsedSublistFields,objDataFlow);
                                    log.debug(stLogTitle, 'Sublist:'+sublistid+' | Field:'+objSublistFields.field_id+' | Value:'+strValue);

                                    // EMC updated: updating static sublist line such as Billing Rate Card
                                    if(!isStaticSublist){
                                        recTransaction.setCurrentSublistValue({
                                            sublistId: sublistid,
                                            fieldId: objSublistFields.field_id,
                                            value: strValue
                                        });
                                    } else {

                                        let intSublistSearchId = runtime.getCurrentScript().getParameter('custscript_static_sublist_lines');
                                        let arrData = NSUtil.search('', intSublistSearchId, null, null);

                                        intLineNumber = Lib.getStaticSublistLineNumber(arrData, strRecordType, sublistid, strValue, intLineNumber);
                                    }
                                }

                                // EMC updated
                                if(isStaticSublist){
                                    for (let o = 0; o < objDataFlow[key].sublist[sublistid].length; o++)
                                    {
                                        let objSublistFields = objDataFlow[key].sublist[sublistid][o];
                                        let strValue = Lib.getLedgerFieldValue(objSublistFields,arrParsedSublistFields,objDataFlow);

                                        recTransaction.setSublistValue({
                                            sublistId: sublistid,
                                            fieldId: objSublistFields.field_id,
                                            line: intLineNumber,
                                            value: strValue
                                        });



                                    }
                                }

                                if (!NSUtil.inArray(arrParsedSublistFields[0].id,arrLedgerRecordId))
                                {
                                    arrLedgerRecordId.push(arrParsedSublistFields[0].id);
                                }

                                // EMC updated
                                if(!isStaticSublist) {
                                    recTransaction.commitLine({ sublistId: sublistid});
                                }
                            }
                        }
                        let intRecordId = recTransaction.save();
                        log.audit(stLogTitle, 'Created Record: '+recTransaction.type+':'+intRecordId);

                        if (intRecordId)
                        {

                            for (let i=0; i<arrLedgerRecordId.length; i++)
                            {
                                let intLedgerId = record.submitFields({
                                    type: 'customrecord_ps_imptypimp',
                                    id: arrLedgerRecordId[i],
                                    values: {
                                        custrecord_ps_imp_processed: true
                                    }
                                });
                            }
                        }
                    }
                }
            }
            catch (catchError)
            {
                var stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);

                // EMC updated: If duplicate detected, mark processed checkbox to true
                if(catchError.name === 'DUP_RCRD'){
                    log.error("Duplicate detected.");
                    record.submitFields({
                        type: 'customrecord_ps_imptypimp',
                        id: objKey.id,
                        values: {
                            custrecord_ps_imp_processed: true
                        }
                    });
                }
            }
            log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
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
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');
            try {
                let type = summaryContext.toString();
                log.audit(stLogTitle, 'Type = ' + type +
                    ' | Usage Consumed = ' + summaryContext.usage +
                    ' | Concurrency Number = ' + summaryContext.concurrency +
                    ' | Number of Yields = ' + summaryContext.yields);
            } catch (e) {
                log.error(stLogTitle, JSON.stringify(e));
                throw e.message;
            }
            log.debug(stLogTitle, '**** END: Entry Point Invocation ****');
        };

        EntryPoint.config = {retryCount: 0, exitOnError: false};


        return EntryPoint;
    });