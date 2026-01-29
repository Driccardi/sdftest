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
      * @name st_autoicr_mr
      * Field ID of check box on item record to denote the Map reduce will process it.
      * @type {string}
      */
     const st_icr_id = "custrecord_ns_psw_ailc_autoicr";
      
      
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
           
            let objRecord = scriptContext.newRecord;
            
            let ID = objRecord.id;
             log.debug("objRecord.id",objRecord.id);
             
          if (scriptContext.type === scriptContext.UserEventType.CREATE){
               let itemID = objRecord.getValue({
                  fieldId: 'item'
              });
              log.debug("itemID",itemID);

              let subsidiary = objRecord.getValue({
                        fieldId: 'subsidiary'
                    });
              log.debug("subsidiary",subsidiary);
              
              let location = objRecord.getValue({
                        fieldId: 'location'
                    });
              log.debug("location",location);

              let itemSearchObj = search.create({
                 type: "item",
                 filters:
                 [
                    ["internalid","anyof",itemID]
                 ],
                 columns:
                 [
                    search.createColumn({name: "itemid", label: "Name"}),
                    search.createColumn({name: "displayname", label: "Display Name"}),
                    search.createColumn({name: "salesdescription", label: "Description"}),
                    search.createColumn({name: "type", label: "Type"}),
                    search.createColumn({name: "baseprice", label: "Base Price"}),
                    search.createColumn({name: "costingmethod", label: "Costing Method"})
                 ]
              });

              let costingMethod;
              let type;
              itemSearchObj.run().each(function(result){
                // turn into array of comm rate objects
                // .run().each has a limit of 4,000 results

                costingMethod = result.getValue({
                        name: "costingmethod"
                    });

                 log.debug("costingMethod",costingMethod);
                
                type = result.getValue({
                        name: "type"
                    });

                return true;
            });

            log.debug("costingMethod",costingMethod);
            let lookUp = search.lookupFields({
                type: search.Type.LOCATION,
                id: location,
                columns: ['custrecord_ns_psw_autoinvcostreval']
            });

            log.debug('lookUp.custrecord_ns_psw_autoinvcostreval',lookUp.custrecord_ns_psw_autoinvcostreval);
            let autoInventoryCost = lookUp.custrecord_ns_psw_autoinvcostreval;

            if(autoInventoryCost && costingMethod == "STANDARD"){
              log.debug("create ICR");
              let successFlag = lib.createICR(location,type,itemID);
              log.debug("successFlag",successFlag);
              let ICRRecord = record.load({
                  type: record.Type.ITEM_LOCATION_CONFIGURATION, 
                  id: ID,
                  isDynamic: true,
              });
              ICRRecord.setValue({
                  fieldId: st_icr_id,
                  value: successFlag,
                  ignoreFieldChange: true
              });
              ICRRecord.save();
            }
            else{
              return;
            }
          }
           } catch (error) {
               log.debug("error occured", error);
           }

          
   
        }
   
        
   
        return {beforeLoad, beforeSubmit, afterSubmit}
   
    });