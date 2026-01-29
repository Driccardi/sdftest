/**
 *	Copyright (c) ${YEAR}, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/https'],
/**
 * @param {record} record
 */
function(record, runtime, https) {
   /**
      * @name obj_features_std_cost
      * Set of NetSuite Features used in Standard Costing
      * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
      */
     const obj_features_std_cost = Object.freeze({
         crosssubsidiary: "crosssubsidiaryfulfillment"
     });
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

        try {

          log.debug("after submit")
          var objRecord = scriptContext.newRecord;
          var objScript = runtime.getCurrentScript();

          if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT){

            var numLines = objRecord.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < numLines; i++) {
                var getLAC = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_getlocationavgcost',
                    line: i
                });
                if(getLAC){
                    var item = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug('item',item)
                     var featureInEffect = runtime.isFeatureInEffect({
                         feature: obj_features_std_cost.crosssubsidiary
                     });
                     log.debug('crosssubsidiary feature is enabled: ', featureInEffect);
                     var inventoryLocation = -1; 

                     if(featureInEffect){
                       inventoryLocation = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'inventorylocation',
                        line: i
                       });
                       log.debug('inventoryLocation',inventoryLocation);

                       if(!inventoryLocation){
                         inventoryLocation = objRecord.getSublistValue({
                           sublistId: 'item',
                           fieldId: 'location',
                           line: i
                          });
                          log.debug('inventoryLocation',inventoryLocation);
                       }

                       if(!inventoryLocation){
                         inventoryLocation = objRecord.getValue({
                            fieldId: 'location'
                         });
                         log.debug('inventoryLocation',inventoryLocation);
                       }
            
                     }
                     else{
                       inventoryLocation = objRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        line: i
                       });
                       log.debug('inventoryLocation',inventoryLocation);

                       if(!inventoryLocation){
                         inventoryLocation = objRecord.getValue({
                            fieldId: 'location'
                         });
                         log.debug('inventoryLocation',inventoryLocation);
                       }
                     }
                     if(!inventoryLocation){
                            //throw error
                     }
                     else{
                         var myUrlParameters = {
                             custscript_nspsw_item_id: item,
                             custscript_nspsw_location_id: inventoryLocation
                         }
                          var response = https.requestRestlet({
                              deploymentId: objScript.getParameter({name: 'custscript_nspsw_deployment_id'}),
                              method: 'GET',
                              scriptId: objScript.getParameter({name: 'custscript_nspsw_script_id'}),
                              urlParams: myUrlParameters
                          });
                          log.debug('response',response);
                          log.debug('response.code',response.code);
                          if(response.code=='200'){
                               log.debug("success")
                               log.debug('response.body',response.body)
                               //log.debug('response.body.results.locationaveragecost',JSON.parse(response.body).results[0].values.locationaveragecost);

                               log.debug('(JSON.parse(response.body).results).length',(JSON.parse(response.body).results).length)

                               var locationAVGCost;
                               if((JSON.parse(response.body).results).length == 0){
                                 locationAVGCost = 0;
                               }
                               else{
                                 var locationAVGCost = parseFloat(JSON.parse(response.body).results[0].values.locationaveragecost);
              
                               }
            
            
                               objRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_ns_psw_locationavgcost',
                                    value: locationAVGCost,
                                    line: i
                                 });
                               objRecord.setSublistValue({
                                   sublistId: 'item',
                                   fieldId: 'custcol_ns_psw_getlocationavgcost',
                                   value: false,
                                   line: i
                               });
                             }
                             else{
                               log.debug("error")
                             }
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
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
