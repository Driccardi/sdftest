/** 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/record', 'N/runtime', 'N/search', 'SuiteScripts/nspsw_standard_costing/nspsw_lib_standard_costing'],
 /**
  * @param{record} record
  * @param{runtime} runtime
  * @param{sftp} sftp
  */
 (record, runtime, search, lib) => {
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

   /**
      * @name st_autoicr_mr_sub_items
      * Field ID of check box on item record to denote the Map reduce will process the sub item or not.
      * @type {string}
      */
     const st_autoicr_mr_sub_items = "custitem_ns_psw_autoicr_processed";
   
     /**
      * Defines the function definition that is executed before record is loaded.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @param {Form} scriptContext.form - Current form
      * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
      * @since 2015.2
      */
     const beforeLoad = (scriptContext) => {

     }

     /**
      * Defines the function definition that is executed before record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const beforeSubmit = (scriptContext) => {
        
     }

     /**
      * Defines the function definition that is executed after record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const afterSubmit = (scriptContext) => {

       try {
          log.debug("after submit")
         let threshold = 1;
         let acceptedTypes = ["InvtPart","Assembly"]
         let objRecord = scriptContext.newRecord;
         let type = objRecord.type;
         let ID = objRecord.id;
          log.debug("objRecord.id",objRecord.id);
          log.debug("objRecord.type",objRecord.type);
       if (scriptContext.type === scriptContext.UserEventType.CREATE){
         if(!ID){
           return;
         }
         else{
           let costingMethod = objRecord.getValue({
               fieldId: 'costingmethod'
           });
           log.debug("costingMethod",costingMethod);

           let itemType = objRecord.getValue({
               fieldId: 'itemtype'
           });
           log.debug("itemType",itemType);

           if(costingMethod == "STANDARD" && acceptedTypes.includes(itemType)){
             log.debug("in if");
             let featureInEffect = runtime.isFeatureInEffect({
                 feature: obj_features_std_cost.ailc
             });
             log.debug('AILC feature is enabled: ', featureInEffect);
             if(featureInEffect){
               return;
             }
             else{
                 let matrixFeatureInEffect = runtime.isFeatureInEffect({
                     feature: obj_features_std_cost.matrixitems
                 });
                 log.debug('matrix item feature is enabled: ', matrixFeatureInEffect);
                 if(matrixFeatureInEffect){
                     let matrixParent = lib.checkForMatrixParent(ID);
                     log.debug("MatrixParent",matrixParent)
                     if(!matrixParent){
                         //how to check if item is a matrix parent
                         log.debug("in else")
                         let subsidiary = objRecord.getValue({
                             fieldId: 'subsidiary'
                         });
                         log.debug("subsidiary",subsidiary);

                         let includeChildren = objRecord.getValue({
                             fieldId: 'includechildren'
                         });
                         log.debug("includeChildren",includeChildren);


                         let subs = lib.getSubsidiaries(subsidiary, includeChildren);
                         log.debug("subs",subs);

                         let locations = lib.getLocations(subs);
                         log.debug("locations",locations);

                         if(locations.length < 1){
                             log.audit("no locations, ending execution");
                             return;
                         }
                         else if(locations.length > threshold){
                             //set flag to kick off MR script
                             log.audit("Too many locations, set flag to kick off MR script");
                             let itemRecord = record.load({
                                 type: type,
                                 id: ID,
                                 isDynamic: true,
                             });
                             itemRecord.setValue({
                                 fieldId: st_autoicr_mr,
                                 value: true,
                                 ignoreFieldChange: true
                             });
                             itemRecord.save();
                             return;
                         }
                         else{
                             //create ICR
                             for (let i = 0; i < locations.length; i++) {
                                 let successFlag = lib.createICR(locations[i],itemType,ID);
                                 log.debug("successFlag",successFlag);
                             }

                         }
                     }
                     else{
                         log.debug("matrix item, stop execution");
                         return;
                     }
                 }
               else {
                     let subsidiary = objRecord.getValue({
                         fieldId: 'subsidiary'
                     });
                     log.debug("subsidiary",subsidiary);

                     let includeChildren = objRecord.getValue({
                         fieldId: 'includechildren'
                     });
                     log.debug("includeChildren",includeChildren);


                     let subs = lib.getSubsidiaries(subsidiary, includeChildren);
                     log.debug("subs",subs);

                     let locations = lib.getLocations(subs);
                     log.debug("locations",locations);

                     if(locations.length < 1){
                         log.audit("no locations, ending execution");
                         return;
                     }
                     else if(locations.length > threshold){
                         //set flag to kick off MR script
                         log.audit("Too many locations, set flag to kick off MR script");
                         let itemRecord = record.load({
                             type: type,
                             id: ID,
                             isDynamic: true,
                         });
                         itemRecord.setValue({
                             fieldId: st_autoicr_mr,
                             value: true,
                             ignoreFieldChange: true
                         });
                         itemRecord.save();
                         return;
                     }
                     else{
                         //create ICR
                         for (let i = 0; i < locations.length; i++) {
                             let successFlag = lib.createICR(locations[i],itemType,ID);
                             log.debug("successFlag",successFlag);
                         }

                     }
                 }
             }
           }
           else{
             return;
           }
         }  

           
           
       }
        } catch (error) {
            log.debug("error occured", error);
        }
         

     }

     

     return {beforeLoad, beforeSubmit, afterSubmit}

 });