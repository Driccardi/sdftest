/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/query', './nspsw_cm_pop_up_ui', './nspsw_cm_pop_up_helper'],

    function (query, ui, helper) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            const request = context.request
            log.debug('context.request.method', request.method);
            const response = context.response
            if (context.request.method === 'POST') {
                let postedData = request.body;
                log.debug('Received Data', postedData);

                response.addHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                response.addHeader({
                    name: 'nspsw-header',
                    value: 'Demo'
                });
                let objResponse = JSON.stringify(fetchData(JSON.parse(postedData)))
                log.debug('objResponse', objResponse)
                response.write(objResponse);
            } else {
                response.write('Please send a POST request.');
            }
        }

        const fetchData = (inputData) => {
            try {
                let sql = `${helper.getConfigDetail(inputData.config).strquery}`
                // let sql = `SELECT
                //            l.id,
                //             l.name,
                //             CASE WHEN lma.addr1 IS NOT NULL THEN lma.addr1 || ' - ' || lma.city || ', ' || lma.state ELSE null END    address,
                //             ib.quantityAvailable,
                //             ib.quantityOnHand,
                //         FROM
                //             InventoryBalance ib,
                //             location l,
                //             LocationMainAddress lma
                //         WHERE
                //             ib.location = l.id
                //         AND
                //             l.mainaddress = lma.nkey
                //         AND
                //             ib.quantityAvailable > 0
                //         AND
                //             ib.item = ?
                //         AND
                //             ib.location != ?`;

                let arrParams = []
                log.debug('sql', sql)
                // let objParams = JSON.parse(inputData.params)
                for (let params in inputData.params) {
                    arrParams.push(parseInt(inputData.params[params].value))
                }

                log.debug('arrParams', arrParams)

                let resultArr = query.runSuiteQL({
                    query: sql,
                    params: arrParams
                }).asMappedResults();
                let returnData = {}
                let intRowLimit = inputData.detail.rowLimit
                let intColumnCountLimit = inputData.detail.columnLimit
                returnData.header = Object.keys(inputData.mapping).slice(0,parseInt(intColumnCountLimit));
                let arrQueryIDs = Object.values(inputData.mapping).map(item => item.name || "id");
                // let arrQueryIDs = Object.values(inputData.mapping).map(item => item.name)
                log.debug('inputData', inputData)
                log.debug('LIMIT', {
                    intRowLimit : intRowLimit,
                    intColumnCountLimit : intColumnCountLimit
                })
                log.debug('arrQueryIDs', arrQueryIDs)
                log.debug('header', returnData.header)
                returnData.rows = [];
                log.debug('resultArr', resultArr)
                for (let i = 0; i < resultArr.length; i++) {
                    log.debug('resultArr', resultArr[i])
                    let arrReturnData = []
                    for (let j = 0; j < arrQueryIDs.length; j++) {
                        let strQueryID = arrQueryIDs[j]
                        if (strQueryID) {
                            if (resultArr[i].hasOwnProperty(strQueryID)) {
                                arrReturnData.push(resultArr[i][strQueryID])
                            }else{
                                arrReturnData.push('')
                            }
                        }
                    }
                    // returnData.rows.push([resultArr[i].id, resultArr[i].name, resultArr[i].quantityavailable, resultArr[i].quantityonhand]);
                    returnData.rows.push(arrReturnData);
                }
                returnData.rows = returnData.rows.slice(0,parseInt(intRowLimit));
                return returnData;
            } catch (e) {
                log.error("Error at [fetchData] function",
                    'Name:<\/br>' + e.name + '<\/br><\/br>Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
            }
        }

        return {
            onRequest: onRequest
        };

    });
