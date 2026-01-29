/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data. It is best suited for situations where the data can be divided into small, independent parts. When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * This script will be used to re-calculate the Remaining Serviceable Quantity for the Customer Service Hub
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2024/16/01           shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/search', 'N/record', './cshub_library'], (runtime, search, record, cshub) => {
    let strLogTitle;
    const getInputData = () => {
        try {
            strLogTitle = 'getInputData';
            let intTranID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_rsq_transaction_id');

            let objTransactionSearch = cshub.general.getRSQStaleData(intTranID);
            let results = objTransactionSearch.results;
            let intResultCount = results.length;
            log.debug("SearchObj result count", intResultCount);
            if (intResultCount > 0) {
                return results;
            } else {
                log.audit('No data to process', 'Saved search is not getting results')
                return false;
            }
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const map = (context) => {
        try {
            strLogTitle = 'map';
            let objSearchResults = JSON.parse(context.value);
            log.debug(strLogTitle+' objSearchResults', objSearchResults);
            let objValues = JSON.parse(objSearchResults.values[7]); //getting rsq json
            log.debug(strLogTitle+' objValues', objValues);

            for (let i = 0; i < objValues.length; i++) {
                log.debug(strLogTitle + ' objValues --', objValues[i]);
                let strTranid = objValues[i][1];
                let strLineID = objValues[i][2];
                let intQTY = objValues[i][3];

                log.debug(strLogTitle + ' objValues', 'strTranid: ' + strTranid + '| strLineID: ' + strLineID + ' | intQTY: ' + intQTY);
                context.write({
                    key: strTranid,
                    value: {
                        strLineID : strLineID,
                        intQTY: intQTY
                    }
                })
            }
        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const reduce = (context) => {
        try {
            strLogTitle = 'reduce';
            let idTransaction = parseInt(context.key);

            let intTotalQTY = 0;


            let strTransactionType = getTransactionType(idTransaction)
            const recTransaction = record.load({
                type: strTransactionType,
                id: idTransaction,
                isDynamic: true
            });


            for (let i = 0; context.values.length > i; i++) {
                let objValues = JSON.parse(context.values[i]);
                let intTotalQTY = parseInt(objValues.intQTY);
                let intTranLine = objValues.strLineID;
                // intTotalQTY += intQTY;

                log.debug(strLogTitle + ' Grouped Values', 'strTranid: ' + idTransaction + '| strLineID: ' + intTranLine + ' | intTotalQTY: ' + intTotalQTY );

                updateTransactionValues(recTransaction, intTranLine, intTotalQTY)
            }
            //
            //
            // for (let j = 0; arrGroupedEtail.length > j; j++) {
            //     let  intTranLine= arrGroupedEtail[j];
            //
            //     log.debug(strLogTitle + ' Grouped Values', 'strTranid: ' + idTransaction + '| strLineID: ' + intTranLine + ' | intTotalQTY: ' + intTotalQTY );
            //
            //     updateTransactionValues(recTransaction, intTranLine, intTotalQTY)
            // }

            let dtDateNow = new Date()
            log.debug(strLogTitle + ' dtDateNow:', dtDateNow);

            recTransaction.setValue({
                fieldId: 'custbody_cshub_srvc_qty_timestamp',
                value: dtDateNow
            });

            recTransaction.setValue({
                fieldId: 'custbody_cshub_rsq_updt_cmplt',
                value: true
            })

            recTransaction.save({
                // enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.audit(strLogTitle, `${strTransactionType} with ID: ${idTransaction} is now updated.`)

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

    const updateTransactionValues = (recTransaction, intTranLine, intTotalQTY) => {
        strLogTitle = 'updateTransactionValues'


        let intLineCount = recTransaction.getLineCount('item')
        log.debug(strLogTitle + ' intLineCount', intLineCount)

        for (let i = 0; intLineCount > i; i++) {

            recTransaction.selectLine({
                line: i,
                sublistId: 'item'
            });

            let strEtailID = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_etail_field_id_rsq');

            let strTranLine = recTransaction.getCurrentSublistValue({
                fieldId: strEtailID,
                sublistId: 'item',
            });

            // let intUsageType = recTransaction.getCurrentSublistValue({
            //     fieldId: 'custcol_br_src_item_line_usage',
            //     sublistId: 'item',
            // });

            let intQTY = recTransaction.getCurrentSublistValue({
                fieldId: 'custcol_cshub_srvcbl_qty',
                sublistId: 'item',
            });
            log.debug(strLogTitle + ' Quantity Updated:', {
                line: i,
                'oldQTY' : intQTY,
                'totalQTYfromSearch' : intTotalQTY,
                'strTranLine' : strTranLine,
                intTranLine : intTranLine
            });
            if (strTranLine === intTranLine) {
                let intNewQTY =  parseInt(intQTY) - parseInt(intTotalQTY);
                recTransaction.setCurrentSublistValue({
                    fieldId: 'custcol_cshub_srvcbl_qty',
                    sublistId: 'item',
                    value: forceInt(intNewQTY),
                    line: i
                });
                recTransaction.commitLine('item');
                log.audit(strLogTitle + ' Quantity Updated:', {
                    line: i,
                    'oldQTY' : intQTY,
                    'totalQTYfromSearch' : intTotalQTY,
                    'intNewQTY' : intNewQTY,
                    'strTranLine' : strTranLine
                });

            }
        }

    }

    const getTransactionType = (idTransaction) => {
        strLogTitle = 'getTransactionType';
        let strTranType = search.lookupFields({
            id: idTransaction,
            type: search.Type.TRANSACTION,
            columns: ['type']
        }).type[0].text
        log.debug(strLogTitle + ' strType:', strTranType)
        return strTranType.toLowerCase().replace(/\s/g, '');
    }

    const summarize = (summary) => {
        try {
            strLogTitle = 'summarize';

            log.audit(strLogTitle, 'Execution time in seconds: ' + summary.seconds +
                ' | Usage Consumed: ' + summary.usage +
                ' | Usage Consumed: ' + summary.yields +
                ' | Concurrency Number: ' + summary.concurrency
            );
            if (summary.inputSummary.error !== null) {
                log.error('Input Error: ', summary.inputSummary.error);
            }
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error: ', error);
                return true;
            });

        } catch (e) {
            log.error("Error at [" + strLogTitle + "] function",
                'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
        }
    }

   const forceInt = (stValue) =>
    {
        var intValue = parseInt(stValue, 10);

        if (isNaN(intValue) || (stValue == Infinity))
        {
            return 0;
        }

        return intValue;
    };

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
})