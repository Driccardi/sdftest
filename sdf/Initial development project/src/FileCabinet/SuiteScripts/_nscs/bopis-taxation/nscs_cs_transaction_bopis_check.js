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
 *  1.00            8 Apr 2025     mgutierrez           Initial release
 *
 *   This process is responsible for changing the shipping address for an order when the values for the shipmethod, location, and subsidiary match the BOPIS
 * custom record.  When a match is found, it will populate the shipping address to the location.
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 *
 *
 */


define(['/SuiteScripts/_nscs/_libs/NSBOPISUtil'],
    (nsbopisutil) => {

        let OBJ_BOPIS_RESULTS = {};
        let OBJ_LOCATION_RESULTS = {};
        let ID_CURRENT_SHIP_ADDRESS_LIST = 0;
        let B_INITIAL_SEARCH = false;


        /**
         * Defines the function definition when a field has changed
         * @param {Object} scriptContext
         */
        const fieldChanged = (context) => {
            try{
            let strTitle = 'fieldChanged';
            let strFieldId = context.fieldId;
            let recCurrent = context.currentRecord;
            log.debug(strTitle, `strFieldId ${strFieldId}`);
            if (strFieldId === 'shipmethod' || strFieldId === 'subsidiary' || strFieldId === 'location') {

                validateInitialBOPISSearch();


                let idShipMethod = recCurrent.getValue({
                    fieldId: 'shipmethod'
                });
                let idSubsidiary = recCurrent.getValue({
                    fieldId: 'subsidiary'
                });
                let idLocation = recCurrent.getValue({
                    fieldId: 'location'
                });
                log.debug(strTitle, `variables idShipMethod ${idShipMethod} idSubsidiary ${idSubsidiary} 
                idLocation ${idLocation} ID_CURRENT_SHIP_ADDRESS_LIST ${ID_CURRENT_SHIP_ADDRESS_LIST}`);

                let strDictionaryKey = idSubsidiary + '-' + idLocation;

                if (OBJ_BOPIS_RESULTS) {
                    let bBopisOrder = false;
                    let fldBopisOrder = recCurrent.getValue({
                        fieldId: 'custbody_ns_bopis_order'
                    })
                    log.debug(strTitle, `OBJ_BOPIS_RESULTS ${JSON.stringify(OBJ_BOPIS_RESULTS)}`);
                    if (OBJ_BOPIS_RESULTS[strDictionaryKey] && OBJ_BOPIS_RESULTS[strDictionaryKey].arrShipItems) {
                        let arrShipItems = OBJ_BOPIS_RESULTS[strDictionaryKey].arrShipItems;
                        log.debug(strTitle, 'arrShipItems ' +  JSON.stringify(arrShipItems));
                        if (arrShipItems.includes(idShipMethod)) {
                            bBopisOrder = true;
                            if (ID_CURRENT_SHIP_ADDRESS_LIST <= 0) {
                                ID_CURRENT_SHIP_ADDRESS_LIST = recCurrent.getValue({
                                    fieldId: 'shipaddresslist'
                                });
                            }

                            if (OBJ_LOCATION_RESULTS[idLocation]) { //location was found in the search
                                log.debug(strTitle, 'setAddressValues start');
                                let locationResult = OBJ_LOCATION_RESULTS[idLocation];
                                nsbopisutil.setAddressValues(recCurrent, locationResult, true);
                            }
                        }
                    }

                    if (!bBopisOrder && fldBopisOrder) { //the order was flagged as a BOPIS initially in the UI Session
                        log.debug(strTitle, `ID_CURRENT_SHIP_ADDRESS_LIST ${ID_CURRENT_SHIP_ADDRESS_LIST}`);
                        if (ID_CURRENT_SHIP_ADDRESS_LIST > 0) {
                            recCurrent.setValue({
                                fieldId: 'custbody_ns_bopis_order',
                                value: false,
                                ignoreFieldChange: true
                            });
                            recCurrent.setValue({
                                fieldId: 'shipaddresslist',
                                value: ID_CURRENT_SHIP_ADDRESS_LIST
                            });

                            ID_CURRENT_SHIP_ADDRESS_LIST = 0;
                        }
                    }
                }
            }

        }catch (error) {
            // Catch and log any errors that occur during the process
            log.error({
                title: 'Error in beforeSubmit',
                details: error.message,
                stack: error.stack
            });
        }

        };

        /**
         * Determines if the global variables have been set.  If not, it will set the OBJ_BOPIS_RESULTS and OBJ_LOCATION_RESULTS
         */
        const validateInitialBOPISSearch = () => {
            let strTitle = 'validateInitialBOPISSearch';
            
            log.debug(strTitle, `B_INITIAL_SEARCH ${B_INITIAL_SEARCH}`);
            if (!B_INITIAL_SEARCH) {
                B_INITIAL_SEARCH = true;
                OBJ_BOPIS_RESULTS = nsbopisutil.getBopisResults([]);
                OBJ_LOCATION_RESULTS = nsbopisutil.getLocationRecords([]);
            }
        }

        return {
            fieldChanged: fieldChanged,

        };
    });