/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/query', 'N/record', 'N/runtime','N/search','N/error'],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{message} message
 * @param{search} search
 * @param{error} error
 */
    (log, query, record, runtime,search,error) => {
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
            const objCustRecOld = scriptContext.oldRecord;
            const objCustRecNew = scriptContext.newRecord;
            var boolIsConsignAddressOld = [];
            var boolIsConsignAddressNew = [];
            var arrAssignedConLocs = [];
            var lineCount = 0;
            if(objCustRecOld){
                lineCount = objCustRecOld.getLineCount({sublistId: 'addressbook'});
                for (var i = 0; i < lineCount; i++) {
                    var addressSubrecordOld = objCustRecOld.getSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress',
                        line: i
                    });
                    boolIsConsignAddressOld.push(addressSubrecordOld.getValue('custrecord_ns_csgn_addresschk'));
                }
                var lineNewCount = objCustRecNew.getLineCount({sublistId: 'addressbook'});

                for (var i = 0; i < lineNewCount; i++) {
                    var addressSubrecordNew = objCustRecNew.getSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress',
                        line: i
                    });
                    boolIsConsignAddressNew.push(addressSubrecordNew.getValue('custrecord_ns_csgn_addresschk'));
                    arrAssignedConLocs.push(addressSubrecordNew.getValue('custrecord_ns_csgn_assignedloc'));
                }
                log.debug("Details Array: ","Old Values: " + boolIsConsignAddressOld + " New Values: " + boolIsConsignAddressNew);
                // Compare and check for old value as true and new value as false
                for (var i = 0; i < boolIsConsignAddressOld.length; i++) {
                    if (boolIsConsignAddressOld[i] === true && boolIsConsignAddressNew[i] === false) {
                        var objScript = runtime.getCurrentScript();
                        var intSearchId = objScript.getParameter({name:'custscript_ns_csgn_validate_loc_srch'});
                        var strErrorMessage = objScript.getParameter({name:'custscript_ns_csgn_error_message'});
                        let boolValidateLocInv = validateLocationInventory(intSearchId,arrAssignedConLocs[i]);
                        if(boolValidateLocInv){
                            log.debug("Display Alert");
                            throw new Error(strErrorMessage);
                        }
                    }
                }
            }

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
            const objCurRec = scriptContext.newRecord;
            var boolNeedSave = false; 
            var objCustRecord = record.load({   
                type: objCurRec.type,
                id: objCurRec.id
            });
            var boolIsConsignment = objCustRecord.getValue('custentity_ns_csgn_invcosflag');
            if(!boolIsConsignment){
                log.audit('Customer Consignment Check','Customer is not a consignment customer.');
                return;
            }
            var lineCount = objCustRecord.getLineCount({sublistId: 'addressbook'});
            for (var i = 0; i < lineCount; i++) {
                var addressSubrecord = objCustRecord.getSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress',
                    line: i
                });
    
                var boolIsConsignAddress = addressSubrecord.getValue('custrecord_ns_csgn_addresschk');
                var intConsignLocation = addressSubrecord.getValue('custrecord_ns_csgn_assignedloc');
                log.debug('boolIsConsignAddress', boolIsConsignAddress);
                log.debug('intConsignLocation', intConsignLocation);
                if(boolIsConsignAddress && !intConsignLocation){ // we need to creeate a new Location for this customer
                    try{
                        var objLocationRecord = record.create({
                            type: record.Type.LOCATION,
                            isDynamic: true
                        });
                        var objScript = runtime.getCurrentScript();
                        var strLocationPrefix = objScript.getParameter({name: 'custscript_ns_csgn_location_prefix'}); // Getting Location Prefix through Parameter
                        var strLocationName = strMaker(strLocationPrefix) + ' | ' + strMaker(objCustRecord.getValue('companyname')) + ' | ' + strMaker(addressSubrecord.getValue('addr1'));
                        objLocationRecord.setValue('name', strLocationName);
                        objLocationRecord.setValue('custrecord_ns_csgn_customer', objCustRecord.id);
                        objLocationRecord.setValue('locationtype', 2); // warehouse type location
                        objLocationRecord.setValue('makeinventoryavailable',true);
                        objLocationRecord.setValue('usebins',false);
                        objLocationRecord.setValue('custrecord_ns_csgn_isconsig', true);
                        objLocationRecord.setValue('custrecord_ns_csgn_contact', addressSubrecord.getValue('custrecord_ns_csgn_addcont'));
                        if(objLocationRecord.getField('subsidiary')){
                            objLocationRecord.setValue('subsidiary', objCustRecord.getValue('subsidiary')); // assuming the customer and location are in the same subsidiary
                        }

                        var objLocationAddressSubrecord = objLocationRecord.getSubrecord({
                            fieldId: 'mainaddress' // Assuming 'mainaddress' is the field ID
                        });
                        objLocationAddressSubrecord.setValue('country', addressSubrecord.getValue('country'));
                        objLocationAddressSubrecord.setValue('state', addressSubrecord.getValue('state'));
                        objLocationAddressSubrecord.setValue('city', addressSubrecord.getValue('city'));
                        objLocationAddressSubrecord.setValue('zip', addressSubrecord.getValue('zip'));
                        objLocationAddressSubrecord.setValue('addr1', addressSubrecord.getValue('addr1'));
                        objLocationAddressSubrecord.setValue('addr2', addressSubrecord.getValue('addr2'));
                        objLocationAddressSubrecord.setValue('addr3', addressSubrecord.getValue('addr3'));
                        objLocationAddressSubrecord.setValue('addressee', addressSubrecord.getValue('addressee'));
                        objLocationAddressSubrecord.setValue('attention', addressSubrecord.getValue('attention'));
                        objLocationAddressSubrecord.setValue('phone', addressSubrecord.getValue('phone'));
                        objLocationAddressSubrecord.setValue('custrecord_ns_csgn_addresschk', addressSubrecord.getValue('custrecord_ns_csgn_addresschk'));
                        objLocationAddressSubrecord.setValue('custrecord_ns_csgn_addcont', addressSubrecord.getValue('custrecord_ns_csgn_addcont'));
                        //objLocationAddressSubrecord.save();
                        var intNewLocation = objLocationRecord.save();
                        if(intNewLocation){
                            log.debug('New Location Created', 'Name: ' + strLocationName + ' | ID: ' + intNewLocation);
                            addressSubrecord.setValue('custrecord_ns_csgn_assignedloc', intNewLocation);
                          //  addressSubrecord.save();
                            boolNeedSave = true;
                        }else{
                            log.error('Error creating new location', 'Location record was not saved.');
                        }
                    }catch(e){
                        log.error('Error creating new location', e);
                    }


                }else if(! boolIsConsignAddress && intConsignLocation){ // we need to try to inactivate the location
                    try{
                        var objLocationRecord = record.load({
                            type: record.Type.LOCATION,
                            id: intConsignLocation
                        });
                        objLocationRecord.setValue('isinactive', true);
                        objLocationRecord.setValue('custrecord_ns_csgn_isconsig', false);
                        var intRecSaved = objLocationRecord.save();
                        if(intRecSaved){
                            //addressSubrecord.setValue('custrecord_consinv_assignedloc', null);
                            //boolNeedSave = true;
                            log.audit('Location Inactivated', 'Location ID: ' + intConsignLocation);
                        }

                    }catch(e){
                        log.error('Error inactivating location', e);
                    } 
                }
            } // location loop

            if(boolNeedSave){
                objCustRecord.save();
            }
        }

        function strMaker(strInput){
            // if you want to modify the output of the location name, create more complex rules here
            return strInput.substring(0, 15).toUpperCase().replace(/ /g, "_");
        }

        function validateLocationInventory(intSearchId, intLocationId){
            const objLoadSearch = search.load({
                id: intSearchId
            });

            objLoadSearch.filters.push(search.createFilter( {
                name: 'inventorylocation',
                operator: search.Operator.IS,
                values: intLocationId
            }));
            const filters = objLoadSearch.filters;
            log.debug("Filters: ",filters);


            let objSearchResults = getAllResults(objLoadSearch);
            return objSearchResults.length > 0;
        }

        function getAllResults (objSearch, maxResults) {
            try {
                let intPageSize = 1000;
                if (maxResults && maxResults < 1000) {
                    intPageSize = maxResults;
                }

                let objResultSet = objSearch.runPaged({pageSize: intPageSize});
                let arrReturnSearchResults = [];
                let j = objResultSet.pageRanges.length;

                if (j && maxResults) {
                    j = Math.min(Math.ceil(maxResults / intPageSize), j);
                }

                for (let i = 0; i < j; i++) {
                    let objResultSlice = objResultSet.fetch({
                        index: objResultSet.pageRanges[i].index
                    });
                    arrReturnSearchResults = arrReturnSearchResults.concat(objResultSlice.data);
                }

                return maxResults ? arrReturnSearchResults.slice(0, maxResults) : arrReturnSearchResults;

            } catch (e) {
                log.error({title: 'getAllResults Error', details: e.toString()});
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
