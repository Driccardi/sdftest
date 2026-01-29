/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query','N/url','N/search'], (query,url,search) => {

    function onRequest(context) {
        const request = context.request;
        const response = context.response;
        log.debug('Request Method', request.method);
        log.debug('Request Parameters', request.parameters);


        if (request.method === 'GET') {
            const action = request.parameters.action;
            
            if (action === 'getTypes') {
                return getTransactionTypes(response);
            }
        } else if (request.method === 'POST') {
            let requestBody = JSON.parse(request.body);
            return searchTransactions(response, requestBody.type, requestBody.amount);
        }
        response.write('Invalid request');
        return;
    }

    function getTransactionTypes(response) {
        const sql = `
            SELECT DISTINCT
                SUBSTR(ts.fullname, 1, INSTR(ts.fullname, ':') - 1) AS trantypename,
                ts.tranType
            FROM TransactionStatus ts
            ORDER BY trantypename ASC`;

        const results = query.runSuiteQL({ query: sql }).asMappedResults();
        log.debug('Transaction Types', results);
        response.write(JSON.stringify(results));
    }
    function getTransactionTypeById(transactionId) {
        try {
            const transactionSearch = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: transactionId,
                columns: ['type']
            });

            return transactionSearch.type.length > 0 ? transactionSearch.type[0].text : 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }
    function mapTransactionResults(results) {
        return results.map(transaction => {
            return {
                ...transaction,
                transactionType: getTransactionTypeById(transaction.id),
                url: url.resolveRecord({
                    recordType: search.Type.TRANSACTION,
                    recordId: transaction.id
                })
            };
        });
    }

    function searchTransactions(response, amount) {
        const sql = `
            SELECT 
                id, 
                trandate, 
                BUILTIN.DF(status) status,
                BUILTIN.DF(type) type,
                tranDisplayName tranname, 
                foreignTotal amount
            FROM transaction 
            WHERE foreignTotal = ?
            ORDER BY trandate DESC`;

            let results = query.runSuiteQL({ query: sql, params: [amount] }).asMappedResults();
            results = mapTransactionResults(results);
            response.write(JSON.stringify(results));

    }

    return { onRequest };
});