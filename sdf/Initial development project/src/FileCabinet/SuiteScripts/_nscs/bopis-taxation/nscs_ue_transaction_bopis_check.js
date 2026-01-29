/**
 * Copyright (c) 1998-2025 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 *
 *  Version         Date           Author               Remarks
 *  1.00            8 Apr 2025    mgutierrez           Initial release
 *
 *  This process is responsible for changing the shipping address for an order when the values for the shipmethod, location, and subsidiary match the BOPIS
 * custom record.  When a match is found, it will populate the shipping address to the location.
 *
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/message', '/SuiteScripts/_nscs/_libs/NSBOPISUtil'], function(message, nsbopisutil) {
  
  /**
     * Defines the function definition that is executed before the record is loaded
     * @param {Object} scriptContext
     */
  const beforeLoad = (scriptContext) => {
      let strTitle = 'beforeLoad';
      try{
      let recCurrent = scriptContext.newRecord
      let bBopisOrder = recCurrent.getValue({
          fieldId: 'custbody_ns_bopis_order'
      })
      let shipAddress = recCurrent.getValue({
          fieldId: 'shipaddress'
      })
      log.debug(strTitle, `Variables: bBopisOrder: ${bBopisOrder} shipAddress: ${shipAddress}`);
      if (bBopisOrder && shipAddress && shipAddress.length < 10) {
        //if the order is for pickup and the ship address isn't populated, this will display an error warning indicating the issue
          scriptContext.form.addPageInitMessage({
              type: message.Type.ERROR, // Or WARNING, ERROR, etc.
              message: 'This order is meant to be picked up in person but the location does not a proper address!  Taxes will not be calculated properly!',
              duration: 10000 // Duration in milliseconds (optional, defaults to 5000)
          });
      }}
      catch (error) {
        // Catch and log any errors that occur during the process
        log.error({
            title: 'Error in beforeLoad',
            details: error.message,
            stack: error.stack
        });
    }

  };
    /**
     * Defines the function definition that is executed before the record is submitted
     * @param {Object} scriptContext
     */
  const beforeSubmit = (scriptContext) => {
      let strTitle = 'beforeSubmit';
      try {
          // Get the current Transaction from the context
          let recTransaction = scriptContext.newRecord;

          let shipMethod = recTransaction.getValue({
            fieldId: 'shipmethod'
          });
          let subsidiary = recTransaction.getValue({
            fieldId: 'subsidiary'
          });
          let idLocation = recTransaction.getValue({
            fieldId: 'location'
          });

          log.debug(strTitle, `Variables: shipMethod: ${shipMethod} subsidiary: ${subsidiary} idLocation: ${idLocation}`);
          // Check if recTransaction and necessary fields are not empty
          if (recTransaction &&  shipMethod && subsidiary && idLocation ) {
              
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) { //since it is not create, we need to check to see if the values changed.
                  let bValuesChanged = checkValuesChanged(scriptContext);
                  log.debug('bValuesChanged', bValuesChanged);
                  if (!bValuesChanged) {//if the values haven't changed since last time, we will not run through the process
                      return;
                  }
              }


              var arrFilters = [
                  ['custrecord_ns_bopis_shipitems', 'anyOf', shipMethod],
                  'AND',
                  ['custrecord_ns_bopis_subsidiary', 'is', subsidiary],
                  'AND',
                  ['custrecord_ns_bopis_location', 'is', idLocation]
              ];

              let bopisResults = nsbopisutil.getBopisResults(arrFilters);

              let arrBopisKeys = Object.keys(bopisResults)

              if (arrBopisKeys.length > 0) { //there was a match found so this is BOPIS order

                  var arrLocationFilters = [
                      ['internalid', 'anyOf', idLocation]
                  ];

                  let locationResults = nsbopisutil.getLocationRecords(arrLocationFilters);
                  let arrLocationKeys = Object.keys(locationResults)
                  if (arrLocationKeys.length > 0) { //The location record was found
                      let intLocation = arrLocationKeys[0];
                      let locationResult = locationResults[intLocation]
                      if (locationResult) {
                          nsbopisutil.setAddressValues(recTransaction, locationResult, false);
                      }
                  }
              } else {
                  let bBopisOrder = recTransaction.getValue({
                      fieldId: 'custbody_ns_bopis_order'
                  });
                  if (bBopisOrder) { //if this record no longer is considered a BOPIS order, we need to uncheck the BOPIS order
                    recTransaction.setValue({
                      fieldId: 'custbody_ns_bopis_order',
                      value: false
                  });
                  }
              }
          } else {
              // Log an error if any of the required fields are missing
              log.error({
                  title: 'Missing Required Fields',
                  details: 'One or more required fields are empty. Cannot perform the custom record search.'
              });
          }
      } catch (error) {
          // Catch and log any errors that occur during the process
          log.error({
              title: 'Error in beforeSubmit',
              details: error.message,
              stack: error.stack
          });
      }
  };

    /**
     * Checks to see if there were any changes for specific fields between the old record and the new
     * @param {Object} scriptContext
     * @return {bool} true if any of the fields changed, false if none of them changed
     */
  const checkValuesChanged = (scriptContext) => {
      var recNewTran = scriptContext.newRecord;
      var recOldTran = scriptContext.oldRecord;

      var idOldShipMethod = recOldTran.getValue({
          fieldId: 'shipmethod'
      });
      var idOldSubsidiary = recOldTran.getValue({
          fieldId: 'subsidiary'
      });
      var idOldLocation = recOldTran.getValue({
          fieldId: 'location'
      });


      var idNewShipMethod = recNewTran.getValue({
          fieldId: 'shipmethod'
      });
      var idNewSubsidiary = recNewTran.getValue({
          fieldId: 'subsidiary'
      });
      var idNewLocation = recNewTran.getValue({
          fieldId: 'location'
      });

      return (idOldShipMethod !== idNewShipMethod ||
          idOldSubsidiary !== idNewSubsidiary ||
          idOldLocation !== idNewLocation)

  }

  return {
      beforeLoad: beforeLoad,
      beforeSubmit: beforeSubmit

  };
});