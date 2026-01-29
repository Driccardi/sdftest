/*
 * Copyright (c) 1998-202 Oracle NetSuite, Inc.
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
 * @changeLog: 1.0            2025 May 15         Manuel Teodoro            Initial version.
 */

define( //using require instead for better module loading especially for the have dependencies.
    (require) =>
    {
        //Custom modules
        let nsutil = require('../Library/NSUtilvSS2.js');
        let scriptutil = require('./NSTS_MD_CommonLibrary');

        //Native Modules
        let record = require('N/record');
        let runtime = require('N/runtime');
        let search = require('N/search');
        let format = require('N/format');

        //Script parameter definition
        let PARAM_DEF =
            {
                executionid: {
                    id: 'mr_undoepu_execid',
                    optional: false
                },
                srchundoepu: {
                    id: 'mr_undoepu_search',
                    optional: false
                },
                status_inprogress: {
                    id: 'status_inprogress',
                    optional: false
                },
                status_complete: {
                    id: 'status_complete',
                    optional: false
                },
                status_error: {
                    id: 'status_error',
                    optional: false
                },
                status_cancelled: {
                    id: 'status_cancelled',
                    optional: false
                }
            }

        let EntryPoint = {};

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

            let params = scriptutil.getParameters(PARAM_DEF, true);
            let arrExecutionId = JSON.parse(params.executionid);

            let arrSearchFilter = [];
            arrSearchFilter.push(search.createFilter({
                    name: 'custbody_epu_source',
                    operator: search.Operator.ANYOF,
                    values: arrExecutionId
            }));
            let arrData = nsutil.search('',params.srchundoepu,arrSearchFilter,null);
            log.debug(stLogTitle, 'arrData count: ' + arrData.length);

            log.debug(stLogTitle, '**** END: Entry Point Invocation ****');
            return arrData;
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

            let objContextData = JSON.parse(mapContext.value);
            let objRaw = objContextData.values;
            let params = scriptutil.getParameters(PARAM_DEF, true);
            log.debug(stLogTitle, objRaw)
            let intRecordId = objRaw['internalid'][0].value;

            try
            {
                let objHeader = {
                    trandate: objRaw['trandate'],
                    subsidiary: objRaw['subsidiary'][0].value,
                    memo: objRaw['memomain']+' (Reversal)',
                    transtatus: "B",
                    custbody_epu_source: (!nsutil.isEmpty(objRaw['custbody_epu_source'][0])) ? objRaw['custbody_epu_source'][0].value : null,
                    custbody_epu_sourcehierarchy: (!nsutil.isEmpty(objRaw['custbody_epu_sourcehierarchy'][0])) ? objRaw['custbody_epu_sourcehierarchy'][0].value : null,
                    custbody_epu_sourcelowerlevel: (!nsutil.isEmpty(objRaw['custbody_epu_sourcelowerlevel'][0])) ? objRaw['custbody_epu_sourcelowerlevel'][0].value : null,
                    custbody_epu_sourceupperlevel: (!nsutil.isEmpty(objRaw['custbody_epu_sourceupperlevel'][0])) ? objRaw['custbody_epu_sourceupperlevel'][0].value : null,
                    custbody_epu_parentchild: (!nsutil.isEmpty(objRaw['custbody_epu_parentchild'][0])) ? objRaw['custbody_epu_parentchild'][0].value : null,
                    custbody_epu_ownershippercent: (!nsutil.isEmpty(objRaw['custbody_epu_ownershippercent'])) ? parseFloat(objRaw['custbody_epu_ownershippercent']) : null
                }
                let objLines = {
                    account: (!nsutil.isEmpty(objRaw['account'][0])) ? objRaw['account'][0].value : null,
                    memo: objRaw['memo'],
                    amount: parseFloat(objRaw['signedamount'])
                }
                log.debug(stLogTitle, 'objHeader:'+JSON.stringify(objHeader)+' | objLines:'+JSON.stringify(objLines));

                mapContext.write({
                    key: {
                        id: intRecordId,
                        header: objHeader
                    },
                    value: objLines
                });
            } catch (catchError) {
                let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);

                mapContext.write({
                    key: {
                        id: mapContext.key,
                        level: 'parent'
                    } ,
                    value:  {
                        error: stErrorMsg
                    }
                });
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
            let objValues = JSON.stringify(context.values);
            let stLogTitle = 'EntryPoint.reduce ('+objKey.id+')';
            log.debug(stLogTitle, 'objKey:'+JSON.stringify(objKey)+' | objValues:'+JSON.stringify(objValues));

            try
            {
                let arrLines = [];
                let objData = JSON.parse(objValues);
                log.debug(stLogTitle, 'objData:'+JSON.stringify(objData)+' | Length:'+objData.length);

                for (let i = 0; i < objData.length; i++)
                {
                    let objLineData = JSON.parse(objData[i]);
                    let intAccount = objLineData.account;
                    let strMemo = objLineData.memo;
                    let flAmount = objLineData.amount;

                    if (Math.sign(flAmount) == -1)
                    {
                        arrLines.push({
                            account: intAccount,
                            memo: strMemo,
                            debit: Math.abs(flAmount)
                        })
                    }
                    else
                    {
                        arrLines.push({
                            account: intAccount,
                            memo: strMemo,
                            credit: flAmount
                        })
                    }
                }
                let objRecordData = {
                    header: objKey.header,
                    line: arrLines
                }
                scriptutil.createEquityPickupRecord(objRecordData,objKey);
            }
            catch (catchError)
            {
                let stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);

                context.write({
                    key     :  objKey,
                    value   :  {
                        error: catchError.message
                    }
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
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');
            try
            {
                let params = scriptutil.getParameters(PARAM_DEF, true);
                let type = summaryContext.toString();
                let blIsError = false;
                let strError = '';
                log.audit(stLogTitle, 'Type = ' + type +
                    ' | Usage Consumed = ' + summaryContext.usage +
                    ' | Concurrency Number = ' + summaryContext.concurrency +
                    ' | Number of Yields = ' + summaryContext.yields);

                summaryContext.reduceSummary.errors.iterator().each(function(key, error)
                {
                    blIsError = true;
                    value = JSON.parse(error);
                    log.debug(stLogTitle, 'reduceSummary:'+JSON.stringify(value))

                    strError += '- Error: '+value.message+'\n';

                    return true;
                });

                summaryContext.mapSummary.errors.iterator().each(function(key, error)
                {
                    blIsError = true;
                    value = JSON.parse(error);
                    log.debug(stLogTitle, 'mapSummary:'+JSON.stringify(value))

                    strError += '- Error: '+value.message+'\n';

                    return true;
                });

                summaryContext.output.iterator().each(function(key, value)
                {
                    blIsError = true;
                    key = JSON.parse(key);
                    value = JSON.parse(value);

                    strError += '- Entity Ownership ID: '+key.recordid+' | Subsidiary: '+key.subsidiary+' | Error: '+value.error+'\n';

                    return true;
                });
                let blStatus = (blIsError) ? params.status_error : params.status_cancelled;

                scriptutil.updateExecutionRecord({
                    id: params.executionid,
                    status: blStatus,
                    error: strError
                });
            }
            catch (e)
            {
                log.error(stLogTitle, JSON.stringify(e));
                throw e.message;
            }
            log.debug(stLogTitle, '**** END: Entry Point Invocation ****');
        };

        EntryPoint.config = {retryCount: 0, exitOnError: false};

        return EntryPoint;
    });