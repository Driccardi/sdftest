/**
 * Copyright (c) 1998-2022 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 *
 * Version          Date          Author               Remarks
 * 1.0              2024/09/25    john.dispirito    Initial commit
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/format', 'N/config', 'N/runtime', 'N/error', 'SuiteScripts/nspsw_standard_costing/nspsw_lib_standard_costing'],
    (record, search, format, config, runtime, error, lib) => {
        /**
         * @name obj_features_std_cost
         * Set of NetSuite Features used in Standard Costing
         * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
         */
        const obj_features_std_cost = Object.freeze({
            accounting: "ACCOUNTING",
            assemblies: "ASSEMBLIES",
            ailc: "ENHANCEDINVENTORYLOCATION",
            inventory: "INVENTORY",
            multilocation: "MULTILOCINVT",
            standardcosting: "STANDARDCOSTING",
            matrixitems: "MATRIXITEMS"
        });

        /**
         * @name obj_parameterIds_std_cost
         * Set of parameter IDs used in the Standard Costing solution
         * @type {Readonly<{costCategory: string, component: string, adjustmentAccount: string}>}
         */
        const obj_parameterIds_std_cost = Object.freeze({
            adjustmentAccount: "custscript_nspsw_adjustment_account",
            costCategory: "custscript_nspsw_cost_category",
            component: "custscript_nspsw_component",
            search: "custscript_nspsw_item_search"
        });

        /**
         * @name searchId_subsidiaries
         * Script ID of saved search to use for getting subsidiaries associated with Item record if Include Children is TRUE.
         *
         * Add searchFilter for Parent Subsidiary, operator ANYOF.
         * @type {string}
         */
        const searchId_subsidiaries = "customsearch_ns_psw_subsidiaries";

        /**
         * @name searchId_item_locations
         * Script ID of saved search to use for getting all inventory locations associated with Item record, when AILC is not enabled.
         *
         * Add searchFilter for Subsidiary, operator ANYOF.
         * @type {string}
         */
        const searchId_item_locations = "customsearch_ns_psw_autoinvcostreval_loc";

        /**
         * @name st_icr_memo
         * Memo to be used on Inventory Cost Revaluation transactions.
         * @type {string}
         */
        const st_icr_memo = "Automated zero cost revaluation";

        /**
         * @name st_autoicr_mr
         * Field ID of check box on item record to denote the Map reduce will process it.
         * @type {string}
         */
        const st_autoicr_mr = "custitem_ns_psw_autoicr_mr";
        const getInputData = (inputContext) => {
            try {
                let scriptObj = runtime.getCurrentScript();
                log.debug("scriptObj.getParameter({name: custscript_nspsw_so_id})", scriptObj.getParameter({name: 'custscript_nspsw_so_id'}))
                log.debug("scriptObj.getParameter({name: custscript_nspsw_config_record})", scriptObj.getParameter({name: 'custscript_nspsw_config_record'}))
                let mySearch = search.create({
                    type: "transaction",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                    filters:
                        [
                            ["internalid","anyof",scriptObj.getParameter({name: 'custscript_nspsw_so_id'})],
                            "AND",
                            ["mainline","is","F"],
                            "AND",
                            ["custcol_ns_psw_transferfromlocation","noneof","@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "line", label: "Line ID"}),
                            search.createColumn({name: "custcol_ns_psw_transferfromlocation", label: "Transfer From Location"})
                        ]
                });


                return mySearch
            } catch (error) {
                log.error({title: "getInputData error", details: error.toString()});
            }
        }
        const map = (context) => {
            try {
                log.debug({title: 'map Results', details: context});
                log.debug({title: 'Values', details: JSON.parse(context.value).values.custcol_ns_psw_transferfromlocation.value});

                context.write({
                    key: JSON.parse(context.value).values.custcol_ns_psw_transferfromlocation.value,
                    value: JSON.parse(context.value).values,
                });



            } catch (error) {
                log.error({title: "map error", details: error.toString()});
            }
        }


        const reduce = (reduceContext) => {
            try {
                let contextResults = reduceContext.values;
                log.debug({title: 'Context Results', details: contextResults});

                let includeChildren;

                let scriptObj = runtime.getCurrentScript();
                log.debug("scriptObj.getParameter({name: custscript_nspsw_incoterm})", scriptObj.getParameter({name: 'custscript_nspsw_incoterm'}))

                //var incoterm = scriptObj.getParameter({name: 'custscript_nspsw_incoterm'});
                var incoterm = 1;
                var transferOrder = record.create({
                    type: record.Type.TRANSFER_ORDER,
                    isDynamic: true
                });
                transferOrder.setValue({
                    fieldId: 'incoterm',
                    value: incoterm
                });


                var salesOrder = record.load({
                    type: record.Type.SALES_ORDER,
                    id: runtime.getCurrentScript().getParameter({name: 'custscript_nspsw_so_id'}),
                    isDynamic: false,
                });
                var subsidiary = salesOrder.getValue({
                    fieldId: 'subsidiary'
                });
                var statusSO = salesOrder.getValue({
                    fieldId: 'orderstatus'
                });
                transferOrder.setValue({
                    fieldId: 'orderstatus',
                    value: statusSO
                });
                if(statusSo ='A'){
                    transferOrder.setValue({
                        fieldId: 'firmed',
                        value: false
                    });
                }
                else{
                    transferOrder.setValue({
                        fieldId: 'firmed',
                        value: true
                    });
                }
                transferOrder.setValue({
                    fieldId: 'subsidiary',
                    value: subsidiary
                });
                var linesToUpdate = [];
                reduceContext.values.forEach(function (line) {
                    let parsedLine = JSON.parse(line)
                    log.debug('Parsed Line', parsedLine)

                    let resultsObject = {}
                    Object.keys(parsedLine).forEach(function (resultKey) {
                        resultsObject[resultKey] = !isEmpty(parsedLine[resultKey].value) ? parsedLine[resultKey].value : !isEmpty(parsedLine[resultKey].text) ? parsedLine[resultKey].text : parsedLine[resultKey]
                    })
                    log.debug('Results Object', resultsObject)
                    log.debug("Results 2",resultsObject.line)
                    linesToUpdate.push(resultsObject.line)


                    transferOrder.selectNewLine({
                        sublistId: 'item'
                    });
                    /*transferOrder.insertLine({
                        sublistId: 'item',
                        line: 0,
                    });*/
                    log.debug("select new line")

                    var internalID = runtime.getCurrentScript().getParameter({name: 'custscript_nspsw_config_record'});
                    log.debug('internalID', internalID)
                    var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",internalID],
                                "AND",
                                ["custrecord_conf_ato_mapping_targetsub","isempty",""]
                            ],
                        columns:
                            [
                                search.createColumn({name: "id", label: "ID"}),
                                search.createColumn({name: "scriptid", label: "Script ID"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_parent", label: "ATO Configuration"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourceid", label: "Source Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourcesub", label: "Source Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetid", label: "Target Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetsub", label: "Target Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_default", label: "Default Value"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_adjustment", label: "Adjustment"})
                            ]
                    });
                    var searchResultCount = customrecord_ns_psw_conf_ato_mappingSearchObj.runPaged().count;
                    log.debug("customrecord_ns_psw_conf_ato_mappingSearchObj result count",searchResultCount);
                    customrecord_ns_psw_conf_ato_mappingSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        //log.debug('result',result)
                        var sourceID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourceid'
                        });
                        log.debug('sourceID',sourceID)

                        var sourceSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourcesub'
                        });
                        log.debug('sourceSub',sourceSub)

                        var destinationID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetid'
                        });
                        log.debug('destinationID',destinationID)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });

                        
                        if(!sourceID){
                            //default value
                            transferOrder.setValue({
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                        }
                        else if(!sourceSub){
                            var Hold = salesOrder.getValue({
                                fieldId: sourceID
                            });
                            log.debug('hold', Hold)
                            log.debug('isEmpty(adj)', isEmpty(adj))
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            transferOrder.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                        }
                        else{
                            var Hold = salesOrder.getSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                                line: (resultsObject.line)-1
                            });
                            log.debug('hold',Hold)
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            transferOrder.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                        }
                        return true;
                    });


                    var customrecord_ns_psw_conf_ato_mappingSearchObj2 = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",internalID],
                                "AND",
                                ["custrecord_conf_ato_mapping_targetsub","isnotempty",""]
                            ],
                        columns:
                            [
                                search.createColumn({name: "id", label: "ID"}),
                                search.createColumn({name: "scriptid", label: "Script ID"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_parent", label: "ATO Configuration"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourceid", label: "Source Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourcesub", label: "Source Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetid", label: "Target Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetsub", label: "Target Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_default", label: "Default Value"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_adjustment", label: "Adjustment"})
                            ]
                    });
                    var searchResultCount = customrecord_ns_psw_conf_ato_mappingSearchObj2.runPaged().count;
                    log.debug("customrecord_ns_psw_conf_ato_mappingSearchObj result count",searchResultCount);
                    customrecord_ns_psw_conf_ato_mappingSearchObj2.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        log.debug('result',result)
                        var sourceID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourceid'
                        });
                        log.debug('sourceID',sourceID)

                        var sourceSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourcesub'
                        });
                        //log.debug('sourceSub',sourceSub)

                        var destinationID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetid'
                        });
                        //log.debug('destinationID',destinationID)

                        var destinationSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetsub'
                        });
                        //log.debug('destinationSub',destinationSub)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });
                        if(!sourceID){
                            //default value
                            transferOrder.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                        }
                        else if(!sourceSub){
                            var Hold = salesOrder.getValue({
                                fieldId: sourceID
                            });
                            log.debug('hold', Hold)
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            transferOrder.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                        }
                        else{
                            var Hold = salesOrder.getSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                                line: (resultsObject.line)-1
                            });
                            log.debug('hold',Hold)
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            transferOrder.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: Hold,
                            });
                        }
                        return true;
                    });

                    var internalID = runtime.getCurrentScript().getParameter({name: 'custscript_nspsw_config_record_to'});
                    log.debug('internalID', internalID)
                    var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",internalID],
                                "AND",
                                ["custrecord_conf_ato_mapping_targetsub","isempty",""]
                            ],
                        columns:
                            [
                                search.createColumn({name: "id", label: "ID"}),
                                search.createColumn({name: "scriptid", label: "Script ID"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_parent", label: "ATO Configuration"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourceid", label: "Source Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourcesub", label: "Source Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetid", label: "Target Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetsub", label: "Target Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_default", label: "Default Value"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_adjustment", label: "Adjustment"})
                            ]
                    });
                    var searchResultCount = customrecord_ns_psw_conf_ato_mappingSearchObj.runPaged().count;
                    log.debug("customrecord_ns_psw_conf_ato_mappingSearchObj result count",searchResultCount);
                    customrecord_ns_psw_conf_ato_mappingSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        //log.debug('result',result)
                        var sourceID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourceid'
                        });
                        log.debug('sourceID',sourceID)

                        var sourceSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourcesub'
                        });
                        //log.debug('sourceSub',sourceSub)

                        var destinationID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetid'
                        });
                        //log.debug('sourceID',sourceID)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });
                        if(!sourceID){
                            //default value
                            salesOrder.setValue({
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                        }
                        else if(!sourceSub){
                            var Hold = transferOrder.getValue({
                                fieldId: sourceID
                            });
                            log.debug('hold', Hold)
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            salesOrder.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                        }
                        else{
                            var Hold = transferOrder.getCurrentSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                            });
                            log.debug('hold',Hold)
                            if(!isEmpty(adj)){
                                  Hold = Hold + adj;
                                }
                            salesOrder.setValue({
                                fieldId: destinationID,
                                value: Hold
                            });
                        }
                        return true;
                    });


                    var customrecord_ns_psw_conf_ato_mappingSearchObj2 = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",internalID],
                                "AND",
                                ["custrecord_conf_ato_mapping_targetsub","isnotempty",""]
                            ],
                        columns:
                            [
                                search.createColumn({name: "id", label: "ID"}),
                                search.createColumn({name: "scriptid", label: "Script ID"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_parent", label: "ATO Configuration"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourceid", label: "Source Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_sourcesub", label: "Source Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetid", label: "Target Field Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_targetsub", label: "Target Sublist Id"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_default", label: "Default Value"}),
                                search.createColumn({name: "custrecord_conf_ato_mapping_adjustment", label: "Adjustment"})
                            ]
                    });
                    var searchResultCount = customrecord_ns_psw_conf_ato_mappingSearchObj2.runPaged().count;
                    log.debug("customrecord_ns_psw_conf_ato_mappingSearchObj result count",searchResultCount);
                    customrecord_ns_psw_conf_ato_mappingSearchObj2.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        log.debug('result',result)
                        var sourceID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourceid'
                        });
                        log.debug('sourceID',sourceID)

                        var sourceSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_sourcesub'
                        });
                        log.debug('sourceSub',sourceSub)

                        var destinationID = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetid'
                        });
                        log.debug('destinationID',destinationID)

                        var destinationSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetsub'
                        });
                        log.debug('destinationSub',destinationSub)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });
                        log.debug('defaultValue',defaultValue)

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });
                        if(!sourceID){
                            //default value
                            log.debug("1")
                            if(destinationSub){
                                salesOrder.setSublistValue({
                                    sublistId: destinationSub,
                                    fieldId: destinationID,
                                    value: defaultValue,
                                    line: (resultsObject.line)-1
                                });
                            }
                            else{
                                log.debug('hold', Hold)
                                salesOrder.setValue({
                                    fieldId: destinationID,
                                    value: defaultValue
                                });
                            }
                        }
                        else if(!sourceSub){
                            log.debug("2")

                            if(destinationSub){
                                var Hold = transferOrder.getValue({
                                    fieldId: sourceID
                                });
                                log.debug("hold:", Hold)

                                if(!isEmpty(adj)){
                                  Hold = Hold + adj;
                                }
                                salesOrder.setSublistValue({
                                    sublistId: destinationSub,
                                    fieldId: destinationID,
                                    value: Hold,
                                    line: (resultsObject.line)-1
                                });
                            }
                            else{
                                var Hold = transferOrder.getValue({
                                    fieldId: sourceID
                                });
                                log.debug("hold:", Hold)
                                if(!isEmpty(adj)){
                                  Hold = Hold + adj;
                                }
                                salesOrder.setValue({
                                    fieldId: destinationID,
                                    value: Hold
                                });
                            }

                        }
                        else{
                            log.debug("3")
                            var Hold = transferOrder.getCurrentSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                            });
                            log.debug('hold',Hold)
                            if(!Hold){
                                Hold = "";
                            }
                            if(!isEmpty(adj)){
                                  Hold = Hold + adj;
                                }
                            if(destinationSub){
                                salesOrder.setSublistValue({
                                    sublistId: destinationSub,
                                    fieldId: destinationID,
                                    value: Hold,
                                    line: (resultsObject.line)-1
                                });
                            }
                            else{
                                log.debug('hold', Hold)
                                salesOrder.setValue({
                                    fieldId: destinationID,
                                    value: Hold
                                });
                            }
                        }
                        return true;
                    });

                    transferOrder.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_psw_salesorder',
                        value: runtime.getCurrentScript().getParameter({name: 'custscript_nspsw_so_id'})
                    });
                    log.debug("commit line")

                    transferOrder.commitLine({
                        sublistId: 'item'
                    });
                    var numberOfLinesCheck = transferOrder.getLineCount({ sublistId: 'item' })
                    log.debug("numberOfLinesCheck",numberOfLinesCheck)
                });
                var TOID = transferOrder.save();

                log.debug("TOID",TOID)
                /*log.debug("line",(resultsObject.values.line)-1)
                salesOrder.setSublistValue({
                       sublistId: "item",
                       fieldId: "custcol_ns_psw_transferorder",
                       value: TOID,
                       line: (resultsObject.line)-1,
                       ignoreFieldChange: true
                   });*/
                //go over sales order lines, update the transfer orders to the lines

                for (let i = 0; i < linesToUpdate.length; i++) {
                    salesOrder.setSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_ns_psw_transferorder",
                        value: TOID,
                        line: parseInt(linesToUpdate[i])-1
                    });
                }
                salesOrder.save();


            } catch (error) {
                log.error({title: "reduce error", details: error.toString()});
            }
        }

        const summarize = (summaryContext) => {
            try {
                let type = summaryContext.toString();
                log.audit({
                    title: 'Summary ' + type,
                    details: 'Usage Consumed: ' + summaryContext.usage + ' | Number of Queues: ' + summaryContext.concurrency + ' | Number of Yields: ' + summaryContext.yields
                });

                summaryContext.output.iterator().each(function (key, value) {
                    log.audit({title: 'Summary Output[' + key + ']', details: JSON.stringify(value)});
                    return true;
                });
            } catch (error) {
                log.error({title: "summarize error", details: error.toString()});
            }
        }
        function isEmpty(value) {
            if (value == null || value == undefined || value == 'undefined' || value == '' || value == 0) {
                return true;
            }
            return false;
        }
        return {getInputData, map, reduce, summarize}
    });