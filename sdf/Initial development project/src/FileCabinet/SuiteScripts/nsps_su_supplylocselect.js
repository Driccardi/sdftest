/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/dataset', 'N/error', 'N/query', 'N/runtime', 'N/search', 'N/ui/serverWidget','N/format'],
    /**
 * @param{dataset} dataset
 * @param{error} error
 * @param{query} query
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (dataset, error, query, runtime, search, serverWidget,format) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (context) => {
            log.debug('context.request.method', context.request.method);
            if (context.request.method === 'POST') {
               var postedData = context.request.body;
               log.debug('Received Data', postedData);

                context.response.addHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                context.response.addHeader({
                    name: 'nsps-header',
                    value: 'Demo'
                });
                context.response.write(JSON.stringify(fetchData(JSON.parse(postedData))));
            } else {
                context.response.write('Please send a POST request.');
            }
        }

        function fetchData(inputData){
            var sql = `SELECT
                           l.id,
                            l.name,
                            CASE WHEN lma.addr1 IS NOT NULL THEN lma.addr1 || ' - ' || lma.city || ', ' || lma.state ELSE null END    address,
                            ib.quantityAvailable,
                            ib.quantityOnHand,
                        FROM
                            InventoryBalance ib, 
                            location l, 
                            LocationMainAddress lma
                        WHERE
                            ib.location = l.id
                        AND
                            l.mainaddress = lma.nkey
                        AND
                            ib.quantityAvailable > 0
                        AND 
                            ib.item = ?
                        AND
                            ib.location != ?`;
               
            var resultArr =  query.runSuiteQL({query: sql, 
                    params: [inputData.lineItem, inputData.lineLocation || inputData.headerLocation]}).asMappedResults();
            var returnData = {}
            returnData.header = ['Qty Request','Location','Address','Quantity Available','Quanitity On Hand','Lead Time'];
            returnData.rows = [];
            for(var i = 0; i < resultArr.length; i++){
              log.debug('resultArr', resultArr[i])
                returnData.rows.push([resultArr[i].id,resultArr[i].name,resultArr[i].address,resultArr[i].quantityavailable,resultArr[i].quantityonhand]);
            }
            return returnData;
        }

        return {onRequest}

    });
