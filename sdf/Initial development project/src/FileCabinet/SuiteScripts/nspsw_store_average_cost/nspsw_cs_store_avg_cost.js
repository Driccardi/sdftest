/**
 *	Copyright (c) ${YEAR}, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/https', 'N/ui/dialog', 'N/url'],

function(runtime, https, dialog, url) {
    /**
      * @name obj_features_std_cost
      * Set of NetSuite Features used in Standard Costing
      * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
      */
     const obj_features_std_cost = Object.freeze({
         crosssubsidiary: "crosssubsidiaryfulfillment"
     });
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

      return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        var fieldId = scriptContext.fieldId;
        var sublistId = scriptContext.sublistId;
        var objRecord = scriptContext.currentRecord;

        if (sublistId === 'item' && (fieldId == 'item' ||fieldId == 'location' ||fieldId == 'inventorylocation')) {
            log.debug('field changed',scriptContext);
            var lineNumber = scriptContext.line;
            objRecord.selectLine({
                sublistId: 'item',
                line: lineNumber
            });
            objRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_ns_psw_getlocationavgcost',
                value: true,
                ignoreFieldChange: true
            });
        }

      return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

      return true;
    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

      //log.debug('sublistChanged',scriptContext);
      return true;
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

      return true;
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

      return true;
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

      try {
         log.debug('validateLine',scriptContext);

         var objRecord = scriptContext.currentRecord;
         
        
         var getLAC = objRecord.getCurrentSublistValue({
             sublistId: 'item',
             fieldId: 'custcol_ns_psw_getlocationavgcost'
         });
         log.debug('getLAC',getLAC);

         if(getLAC == false){
           return true;
           log.debug('terminate execution');
           
         }
        else{
          var featureInEffect = runtime.isFeatureInEffect({
             feature: obj_features_std_cost.crosssubsidiary
         });
          log.debug('crosssubsidiary feature is enabled: ', featureInEffect);
          var inventoryLocation = -1; 

          if(featureInEffect){
            inventoryLocation = objRecord.getCurrentSublistValue({
             sublistId: 'item',
             fieldId: 'inventorylocation'
            });
            log.debug('inventoryLocation',inventoryLocation);

            if(!inventoryLocation){
              inventoryLocation = objRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location'
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
            inventoryLocation = objRecord.getCurrentSublistValue({
             sublistId: 'item',
             fieldId: 'location'
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
            dialog.alert({
               title: 'Please enter a Location',
               message: 'The location average cost calulcation requires a location entered.'
          	});
            return false; 
          }

          var item = objRecord.getCurrentSublistValue({
             sublistId: 'item',
             fieldId: 'item'
            });

          

          /*var myRestletResponse = https.requestRestlet({
              body: 'My Restlet body',
              deploymentId: 'customdeploy1',
              method: 'GET',
              scriptId: 957,
              urlparams: myUrlParameters
          });*/

      // 1. Get the account ID from the runtime module
      var accountId = runtime.accountId;
      var accountIdNoTD = accountId.replace("TD", "");
      
      // 2. Specify the scriptId and deploymentId of your RESTlet
      var scriptId = 'customscript_nspsw_rl_store_avg_cost'; // Your Restlet Script ID
      var deploymentId = 'customdeploy_nspsw_sotre_avg_cost_rsl'; // Your Restlet Deployment ID
      // 3. Construct the Restlet URL using the url module
      var restletUrl = url.resolveScript({
         scriptId: scriptId,
         deploymentId: deploymentId,
         params: {}
      });
      // Optionally, include your account ID in the Restlet URL if needed for authentication
      restletUrl = "https://td" + accountIdNoTD + ".app.netsuite.com" + restletUrl;
      log.debug("restletUrl",restletUrl)
      var indexToRemove = restletUrl.indexOf("&compid="+ accountId +"&");
      var restletUrl = restletUrl.slice(0, indexToRemove);
      log.debug("restletUrl",restletUrl)


          
          

          var response = https.get({
                url: restletUrl+'&custscript_nspsw_item_id='+item+'&custscript_nspsw_location_id='+inventoryLocation                
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
            
            
            objRecord.setCurrentSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ns_psw_locationavgcost',
                 value: locationAVGCost
              });
            objRecord.setCurrentSublistValue({
             sublistId: 'item',
             fieldId: 'custcol_ns_psw_getlocationavgcost',
             value: false
            });
          }
          else{
            log.debug("error")
          }
         
         return true;
        }
        
         
      } catch (error) {
            log.debug("error occured", error);
         dialog.alert({
               title: 'Error in Script Calculation',
               message: 'The location average cost could not be calulated, please review entry and retry.'
          	});
        return false;
        }
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

      //log.debug('validateInsert',scriptContext);
      return true;
    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

      return true;
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

      return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
