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
                log.debug("scriptObj.getParameter({name: custscript_nspsw_tos})", scriptObj.getParameter({name: 'custscript_nspsw_tos'}))
                log.debug("scriptObj.getParameter({name: custscript_nspsw_old_status})", scriptObj.getParameter({name: 'custscript_nspsw_old_status'}))
                log.debug("scriptObj.getParameter({name: custscript_nspsw_new_status})", scriptObj.getParameter({name: 'custscript_nspsw_new_status'}))


                log.debug("trying to return")

                var TOs = JSON.parse(scriptObj.getParameter({name: 'custscript_nspsw_tos'}))
                log.debug("TOs", TOs)
                log.debug("TOs.length", TOs.length)
                log.debug("TOs.isArray", TOs.isArray)
                return TOs
            } catch (error) {
                log.error({title: "getInputData error", details: error.toString()});
            }
        }
        const map = (context) => {
            try {
                log.debug({title: 'map Results', details: context});
                log.debug({title: 'Value', details: context.value});

                context.write({
                    key: context.value,
                    value: context.value
                });


            } catch (error) {
                log.error({title: "map error", details: error.toString()});
            }
        }

        const reduce = (reduceContext) => {
            try {
                let contextResults = reduceContext.values;
                log.debug({title: 'Context Results', details: contextResults});

                let scriptObj = runtime.getCurrentScript();
                var newStatus = scriptObj.getParameter({name: 'custscript_nspsw_new_status'})
                log.debug('newStatus',newStatus)

                var oldStatus = scriptObj.getParameter({name: 'custscript_nspsw_old_status'})
                log.debug('oldStatus',oldStatus)

                var lines = JSON.parse(scriptObj.getParameter({name: 'custscript_nspsw_lines'}))
                log.debug('lines',lines)
                if(newStatus == 'B' && oldStatus == 'A'){
                    var objRecord = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: reduceContext.key,
                        isDynamic: true,
                    });
                    objRecord.setValue({
                        fieldId: 'orderstatus',
                        value: "B",
                        ignoreFieldChange: true
                    });
                    objRecord.setValue({
                        fieldId: 'firmed',
                        value: true,
                        ignoreFieldChange: true
                    });
                    objRecord.save();
                }

                if(newStatus == 'C' ||newStatus == 'closed'){
                    var objRecord = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: reduceContext.key,
                        isDynamic: false,
                    });
                    var numLines = objRecord.getLineCount({
                        sublistId: 'item'
                    });
                    for (var i = 0; i < numLines; i++) {
                        var line = objRecord.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_lineuniquekey',
                            value: lines[i]
                        });
                        objRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: true,
                            line: line,
                            ignoreFieldChange: true
                        });
                    }
                    /*objRecord.setValue({
                        fieldId: 'orderstatus',
                        value: "C",
                        ignoreFieldChange: true
                    });*/
                    objRecord.save();
                }

                if(newStatus == 'update'){
                  log.debug("update use case:",reduceContext.key)
                    var objRecord = record.load({
                        type: record.Type.TRANSFER_ORDER,
                        id: reduceContext.key,
                        isDynamic: true,
                    });
                    
                    var numLines = objRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < numLines; i++) {
                            var soID = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_salesorder',
                                line: i
                            });
                            log.debug('soID: ', soID);
                            var soLineID = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_lineuniquekey',
                                line: i
                            });
                            log.debug('soLineID: ', soLineID);

                          var salesOrder = record.load({
                              type: record.Type.SALES_ORDER,
                              id: soID,
                              isDynamic: false,
                          });
                          
                          var lineNumber = salesOrder.findSublistLineWithValue({
                              sublistId: 'item',
                              fieldId: 'lineuniquekey',
                              value: soLineID
                          });
                          log.debug("SO line number:",lineNumber)

                          log.debug("scriptObj.getParameter({name: 	custscript_nspsw_so_config})", scriptObj.getParameter({name: 'custscript_nspsw_so_config'}))
                          log.debug("scriptObj.getParameter({name: custscript_nspsw_to_config})", scriptObj.getParameter({name: 'custscript_nspsw_to_config'}))
                    var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",scriptObj.getParameter({name: 'custscript_nspsw_so_config'})],
                                "AND", 
                                ["custrecord_conf_ato_mapping_sourcesub","isempty",""]
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

                        var destinationSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetsub'
                        });
                        log.debug('destinationSub',destinationSub)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });
                        if(!sourceID){
                            //default value
                          log.debug("1")
                          if(!destinationSub){
                            if(defaultValue){
                              objRecord.setValue({
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                            }
                          }
                          else{
                            objRecord.selectLine({
                                sublistId: destinationSub,
                                line: i
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                            objRecord.commitLine({
                                sublistId: destinationSub
                            });
                            /*if(defaultValue){
                              objRecord.setSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                                line: i
                            });
                            }*/
                            
                          }
                            
                        }
                        else if(!destinationSub){
                          log.debug("2")
                            var Hold = salesOrder.getValue({
                                fieldId: sourceID
                            });
                            log.debug('hold', Hold)
                          if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                          if(Hold){
                            objRecord.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                          }
                            
                        }
                        else{
                          log.debug("3")
                            var Hold = salesOrder.getValue({
                                fieldId: sourceID
                            });
                            log.debug('hold',Hold)
                            if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            objRecord.selectLine({
                                sublistId: destinationSub,
                                line: i
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: Hold,
                            });
                            objRecord.commitLine({
                                sublistId: destinationSub
                            });
                          /*if(Hold){
                            objRecord.setSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                                line: i
                            });
                          }*/
                            
                        }
                        return true;
                    });

                    var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                        type: "customrecord_ns_psw_conf_ato_mapping",
                        filters:
                            [
                                ["custrecord_conf_ato_mapping_parent","anyof",scriptObj.getParameter({name: 'custscript_nspsw_so_config'})],
                                "AND", 
                                ["custrecord_conf_ato_mapping_sourcesub","isnotempty",""]
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

                        var destinationSub = result.getValue({
                            name: 'custrecord_conf_ato_mapping_targetsub'
                        });
                        log.debug('destinationSub',destinationSub)

                        var defaultValue = result.getValue({
                            name: 'custrecord_conf_ato_mapping_default'
                        });

                        var adj = result.getValue({
                            name: 'custrecord_conf_ato_mapping_adjustment'
                        });
                        if(!sourceID){
                          log.debug("1")
                            //default value
                          if(!destinationSub){
                            if(defaultValue){
                            objRecord.setValue({
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                            }
                          }
                          else{
                            objRecord.selectLine({
                                sublistId: destinationSub,
                                line: i
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                            });
                            objRecord.commitLine({
                                sublistId: destinationSub
                            });
                            /*if(defaultValue ){
                            objRecord.setSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                                line: i
                            });
                            }*/
                          }
                            
                        }
                        else if(!destinationSub){
                          log.debug("2")
                          log.debug("line Number:",lineNumber)
                            var Hold = salesOrder.getSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                                line: lineNumber
                            });
                            log.debug('hold', Hold)
                          if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                          if(Hold){
                            objRecord.setValue({
                                fieldId: destinationID,
                                value: Hold,
                            });
                          }
                            
                        }
                        else{
                          log.debug("3")
                          log.debug("line Number:",lineNumber)
                            var Hold = salesOrder.getSublistValue({
                                sublistId: sourceSub,
                                fieldId: sourceID,
                                line: lineNumber
                            });
                            log.debug('hold',Hold)
                          if(!isEmpty(adj)){
                              Hold = Hold + adj;
                            }
                            objRecord.selectLine({
                                sublistId: destinationSub,
                                line: i
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: Hold,
                            });
                            objRecord.commitLine({
                                sublistId: destinationSub
                            });
                            /*if(Hold){
                            objRecord.setSublistValue({
                                sublistId: destinationSub,
                                fieldId: destinationID,
                                value: defaultValue,
                                line: i
                            });
                          }*/
                            
                        }
                      log.debug("end for")
                        return true;
                      
                    });      
                        }
                  log.debug("try save")
                  /*objRecord.setValue({
                                fieldId: 'total',
                                value: 190,
                            });*/
                  objRecord.save();
                }
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