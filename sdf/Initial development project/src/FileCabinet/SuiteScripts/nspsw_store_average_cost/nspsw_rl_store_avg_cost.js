/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @NScriptType Restlet
 * @authorship SingleUser
 */

define(['N/search', 'N/runtime'], function(search, runtime) {

    function doGet(context) {
        log.debug('context', context)
        log.debug('Script parameter of custscript_nspsw_item_id: ' + context.custscript_nspsw_item_id);
        log.debug('Script parameter of custscript_nspsw_location_id: ' + context.custscript_nspsw_location_id);
        
        // Prepare the response
        var response = {};
        var searchObj = search.load( { id:'customsearch_ns_psw_locationavgcost' } );
        var defaultFilters = searchObj.filters;

        defaultFilters.push(search.createFilter({
          name: "internalidnumber",
          operator: "equalto",
          values: context.custscript_nspsw_item_id
        }));

        defaultFilters.push(search.createFilter({
          name: "inventorylocation",
          operator: "anyof",
          values: context.custscript_nspsw_location_id
        }));
        /*var customItemFilter = [];
        customItemFilter = ["internalidnumber","equalto", context.custscript_nspsw_item_id];
        defaultFilters.push(customItemFilter);

        var customLocFilter = [];
        customLocFilter = ["inventorylocation","anyof", context.custscript_nspsw_location_id];
        defaultFilters.push(customLocFilter);*/

        searchObj.filters = defaultFilters;

          response.results = [];

          var resultSet = searchObj.run();

          var start = 0;

          var results = [];

          do {
     
               results = resultSet.getRange( { start: start, end: start + 1000 } );
          
               start += 1000;
          
               response.results = response.results.concat( results ) ;
          
          } while ( results.length );          
                                             
          return JSON.stringify(response);
    }

    return {
        'get': doGet,
    };
});
