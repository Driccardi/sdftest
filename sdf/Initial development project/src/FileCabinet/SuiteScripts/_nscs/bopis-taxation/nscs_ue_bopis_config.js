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
 *  This process is responsible for user events tied to the BOPIS record.  It currently checks to see if the record is a duplicate
 *
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function(record,  search) {

  function beforeSubmit(scriptContext) {
    let objDuplicate = {};
    
    
    
    try {
      
      let recBopis = scriptContext.newRecord;  
      log.debug('scriptContext type', scriptContext.type);
        var idSubsidiary = recBopis.getValue({ fieldId: 'custrecord_ns_bopis_subsidiary' });
        var idLocation = recBopis.getValue({ fieldId: 'custrecord_ns_bopis_location' });
        let idBopis = recBopis.id;  
        objDuplicate = isRecordDuplicate(idSubsidiary, idLocation, idBopis);
       
        
    
    } catch (error) {
      // Catch and log any errors that occur during the process
      log.error({
        title: 'Error in beforeSubmit',
        details: error.message,
        stack: error.stack
      });
    }

    if(objDuplicate.isDuplicate){
      throw `There is already a record for the selected subsidiary(${objDuplicate.strSubsidiaryName}) 
      and location(${objDuplicate.strLocationName})`
    }
  }

const isRecordDuplicate = (idSubsidiary, idLocation, idBopis) => {
  if(!idBopis){idBopis=0}
  let isDuplicate = false;
  let strSubsidiaryName = '';
  let strLocationName = '';
  var customRecordSearch = search.create({
    type: 'customrecord_ns_bopis_config',
    filters: [
      ['custrecord_ns_bopis_subsidiary', 'is', idSubsidiary],
      'AND',
      ['custrecord_ns_bopis_location', 'is', idLocation],
      'AND',
      ['internalid', 'noneof', [idBopis]]
    ],
    columns: [
      search.createColumn({
        name: "internalid"
      }),
      search.createColumn({
        name: "custrecord_ns_bopis_subsidiary"
      }),
      search.createColumn({
        name: "custrecord_ns_bopis_location"
      }),
      

    ]
  });
  var arrResults = getAllResults(customRecordSearch);
  log.debug('arrResults', JSON.stringify(arrResults));
  arrResults.forEach(function(result) {
    isDuplicate = true;
    strSubsidiaryName = result.getText('custrecord_ns_bopis_subsidiary')
    strLocationName = result.getText('custrecord_ns_bopis_location')
  });
  
  return {isDuplicate, strSubsidiaryName, strLocationName}


}


  const getAllResults = (s) => {
    let stLogTitle = "getAllResults";
    log.debug(stLogTitle);

    let results = s.run();
    let searchResults = [];
    let searchid = 0;
    let resultslice = [];
    do {
      resultslice = results.getRange({ start: searchid, end: searchid + 1000 });
      resultslice.forEach((slice) => {
        searchResults.push(slice);
        searchid++;
      });
    } while (resultslice.length >= 1000);
    return searchResults;
  };

  return {
      beforeSubmit: beforeSubmit
      
  };
});


