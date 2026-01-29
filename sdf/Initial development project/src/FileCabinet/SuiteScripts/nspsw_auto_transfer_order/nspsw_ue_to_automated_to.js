/**
 *	Copyright (c) ${YEAR}, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/https', 'N/error', 'N/task', 'N/search'],
  /**
   * @param {record} record
   */
  function(record, runtime, https, error, task, search) {
     /**
        * @name obj_features_std_cost
        * Set of NetSuite Features used in Standard Costing
        * @type {Readonly<{multilocation: string, matrixitems: string, assemblies: string, ailc: string, standardcosting: string, accounting: string, inventory: string}>}
        */
       const obj_features_std_cost = Object.freeze({
           supplyallocation: "supplyallocation"
       });

function invalidRecordError(){
	const err = error.create({
		name: 'INVALID_Transaction',
		message: 'Only approved projects can have transactions edited/created.',
		notifyOff: true
	});

	throw err;
};  
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
            if (scriptContext.type === scriptContext.UserEventType.VIEW){
                var numLines = scriptContext.newRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug("numLines:",numLines)
                for (var i = 0; i < numLines; i++) {


                    var salesOrder = scriptContext.newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_psw_salesorder',
                        line: i
                    });
                    log.debug("salesOrder:",salesOrder)
                    if(!salesOrder){
                        continue;
                    }
                    else{
                        var yourForm = scriptContext.form;
                        yourForm.removeButton('closeremaining');
                        yourForm.removeButton('approve');
                        yourForm.removeButton('reject');
                        break;
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
  
          try {
  
            /*log.debug("before submit")
            var objRecord = scriptContext.newRecord;
  
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT){
  
              var status = objRecord.getValue({
                fieldId: 'orderstatus'
              });
              if(status=='F'){

                var numLines = objRecord.getLineCount({
                  sublistId: 'item'
                });
                for (var i = 0; i < numLines; i++) {
                  var soID = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_salesorder',
                    line: i
                  });
                  if(!soID){
                    continue
                  }
                  else{
                    var soLineID = objRecord.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_ns_psw_lineuniquekey',
                      line: i
                    });
                    var fullfilledQuantity = objRecord.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'quantityfulfilled',
                      line: i
                    });
                    var soRecord = record.load({
                        type: record.Type.SALES_ORDER, 
                        id: soID,
                        isDynamic: false,
                    });
                    var SOStatus = soRecord.getValue({
                        fieldId: 'orderstatus',
                    });
                    log.debug('SOStatus',SOStatus)
                    var lineNumber = soRecord.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: soLineID
                    });
                    var isClosed = soRecord.getSublistValue({
                          sublistId: 'item',
                          fieldId: 'isclosed',
                          line: i
                      });
                    log.debug('isClosed',isClosed)
                    var quantity = soRecord.getSublistValue({
                          sublistId: 'item',
                          fieldId: 'quantity',
                          line: i
                      });
                    log.debug('quantity',quantity)
                    if(SOStatus != "G" && SOStatus != "F"){
                      log.debug('in if')
                      if(!isClosed && quantity>=fullfilledQuantity){
                        log.debug('in if')
                        soRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_tofulfilledqty',
                            line: lineNumber,
                            value: fullfilledQuantity
                        });
                        soRecord.save();
                      }
                      else{
                        log.audit("error occured while updating sales order line.")
                      }
                    }
                    
                  }
                }
                //log.debug("in if")
              }
              if(status=='G'){

                var numLines = objRecord.getLineCount({
                  sublistId: 'item'
                });
                for (var i = 0; i < numLines; i++) {
                  var soID = objRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_psw_salesorder',
                    line: i
                  });
                  if(!soID){
                    continue
                  }
                  else{
                    var soLineID = objRecord.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'custcol_ns_psw_lineuniquekey',
                      line: i
                    });
                    var fullfilledQuantity = objRecord.getSublistValue({
                      sublistId: 'item',
                      fieldId: 'quantityreceived',
                      line: i
                    });
                    var soRecord = record.load({
                        type: record.Type.SALES_ORDER, 
                        id: soID,
                        isDynamic: false,
                    });
                    var SOStatus = soRecord.getValue({
                        fieldId: 'orderstatus',
                    });
                    log.debug('SOStatus',SOStatus)
                    var lineNumber = soRecord.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: soLineID
                    });
                    var isClosed = soRecord.getSublistValue({
                          sublistId: 'item',
                          fieldId: 'isclosed',
                          line: i
                      });
                    log.debug('isClosed',isClosed)
                    var quantity = soRecord.getSublistValue({
                          sublistId: 'item',
                          fieldId: 'quantity',
                          line: i
                      });
                    var transferQuant = soRecord.getSublistValue({
                          sublistId: 'item',
                          fieldId: 'custcol_ns_psw_transferqty',
                          line: i
                      });
                    log.debug('transferQuant',transferQuant)
                    if(SOStatus != "G" && SOStatus != "F"){
                      log.debug('in if')
                      if(!isClosed && quantity>=fullfilledQuantity){
                        log.debug('in if')
                        soRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_psw_toreceivedqty',
                            line: lineNumber,
                            value: fullfilledQuantity
                        });

                        var featureInEffect = runtime.isFeatureInEffect({
                          feature: obj_features_std_cost.supplyallocation
                        });
                        log.debug('auto location assignment feature is enabled: ', featureInEffect);

                        if(!featureInEffect){
                          soRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'commitinventory',
                            line: lineNumber,
                            value: -2 //needs to come from config record
                          });
                        }
                        else{
                          soRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'commitinventory',
                            line: lineNumber,
                            value: -2 //needs to come from config record
                          });
                        }
                        soRecord.save();
                      }
                      else{
                        break;
                        log.audit("error occured while updating sales order line.")
                      }
                    }
                    
                  }
                }
                //log.debug("in if")
              }
            }*/
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