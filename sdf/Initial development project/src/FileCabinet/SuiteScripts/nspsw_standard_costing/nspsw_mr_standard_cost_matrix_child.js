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
         search: "custscript_nspsw_matrix_item_search"
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

   /**
      * @name st_autoicr_mr_sub_items
      * Field ID of check box on item record to denote the Map reduce will process it.
      * @type {string}
      */
     const st_autoicr_mr_sub_items = "custitem_ns_psw_autoicr_processed";
     const getInputData = (inputContext) => {
         try {
             let featureInEffect = runtime.isFeatureInEffect({
                 feature: obj_features_std_cost.matrixitems
             });
             log.debug('matrix feature is enabled: ', featureInEffect);


             if(!featureInEffect){
               return [];
             }
             else{
               let scriptObj = runtime.getCurrentScript();
             let mySearch = search.load({
                 id: scriptObj.getParameter({name: obj_parameterIds_std_cost.search})
             });


             return mySearch
             }
             
         } catch (error) {
             log.error({title: "getInputData error", details: error.toString()});
         }
     }
   const map = (context) => {
            try {
              let itemID = JSON.parse(context.value).values.itemid;
              let includeChildren = JSON.parse(context.value).values.includechildren
              let type = JSON.parse(context.value).values.type.value
              log.debug({title: 'type', details: type});

              //change based on type
              let itemRecord;
              let featureInEffect = runtime.isFeatureInEffect({
                 feature: obj_features_std_cost.ailc
             });
             log.debug('ailc feature is enabled: ', featureInEffect);

              if(featureInEffect){
                 if(type == "InvtPart"){
                itemRecord = record.load({
                  type: record.Type.INVENTORY_ITEM, 
                  id: context.key,
                  isDynamic: false 
                });
              }
              else{
                itemRecord = record.load({
                  type: record.Type.ASSEMBLY_ITEM, 
                  id: context.key,
                  isDynamic: false 
                });
              }
                itemRecord.setValue({
                     fieldId: st_autoicr_mr_sub_items,
                     value: true
                 });
                 itemRecord.save();
               return [];
             }
              else{
                log.debug({title: 'map Results', details: context});
                log.debug({title: 'Values', details: JSON.parse(context.value).values});

              
              if(type == "InvtPart"){
                itemRecord = record.load({
                  type: record.Type.INVENTORY_ITEM, 
                  id: context.key,
                  isDynamic: false 
                });
              }
              else{
                itemRecord = record.load({
                  type: record.Type.ASSEMBLY_ITEM, 
                  id: context.key,
                  isDynamic: false 
                });
              }
              

              
              let subs = itemRecord.getValue({
                fieldId: 'subsidiary'
              });
              log.debug({title: 'subs', details: subs});

              if(includeChildren == 'T'){
                subs = lib.getSubsidiaries(subs, true);
                log.debug("subs",subs);
              }
              else{
                subs = lib.getSubsidiaries(subs, false);
                log.debug("subs",subs);
              }
              
              
              let locations = lib.getLocations(subs);
              log.debug("locations",locations);

              
              itemID = itemID.toString();
              let key;
              let payLoadObject;
              for (let i = 0; i < locations.length; i++) {
                 let key = itemID;
                 let locHold = locations[i];
                 locHold = locHold.toString();
                 key = key + locHold;
                
                payLoadObject = {
                  location: locations[i],
                  itemID: context.key,
                  type: type
                }
                
                context.write({
                        key: key,
                        value: payLoadObject,
                    });  
                 
                key = ""
            }
                  
            if(locations.length == 0) {
                itemRecord.setValue({
                     fieldId: st_autoicr_mr_sub_items,
                     value: true
                 });
                 itemRecord.save();
            }
              }
              
                


            } catch (error) {
                log.error({title: "map error", details: error.toString()});
            }
        }

     const reduce = (reduceContext) => {
         try {
             let contextResults = reduceContext.values;
             log.debug({title: 'Context Results', details: contextResults});
           let includeChildren;

             reduceContext.values.forEach(function (line) {
                    let parsedLine = JSON.parse(line)
                    log.debug('Parsed Line', parsedLine)

                    let resultsObject = {}
                    Object.keys(parsedLine).forEach(function (resultKey) {
                        resultsObject[resultKey] = !isEmpty(parsedLine[resultKey].value) ? parsedLine[resultKey].value : !isEmpty(parsedLine[resultKey].text) ? parsedLine[resultKey].text : parsedLine[resultKey]
                    })
                    log.debug('Results Object', resultsObject)
                    log.debug('Results Object.location', resultsObject.location)
                    
                    let successFlag = lib.createICR(resultsObject.location,resultsObject.type,parseInt(resultsObject.itemID));
                    log.debug("successFlag",successFlag);

               if(successFlag>0){
                 let itemRecord;
                    if(resultsObject.type == "InvtPart"){
                      itemRecord = record.load({
                          type: record.Type.INVENTORY_ITEM, 
                          id: resultsObject.itemID,
                          isDynamic: false
                    });
                  }
                  else{
                    itemRecord = record.load({
                      type: record.Type.ASSEMBLY_ITEM, 
                      id: resultsObject.itemID,
                      isDynamic: false
                    });
                  }
                 itemRecord.setValue({
                     fieldId: st_autoicr_mr_sub_items,
                     value: true
                 });
                 itemRecord.save();
               }

                    
                  
                    
                });
           //unmark checkbox
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
            if (value == null || value == undefined || value == 'undefined' || value == '') {
                return true;
            }
            return false;
        }
     return {getInputData, map, reduce, summarize}
 });