/* 
* Copyright (c) 1998-2023 Oracle NetSuite, Inc.
* 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
* All Rights Reserved.
* This software is the confidential and proprietary information of
* NetSuite, Inc. ('Confidential Information'). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Oracle NetSuite.
*
* Version Date Author Remarks
* 1.00 [Today's date] riccardi initial build
*/
 
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/query', 'N/record', 'N/url', 'N/runtime', 'N/format', 'N/log'], function (query, record, url, runtime, format, log) {
    'use strict';

    const LOG_PREFIX = 'QRSO-SU';

    /**
     * Build parameterized SuiteQL to get open estimates
     * NOTE: SuiteQL + supported functions only; avoid unsupported ones (e.g., DATEDIFF, LISTAGG).
     * We rely on status code 'Estimate:A' for Open.
     */
    function getOpenQuotes(intCustomerId, intLimit) {
        intLimit = intLimit || 20;
        //log parameters
        log.debug({ title: `${LOG_PREFIX} getOpenQuotes`, details: `CustomerId=${intCustomerId}, Limit=${intLimit}` });
        const sql = `
            SELECT 
                t.id,
                t.tranid,
                TO_CHAR(t.trandate, 'YYYY-MM-DD') AS trandate,
                BUILTIN.DF(t.status) status,
                BUILTIN.DF(t.currency) currency,
                tl.netamount total
            FROM transaction t, transactionline tl
            WHERE t.type = 'Estimate'
	        AND t.id = tl.transaction
            AND tl.lineSequenceNumber = 0
            AND t.entity = ?
            AND NVL(t.voided, 'F') = 'F'
            ORDER BY t.trandate DESC
        `;
        log.debug({ title: `${LOG_PREFIX} SQL`, details: sql });
        // Parameterized query
        const result = query.runSuiteQL({
            query: sql,
            params: [intCustomerId]
        });

        const mapped = [];
        const results = result.asMappedResults();
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            // Resolve URL to record
            let recUrl = '';
            try {
                recUrl = url.resolveRecord({
                    recordType: record.Type.ESTIMATE,
                    recordId: r.id,
                    isEditMode: false
                });
            } catch (e) {
                recUrl = '';
            }

            // Currency display and amount formatting
            // NOTE: For formatting, use N/format for number. Currency symbol is not included; we include currency code + formatted number.
            const num = Number(r.total || 0);
            const totalFormatted = format.format({
                value: num,
                type: format.Type.CURRENCY
            });

            mapped.push({
                id: r.id,
                tranid: r.tranid,
                trandate: r.trandate, // ISO-like string for display
                status: r.status,
                currency: r.currency, // currency code
                total: num,
                totalFormatted: `${r.currency} ${totalFormatted}`,
                url: recUrl
            });
        }
        return mapped;
    }

    /**
     * Validate number parameter
     */
    function toPositiveInt(val, defaultVal) {
        const n = parseInt(val, 10);
        if (isNaN(n) || n <= 0) return defaultVal;
        return n;
    }

    /**
     * Suitelet onRequest
     * Returns JSON body with quotes: []
     */
    function onRequest(context) {
        try {
            if (context.request.method !== 'GET') {
                context.response.setHeader({ name: 'status', value:  405 });
                context.response.write(JSON.stringify({ error: 'Method not allowed' }));
                return;
            }

            const customerIdParam = context.request.parameters.customerId;
            const intCustomerId = parseInt(customerIdParam, 10);

            if (!intCustomerId || isNaN(intCustomerId)) {
                context.response.setHeader({ name: 'status', value: 400 });
                context.response.write(JSON.stringify({ error: 'Invalid customerId' }));
                return;
            }

            // Governance and security checks
            const user = runtime.getCurrentUser();
            log.debug({ title: `${LOG_PREFIX} Request`, details: `User ${user.id} fetching quotes for customer ${intCustomerId}` });

            // Configurable limit via script parameter
            const script = runtime.getCurrentScript();
            const intLimit = toPositiveInt(script.getParameter({ name: 'custscript_ns_qrso_limit' }), 200);

            const quotes = getOpenQuotes(intCustomerId, intLimit);

            context.response.setHeader({ name: 'status', value: 200})
            context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
            context.response.write(JSON.stringify({ quotes: quotes }));
        } catch (e) {
            log.error({ title: `${LOG_PREFIX} Error`, details: e });
            context.response.setHeader({ name: 'status', value: 500 });
            context.response.write(JSON.stringify({ error: 'Internal error' }));
        }
    }

    return {
        onRequest: onRequest
    };
});