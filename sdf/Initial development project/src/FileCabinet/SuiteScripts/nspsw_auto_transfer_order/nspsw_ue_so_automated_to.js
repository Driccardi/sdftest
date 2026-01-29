/**
 *	Copyright (c) ${YEAR}, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/https', 'N/error', 'N/task', 'N/search', 'N/ui/serverWidget'],
    /**
     * @param {record} record
     */
    function(record, runtime, https, error, task, search, serverWidget) {
        /**
         * @name obj_features_std_cost
         * Set of NetSuite Features used in Standard Costing
         * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
         */
        const obj_features_std_cost = Object.freeze({
            autoLocAssign: "autolocationassignment"
        });

        function invalidRecordError(){
            const err = error.create({
                name: 'INVALID_Transaction',
                message: 'To quantity must be less than the line quantity.',
                notifyOff: true
            });

            throw err;
        };

        function isEmpty(value) {
            if (value == null || value == undefined || value == 'undefined' || value == '' || value == 0) {
                return true;
            }
            return false;
        }
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

           try {
            if (scriptContext.type === scriptContext.UserEventType.EDIT){
                var numLines = scriptContext.newRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug("numLines:",numLines)
                for (var i = 0; i < numLines; i++) {


                    var transferOrder = scriptContext.newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_psw_transferorder',
                        line: i
                    });
                    log.debug("transferOrder:",transferOrder)
                    if(!transferOrder){
                        continue;
                    }
                    else{
                        var TO = record.load({
                            type: record.Type.TRANSFER_ORDER,
                            id: transferOrder,
                            isDynamic: true,
                        });
                        var status = TO.getValue({
                            fieldId: 'orderstatus'
                        });
                        if(status == 'A' || status == 'B'){
                            var form = scriptContext.form;
                            var objField = form.getField({
                                id: 'location'
                            });
                            objField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                            break;
                        }
                    }
                }
            }
             } catch (error) {
              log.debug("error occured", error);
          }
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {


        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {

              
                log.debug("after submit")


                if (scriptContext.type === scriptContext.UserEventType.CREATE){
                    var objRecord = scriptContext.newRecord;

                    var featureInEffect = runtime.isFeatureInEffect({
                        feature: obj_features_std_cost.autoLocAssign
                    });
                    //log.debug('auto location assignment feature is enabled: ', featureInEffect);

                    var callMapReduce = 0;
                    if(featureInEffect){
                        log.audit("Automatic Location Assignment enabled. Terminating execution of Automated Transfer Order for Sales Order"+objRecord.id)
                    }
                    else{
                        var numLines = objRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < numLines; i++) {
                            var fromLocation = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferfromlocation',
                                line: i
                            });
                            //log.debug('fromLocation: ', fromLocation);
                            if(!fromLocation){
                                continue;
                            }
                            else{
                                var toQuantity = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ns_psw_transferqty',
                                    line: i
                                });
                                //log.debug('toQuantity: ', toQuantity);

                                var soQuantity = objRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: i
                                });
                                //log.debug('soQuantity: ', soQuantity);
                                if(toQuantity>soQuantity){
                                    invalidRecordError();
                                }
                            }
                        }
                        var mySearch = search.load({
                            id: 'customsearch_ns_psw_auto_to_so_new'
                        });
                        var idFilter = search.createFilter({
                            name:'internalid',
                            operator: search.Operator.ANYOF,
                            values: scriptContext.newRecord.id
                        });

                       // Add the filter to the search
                        mySearch.filters.push(idFilter);
                      
                        var searchResultCount = parseInt(mySearch.runPaged().count);
                        log.debug("salesorderSearchObj result count",searchResultCount);
                        var scriptObj = runtime.getCurrentScript();
                        var configRec = parseInt(scriptObj.getParameter({name: 'custscript_nspsw_config_record_so'}))
                        var lookUp = search.lookupFields({
                          type: 'customrecord_ns_psw_conf_autotransferord',
                          id: configRec,
                          columns: ['custrecord_conf_ato_maxtocreate']
                        });
                        log.debug('max to create',lookUp.custrecord_conf_ato_maxtocreate);
                        var maxToCreate = parseInt(lookUp.custrecord_conf_ato_maxtocreate)
                        log.debug("maxToCreate",maxToCreate);

                        if(maxToCreate<searchResultCount){
                          callMapReduce = 1;
                        }
                        else{
                          //create them here
                          var salesOrder = record.load({
                              type: record.Type.SALES_ORDER,
                              id: scriptContext.newRecord.id,
                              isDynamic: false,
                          });
                          mySearch.run().each(function(result){
                             // .run().each has a limit of 4,000 results
                            log.debug('result:',result)
                            log.debug('result values:',result.getValue({ name : 'custcol_ns_psw_transferfromlocation', summary : search.Summary.GROUP }));
                            var currentLoc = result.getValue({ name : 'custcol_ns_psw_transferfromlocation', summary : search.Summary.GROUP });
                            var incoterm = 1;
                            var transferOrder = record.create({
                                type: record.Type.TRANSFER_ORDER,
                                isDynamic: true
                            });
                            transferOrder.setValue({
                                fieldId: 'incoterm',
                                value: incoterm
                            }); 
                            var subsidiary = objRecord.getValue({
                                fieldId: 'subsidiary'
                            });
                            var statusSO = objRecord.getValue({
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
                            for (var i = 0; i < numLines; i++) {
                               var fromLocation = objRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferfromlocation',
                                line: i
                              });
                               if(fromLocation==currentLoc){
                                 linesToUpdate.push(i)
                                 transferOrder.selectNewLine({
                                     sublistId: 'item'
                                 });
                                 var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                                       type: "customrecord_ns_psw_conf_ato_mapping",
                                       filters:
                                           [
                                               ["custrecord_conf_ato_mapping_parent","anyof",configRec],
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
                                           var Hold = objRecord.getValue({
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
                                           var Hold = objRecord.getSublistValue({
                                               sublistId: sourceSub,
                                               fieldId: sourceID,
                                               line: (i)
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
                                                ["custrecord_conf_ato_mapping_parent","anyof",configRec],
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
                                            var Hold = objRecord.getValue({
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
                                            var Hold = objRecord.getSublistValue({
                                                sublistId: sourceSub,
                                                fieldId: sourceID,
                                                line: (i)
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
                                 transferOrder.setCurrentSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'custcol_ns_psw_salesorder',
                                     value: scriptContext.newRecord.id
                                 });
                                 log.debug("commit line")

                                 transferOrder.commitLine({
                                     sublistId: 'item'
                                 });
                               }
                             }
                             var TOID = transferOrder.save();
                             for (var j = 0; j < linesToUpdate.length; j++) {
                                   salesOrder.setSublistValue({
                                       sublistId: "item",
                                       fieldId: "custcol_ns_psw_transferorder",
                                       value: TOID,
                                       line: parseInt(linesToUpdate[j])
                                   });
                               }
                             return true;
                          });
                          salesOrder.save();
                        }
                    }
                    log.debug("callMapReduce",callMapReduce)
                    if(callMapReduce==1){
                        var scriptTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE
                        });
                        scriptTask.scriptId = 'customscript_nspsw_mr_automated_to';
                        scriptTask.deploymentId = 'customdeploy_nspsw_mr_auto_to';
                        scriptTask.params = {custscript_nspsw_so_id : objRecord.id};
                        var scriptTaskId = scriptTask.submit();
                    }
                }
                else{



                    log.debug("scriptContext.UserEventType",scriptContext.UserEventType)

                    var scriptObj = runtime.getCurrentScript();
                    var configRec = parseInt(scriptObj.getParameter({name: 'custscript_nspsw_config_record_so'}))
                    var lookUp = search.lookupFields({
                      type: 'customrecord_ns_psw_conf_autotransferord',
                      id: configRec,
                      columns: ['custrecord_conf_ato_maxtoupdate']
                    });
                    log.debug('max to edit',lookUp.custrecord_conf_ato_maxtoupdate);
                    var maxToEdit = parseInt(lookUp.custrecord_conf_ato_maxtoupdate)
                    log.debug("maxToEdit",maxToEdit);
                  
                    var TOs = []
                    //compare old and new values of status
                    var newRecord = scriptContext.newRecord;
                    var oldRecord = scriptContext.oldRecord;

                    var newStatus = newRecord.getValue({
                        fieldId: 'orderstatus'
                    });
                    log.debug('newStatus',newStatus)

                    var oldStatus = oldRecord.getValue({
                        fieldId: 'orderstatus'
                    });
                    log.debug('oldStatus',oldStatus)

                    if(scriptContext.type === scriptContext.UserEventType.APPROVE){
                        //set TOs to approved
                        var numLines = newRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < numLines; i++) {
                            var TOID = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferorder',
                                line: i
                            });
                            if(!TOID){
                                continue
                            }
                            else{
                                if(TOs.indexOf(TOID)<0){
                                  TOs.push(TOID)
                                }
                            }
                        }
                        //call MR script to update TOs
                        if(TOs.length>0){
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE
                            });
                            scriptTask.scriptId = 'customscript_nspsw_mr_update_tos';
                            scriptTask.deploymentId = 'customdeploy_nspsw_mr_updates';
                            scriptTask.params = {custscript_nspsw_tos : JSON.stringify(TOs),custscript_nspsw_old_status : "A",custscript_nspsw_new_status : "B"};
                            var scriptTaskId = scriptTask.submit();
                        }
                    }
                    else if(scriptContext.type === scriptContext.UserEventType.CANCEL){
                        //set tos to closed
                        //clear config values
                        var numLines = newRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < numLines; i++) {
                            var TOID = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferorder',
                                line: i
                            });
                            if(!TOID){
                                continue
                            }
                            else{
                                if(TOs.indexOf(TOID)<0){
                                  TOs.push(TOID)
                                }
                            }
                            //call MR script to update TOs
                            
                        }
                        if(TOs.length>0){
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE
                                });
                                scriptTask.scriptId = 'customscript_nspsw_mr_update_tos';
                                scriptTask.deploymentId = 'customdeploy_nspsw_mr_updates';
                                scriptTask.params = {custscript_nspsw_tos : JSON.stringify(TOs),custscript_nspsw_old_status : 'A',custscript_nspsw_new_status : 'C'};
                                var scriptTaskId = scriptTask.submit();
                            }

                    }
                    else if(scriptContext.type === scriptContext.UserEventType.EDIT && newStatus == 'A'){
                        //create new TOs
                        //call previous map reduce script
                        var numLines = newRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < numLines; i++) {
                            var TOID = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferorder',
                                line: i
                            });
                            if(!TOID){
                                continue
                            }
                            else{
                              if(TOs.indexOf(TOID)<0){
                                TOs.push(TOID)
                              }
                                
                            }
                            
                        }

                        if(TOs.length>maxToEdit){
                          var scriptTask = task.create({
                              taskType: task.TaskType.MAP_REDUCE
                          });
                          scriptTask.scriptId = 'customscript_nspsw_mr_update_tos';
                          scriptTask.deploymentId = 'customdeploy_nspsw_mr_updates';
                          scriptTask.params = {custscript_nspsw_tos : JSON.stringify(TOs), custscript_nspsw_new_status : 'update', custscript_nspsw_so_id_mr:scriptContext.newRecord.id};
                          var scriptTaskId = scriptTask.submit();
                        }
                        else{
                          for (var j = 0; j < TOs.length; j++) {
                            var objRecord = record.load({
                                type: record.Type.TRANSFER_ORDER,
                                id: TOs[j],
                                isDynamic: true,
                            });

                            var numLines = objRecord.getLineCount({
                                sublistId: 'item'
                            });
                            for (var x = 0; x < numLines; x++) {
                              var soID = objRecord.getSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'custcol_ns_psw_salesorder',
                                  line: x
                              });
                              log.debug('soID: ', soID);
                              var soLineID = objRecord.getSublistValue({
                                  sublistId: 'item',
                                  fieldId: 'custcol_ns_psw_lineuniquekey',
                                  line: x
                              });
                              log.debug('soLineID: ', soLineID);
                              var salesOrder = record.load({
                                  type: record.Type.SALES_ORDER,
                                  id: scriptContext.newRecord.id,
                                  isDynamic: false,
                              });
                          
                              var lineNumber = salesOrder.findSublistLineWithValue({
                                  sublistId: 'item',
                                  fieldId: 'lineuniquekey',
                                  value: soLineID
                              });
                              log.debug("SO line number:",lineNumber)

                              var customrecord_ns_psw_conf_ato_mappingSearchObj = search.create({
                                   type: "customrecord_ns_psw_conf_ato_mapping",
                                   filters:
                                       [
                                           ["custrecord_conf_ato_mapping_parent","anyof",configRec],
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
                                           line: x
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
                                           line: x
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
                                           ["custrecord_conf_ato_mapping_parent","anyof",configRec],
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
                                           line: x
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
                                           line: x
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

                    
//end for

                              
                            } 
                          objRecord.save();
                          }
                        }
                    }

                  else if(scriptContext.type === scriptContext.UserEventType.CANCEL){
                       log.debug("in cancel")
                  }
                    //iterate over lines, find all lines to close

                    TOs = []
                    var numLines = newRecord.getLineCount({
                        sublistId: 'item'
                    });
                    log.debug("start for loop")
                    var Lines = []; 
                    for (var i = 0; i < numLines; i++) {
                        var closedCheck = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            line: i
                        });
                        log.debug("closedCheck",closedCheck)
                        log.debug("closedCheck ==",(closedCheck))
                        if(closedCheck){
                            var TOID = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_ns_psw_transferorder',
                                line: i
                            });
                            var lineID = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'lineuniquekey',
                                line: i
                            });
                            Lines.push(lineID)
                            TOs.push(TOID)
                        }
                        if(TOs.length>0){
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE
                            });
                            scriptTask.scriptId = 'customscript_nspsw_mr_update_tos';
                            scriptTask.deploymentId = 'customdeploy_nspsw_mr_updates';
                            scriptTask.params = {custscript_nspsw_tos : JSON.stringify(TOs),custscript_nspsw_new_status : "closed",custscript_nspsw_lines : JSON.stringify(Lines)};
                            var scriptTaskId = scriptTask.submit();
                        }
                    }

                }
            }catch (error) {
                log.debug("error occured", error);
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });