/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query'],
    
    (query) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const arrCustomLists = ['customlist_ns_psw_allocationtype', 'customlist_ns_psw_suiteletinputtype', 'customlist_ns_psw_yesno'];

            let stQuery = buildQuery(arrCustomLists);
            log.debug({
                title: 'stQuery',
                details: stQuery
            });

            let arrResults = getCustomListValues(stQuery);
            log.debug({
                title: 'queryResults',
                details: arrResults
            });
        }

        /**
         * @name buildQuery
         * Returns a SuiteQL query to return custom list values, intenral ids and script ids based on array of custom list ids.
         * @param {[string]} customListIds
         * @returns {string}
         */
        function buildQuery(customListIds) {
            const stBaseQuery = `SELECT cl.scriptid as cl_scriptid, cl.internalid as cl_id, cl.name as cl_name, v.name as value, v.scriptid as value_scriptid, v.recordid as value_id FROM ? as v INNER JOIN customlist as cl on cl.scriptid = \'?\'`;
            const stUnion = ' UNION ';
            const stSort = ' ORDER BY cl_scriptid, value_scriptid';
            let stNewQuery = '';
            for (let [index, listId] of customListIds.entries()) {
                if (index != 0) {
                    stNewQuery += stUnion;
                }
                stNewQuery += stBaseQuery;
                stNewQuery = stNewQuery.replaceAll("?", listId.toUpperCase());
            }
            stNewQuery += stSort;
            return stNewQuery;
        }

        /**
         * @name getCustomListValues
         * Runs a SuiteQL query to get data from Custom Lists. Assumes a maximum of 5000 resuls for the query.
         * @param stQuery
         * @return {any[]}
         */
        function getCustomListValues(stQuery) {
            let arrResults = [];
            let queryResult = query.runSuiteQL(stQuery).asMappedResults();
            queryResult.forEach(function(result){
                let line = JSON.stringify(result);
                arrResults.push(line);
            })
            return arrResults;
        }

        /**
         * @name initializeListValues
         * Creates objects per custom list with key value pairs of script Ids / names and internal Ids
         */
        function initializeListValues() {
//iterate through query results and create list value objects that match scriptIds to internal Ids
        }

        return {onRequest}

    });
