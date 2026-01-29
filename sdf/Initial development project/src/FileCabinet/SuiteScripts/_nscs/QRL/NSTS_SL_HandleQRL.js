/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *
 * File  Name  : NSTS_SL_HandleOTU.js
 * Script Name : NS|SL|HandleOTU
 * Script Type : Suitelet Script
 * Script ID   : customscript_ns_sl_handleotu
 *
 * This consumes the OTU if valid.
 *
 * Version    Date         Author               Note
 * 1.00       Feb 20 2025  Kaiser Torrevillas   Initial commit.
 * 2.00       Feb 26 2025  Kaiser Torrevillas   Add validations for IP Address, URL Expiration Date.
 * 3.00       Mar 10 2025  Kaiser Torrevillas   Move validations to POST. Add validation errors.
 * 4.00       Mar 27 2025  Kaiser Torrevillas   Add POST actions. Add validation errors. Add functionality to allow quantity manipulation for the IR.
 * 5.00       Apr 04 2025  Kaiser Torrevillas   Update handling of setup action types.
 * 6.00       Apr 12 2025  Kaiser Torrevillas   Update search for source transaction.
 *
 * **/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/redirect', './lib/NSUtilvSS2'],
    (record, search, serverWidget, redirect, nsUtil) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const REQUIRED_PARAMS = ['rf'];
            const VALIDATION_ERRORS = {
                INVALID_URL: 'Invalid URL. Please contact an administrator.',
                EXPIRED_URL: 'Expired URL. Please contact an administrator to generate a new QRL.',
                CREDENTIALS_MISMATCH: 'Credentials Mismatch. Please contact an administrator.',
                INCORRECT_ANSWER: 'Validation Failed. Kindly double check the transaction id you provided.',
                SESSION_INVALID: 'Session Invalid. Kindly refresh the page and try again!',
                SRC_TXN_NOTFOUND: 'Source Transaction Not Found. Please contact an administrator.',
                GEN_ERR: 'General Error. Please contact an administrator.',
                NOT_VALID: 'Consignment Order order# is not valid for receiving. Please contact an administrator.',
            }

            try {
                if (scriptContext.request.method === 'POST') {
                    log.audit('scriptContext.request.body', scriptContext.request.body);
                    log.audit('scriptContext.request.parameters', scriptContext.request.parameters);
                    let objCookies = getCookies(scriptContext);
                    log.audit('scriptContext objCookies', objCookies);

                    /*** Start of validation ***/
                    let objBody = JSON.parse(scriptContext.request.body);
                    let stLoc = objBody.loc;
                    let stAction = objBody.action; //Validate OR Process
                    let ipAddress = scriptContext.request.headers['ns-client-ip'];
                    let objParams = {}

                    log.audit('objBody', objBody);
                    log.audit('stLoc', stLoc);
                    log.audit('ipAddress', ipAddress);


                    //Check if all required params were provided
                    let bParamMissing = false;
                    let arrMissing = [];
                    REQUIRED_PARAMS.forEach(param => {
                        log.audit('param', param);
                        if (!scriptContext.request.parameters.hasOwnProperty(param)) {
                            bParamMissing = true;
                            arrMissing.push(param);
                        } else {
                            Object.defineProperty(objParams, param, {
                                value: scriptContext.request.parameters[param],
                                writable: true,
                                enumerable: true
                            });
                        }
                    });

                    log.audit('objParams', objParams);
                    if (bParamMissing) {
                        log.error({
                            title: 'Missing Required Parameters', details: {
                                required: REQUIRED_PARAMS,
                                missing: arrMissing
                            }
                        });
                        scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.INVALID_URL)});
                        return;
                    }

                    //Validate if requesting IP matches the Suitelet's IP to avoid manual injects on the Suitelet's URL through console fetch (POST) or CORS.
                    if (objBody.ip !== ipAddress) {
                        log.error({
                            title: 'Requesting IP Mismatch, URL Tampered', details: {
                                form_ip: objBody.ip,
                                suitelet_ip: ipAddress
                            }
                        });
                        scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.CREDENTIALS_MISMATCH)});
                        return;
                    }

                    //Validate if OTU record exists
                    let objOTURec = getOTURec(scriptContext.request.parameters.rf);
                    if (nsUtil.isEmpty(objOTURec)) {
                        log.error({title: 'OTU DOES NOT EXIST', details: scriptContext.request.parameters})
                        scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.INVALID_URL)});
                        return;
                    }
                    log.audit({
                        title: 'objOTURec details', details: objOTURec
                    });
                    //Validate if URL is not yet expired
                    let dtExp = new Date(objOTURec.exp);
                    dtExp.setDate(dtExp.getDate() + 1); //To allow up to EOD of expiration date.
                    if (new Date() > dtExp) {
                        createAccessLog(objOTURec, {
                            ip: objBody.ip,
                            loc: stLoc,
                            success: false,
                            error: VALIDATION_ERRORS.EXPIRED_URL
                        });
                        scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.EXPIRED_URL)});
                        return;
                    }

                    //Validate if answer to challenge question is correct
                    let stAnswer;
                    if(stAction === 'Validate') {
                        stAnswer = objBody.postData;
                    }else{ //Check if request cookies contains the session ans and uid. If not, throw an error.
                        log.audit({title:'objCookies',details:{
                                session_cs_ans:objCookies.session_cs_ans,
                                session_cs_guid: objCookies.session_cs_guid
                            }})
                        if(objCookies.hasOwnProperty('session_cs_ans') && objCookies.hasOwnProperty('session_cs_guid')
                            && objCookies.session_cs_ans!==''
                            && objCookies.session_cs_guid !==''
                            && objCookies.session_cs_guid === scriptContext.request.parameters.rf){
                            stAnswer = objCookies.session_cs_ans;
                        } else {
                            createAccessLog(objOTURec, {
                                ip: objBody.ip,
                                loc: stLoc,
                                success: false,
                                error: VALIDATION_ERRORS.SESSION_INVALID
                            });
                            scriptContext.response.write({output: writeResponse(false, VALIDATION_ERRORS.SESSION_INVALID)});
                            return;
                        }
                    }
                    log.audit({title:'stAnswer',details:stAnswer})

                    let stCorrectAnswer = objOTURec.answer.includes('#') ? objOTURec.answer.substring(objOTURec.answer.indexOf('#')).replaceAll('#', '') : objOTURec.answer;
                    if (stAnswer.trim().toLowerCase() !== stCorrectAnswer.trim().toLowerCase()) {
                        createAccessLog(objOTURec, {
                            ip: objBody.ip,
                            loc: stLoc,
                            success: false,
                            error: VALIDATION_ERRORS.INCORRECT_ANSWER
                        });
                        scriptContext.response.write({output: writeResponse(false, VALIDATION_ERRORS.INCORRECT_ANSWER)});
                        return;
                    }

                    //Check if Source Transaction is existing
                    let objSrcTxn = objOTURec.tran_ref;


                    //     search.lookupFields({
                    //     type: 'customrecord_ns_qrl',
                    //     id: objOTURec.id,
                    //     columns: ['custrecord_ns_qrl_trx']
                    // })
                    // log.audit('objSrcTxn', objSrcTxn);
                    //
                    // if (nsUtil.isEmpty(objSrcTxn)) {
                    //     log.audit({
                    //         title: 'SRC TXN NOT FOUND', details: {
                    //             ip: objBody.ip,
                    //             otuid: objOTURec.id
                    //         }
                    //     });
                    //     createAccessLog(objOTURec, {
                    //         ip: objBody.ip,
                    //         loc: stLoc,
                    //         success: false,
                    //         error: VALIDATION_ERRORS.SRC_TXN_NOTFOUND
                    //     });
                    //     scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.SRC_TXN_NOTFOUND)});
                    //     return;
                    // }

                    // let recSrcTxn = search.lookupFields({
                    //     type:objOTURec.setup_rectype,
                    //     id:objSrcTxn.custrecord_ns_qrl_trx[0].value,
                    //     columns:['status']
                    // });


                    let tranSearch = search.create({
                        type: objOTURec.rectype,
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "entity", label: "Name"}),
                                search.createColumn({name: "statusref", label: "Status"})
                            ]
                    });
                    tranSearch.filters.push(...[
                        search.createFilter({
                            name:'internalid',
                            operator: search.Operator.ANYOF,
                            values: objSrcTxn
                        }),
                        search.createFilter({
                            name:'mainline',
                            operator: search.Operator.IS,
                            values: 'T'
                        }),
                    ])

                    log.debug({title:'tranSearch', details:tranSearch});
                    if(tranSearch.runPaged().count===0){
                        createAccessLog(objOTURec, {
                            ip: objBody.ip,
                            loc: stLoc,
                            success: false,
                            error: VALIDATION_ERRORS.SRC_TXN_NOTFOUND
                        });
                        scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.SRC_TXN_NOTFOUND)});
                        return;
                    }

                    let recSrcTxn = tranSearch.run().getRange({start:0, end:1})[0];


                    log.debug({title:'recSrcTxn', details:recSrcTxn});
                    // if(!recSrcTxn.getText({name:'statusref'}).toLowerCase().includes('pending receipt')){
                    //     let stErr=VALIDATION_ERRORS.NOT_VALID.replaceAll('order#',objOTURec.answer)+' | Order Status: '+recSrcTxn.getText({name:'statusref'});
                    //
                    //     createAccessLog(objOTURec, {
                    //         ip: objBody.ip,
                    //         loc: stLoc,
                    //         success: false,
                    //         error: stErr
                    //     });
                    //     scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.NOT_VALID.replaceAll('order#',objOTURec.answer))});
                    //     return;
                    // }

                    /*** End of validation ***/
                    const updateOTU = ()=>{
                        //Update OTU record
                        let recOTU = record.load({
                            type: 'customrecord_ns_qrl',
                            id: objOTURec.id
                        });

                        let intRemainingUse = recOTU.getValue({fieldId: 'custrecord_ns_qrl_remaininguse'});

                        intRemainingUse -= 1; //Deduct 1

                        if (intRemainingUse === 0) {
                            //Mark OTU as consumed.
                            // recOTU.setValue({fieldId: 'custrecord_ns_qrl_consumed', value: true});

                            record.submitFields({
                                type: objOTURec.rectype,
                                id: objSrcTxn,
                                values: {
                                    custbody_ns_gen_qrl: '',
                                    custbody_ns_gen_qrl_lt: ''
                                }
                            });
                        }
                        recOTU.setValue({fieldId: 'custrecord_ns_qrl_remaininguse', value: intRemainingUse});
                        recOTU.setValue({fieldId: 'custrecord_ns_qrl_payload', value: JSON.stringify(objBody.postData)});
                        let idRec = recOTU.save();

                        log.audit('idRec', idRec);
                    }

                    if(stAction === 'Validate'){
                        switch (parseInt(objOTURec.action_type)){
                            case 1: //POST TO SUITELET
                                //Get items that can be received.
                                let objSearch = search.create({
                                    type: objOTURec.rectype,
                                    filters:
                                        [
                                            ["internalid","anyof",objSrcTxn],
                                            "AND",
                                            ["mainline","is","F"],
                                            "AND",
                                            ["quantity","greaterthan","0"],
                                            "AND",
                                            ["quantityshiprecv","notequalto","0"],
                                            "AND",
                                            ["quantityshiprecv","isnotempty",""],
                                            "AND",
                                            ["sum(formulanumeric: CASE WHEN {quantity} > 0 THEN  {quantityshiprecv}*-1 ELSE {quantityshiprecv} END)","greaterthan","0"]
                                        ],
                                    columns:
                                        [
                                            search.createColumn({
                                                name: "internalid",
                                                summary: "GROUP",
                                                label: "Internal ID"
                                            }),
                                            search.createColumn({
                                                name: "internalid",
                                                join: "item",
                                                summary: "GROUP",
                                                label: "Internal ID"
                                            }),
                                            search.createColumn({
                                                name: "itemid",
                                                join: "item",
                                                summary: "GROUP",
                                                label: "Name"
                                            }),
                                            search.createColumn({
                                                name: "salesdescription",
                                                join: "item",
                                                summary: "GROUP",
                                                label: "Description"
                                            }),
                                            search.createColumn({
                                                name: "formulanumeric",
                                                summary: "SUM",
                                                formula: "CASE WHEN {quantity} > 0 THEN  {quantityshiprecv}*-1 ELSE {quantityshiprecv} END",
                                                label: "Qty to Receive"
                                            })
                                        ]
                                });

                                let arrItems = [];
                                objSearch.run().each(objRes=>{
                                    arrItems.push({
                                        id:objRes.getValue({
                                            name: "internalid",
                                            join: "item",
                                            summary: "GROUP"
                                        }),
                                        item:objRes.getValue({
                                            name: "itemid",
                                            join: "item",
                                            summary: "GROUP"
                                        }),
                                        desc:objRes.getValue({
                                            name: "salesdescription",
                                            join: "item",
                                            summary: "GROUP"
                                        }),
                                        qty:objRes.getValue({
                                            name: "formulanumeric",
                                            summary: "SUM",
                                            formula: "CASE WHEN {quantity} > 0 THEN  {quantityshiprecv}*-1 ELSE {quantityshiprecv} END",
                                        }),
                                    })
                                    return true;
                                });

                                log.audit({title:'arrItems', details: arrItems});
                                scriptContext.response.write({output:writeResponse(true,'Validation Successful', arrItems)});
                                // scriptContext.response.write({output:writeResponse(true,'Validation Successful and '+objOTURec.answer+' was received. You can close this page now and review the record in NetSuite.')});
                                break;
                            case 2: //GET SUITELET

                                break;
                            case 3: //DISPLAY PDF
                                break;
                            case 4: //REDIRECT
                                if(!nsUtil.isEmpty(objOTURec.redirect)) {
                                    //Create Access Log
                                    createAccessLog(objOTURec, {
                                        ip: objBody.ip,
                                        loc: stLoc,
                                        success: true,
                                        error: ''
                                    });
                                    scriptContext.response.write({output: writeResponse(true, 'Validation Successful', objOTURec.redirect, true)});
                                } else {
                                    createAccessLog(objOTURec, {
                                        ip: objBody.ip,
                                        loc: stLoc,
                                        success: false,
                                        error: 'Redirect Link is Empty'
                                    });
                                    scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.GEN_ERR)});
                                    return;
                                }
                                break;
                        }

                    } else if(stAction === 'Receive'){
                        /*** Process Consumption ***/
                        try {

                            let objIR = record.transform({
                                fromType: objOTURec.rectype,
                                fromId: objSrcTxn,
                                toType: record.Type.ITEM_RECEIPT
                            });

                            //Only receive items that were selected as received.
                            let arrItems = objBody.postData.map(objItem=>parseInt(objItem.id));

                            log.audit({title:'setting - arrItems', details:arrItems})

                            let intCount = objIR.getLineCount({sublistId:'item'});
                            for (let i = 0; i<intCount; i++){
                                let itemKey=parseInt(objIR.getSublistValue({
                                    sublistId:'item',
                                    fieldId:'itemkey',
                                    line:i
                                }));
                                if(arrItems.includes(itemKey)){ //Select the line
                                    objIR.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'itemreceive',
                                        value: true,
                                        line: i
                                    });

                                    let objItem = objBody.postData.find(objItem=>parseInt(objItem.id)===itemKey)

                                    objIR.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        value: objItem.qty,
                                        line: i
                                    });
                                } else { //Deselect the line
                                    objIR.setSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'itemreceive',
                                        value: false,
                                        line: i
                                    });
                                }
                            }

                            let idIR = objIR.save({ignoreMandatoryFields: true});

                            log.audit('GENERATED ITEM RECEIPT', idIR);
                            updateOTU();
                            scriptContext.response.write({output:writeResponse(true,'Validation Successful and '+objOTURec.answer+' was received. You can close this page now and review the record in NetSuite.')});

                            //Create Access Log
                            createAccessLog(objOTURec, {
                                ip: objBody.ip,
                                loc: stLoc,
                                success: true,
                                error: ''
                            });

                        } catch (inner_ex) {
                            log.error('Inner SL Error', inner_ex);
                            createAccessLog(objOTURec, {
                                ip: objBody.ip,
                                loc: stLoc,
                                success: false,
                                error: inner_ex
                            });
                            scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.GEN_ERR)});
                        }
                        /*** Processing Done ***/
                    }
                    // log.audit('scriptContext.request.', scriptContext.request);
                    // log.audit('scriptContext.request.parameters', scriptContext.request.parameters);
                    // record.submitFields({
                    //     type: 'customrecord_ns_qrl',
                    //     id: scriptContext.request.parameters.custpage_otuid,
                    //     values: {
                    //         custrecord_ns_qrl_consumed: true,
                    //         custrecord_ns_qrl_ip: scriptContext.request.parameters.custpage_ip,
                    //         custrecord_ns_qrl_geoloc: scriptContext.request.parameters.custpage_geoloc
                    //     }
                    // });
                    //
                    //
                    //
                    // //Process Receipt of TO here
                    // let objIR = record.transform({
                    //     fromType: record.Type.TRANSFER_ORDER,
                    //     fromId: objSrcTxn.custrecord_ns_qrl_trx[0].value,
                    //     toType: record.Type.ITEM_RECEIPT
                    // });
                    //
                    // let idIR = objIR.save({ignoreMandatoryFields:true});
                    //
                    // log.audit('GENERATED ITEM RECEIPT', idIR);
                    //
                    // record.submitFields({
                    //     type: record.Type.TRANSFER_ORDER,
                    //     id: objSrcTxn.custrecord_ns_qrl_trx[0].value,
                    //     values: {
                    //         custbody_ns_gen_otu: '',
                    //         custbody_ns_gen_qrl_lt: ''
                    //     }
                    // });
                    //
                    // redirect.redirect({
                    //     url: scriptContext.request.parameters.custpage_exturl,
                    //     parameters: {
                    //         cmp: 't',
                    //         tid: scriptContext.request.parameters.custpage_tranid
                    //     }
                    // });
                }

            } catch (e) {
                log.error('SL Error', e);
                scriptContext.response.write({output:writeResponse(false,VALIDATION_ERRORS.GEN_ERR)});
            }


        }

        const writeResponse = (bIsSuccess, msg, data = {}||'', redirect=false) => {
            return JSON.stringify({
                success: bIsSuccess,
                redirect: redirect,
                msg: msg,
                data: data
            })
        }

        /***
         *
         * @param recOTU
         * @param objParams
         * @param objParams.ip
         * @param objParams.loc
         * @param objParams.success
         * @param objParams.error
         *
         */
        const createAccessLog = (recOTU, objParams) => {
            let recAL = record.create({
                type: 'customrecord_ns_qrl_accesslogs'
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_rec',
                value: recOTU.id
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_al_url',
                value: recOTU.url
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_al_ip',
                value: objParams.ip
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_al_geoloc',
                value: objParams.loc
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_al_valstat',
                value: objParams.success
            });

            recAL.setValue({
                fieldId: 'custrecord_ns_qrl_al_error',
                value: objParams.error
            });

            let recId = recAL.save();
            log.audit({title: 'createAccessLog', details: recId})
        }

        const getOTURec = (stGUUID) => {
            log.debug({
                title: 'getOTURec',
                details: stGUUID
            });

            let objSearch = search.load({id: 'customsearch_ns_get_qrl'});
            objSearch.filters.push(...[
                // search.createFilter({
                //     name: 'custrecord_ns_qrl_remaininguse',
                //     operator: search.Operator.GREATERTHAN,
                //     values: 0
                // }),
                search.createFilter({
                    name: 'custrecord_ns_qrl_guid',
                    operator: search.Operator.IS,
                    values: stGUUID
                })]);

            let objRes = objSearch.run().getRange({start: 0, end: 1});

            log.debug({
                title: 'objRes',
                details: objRes
            });
            log.debug({
                title: 'objRes-length',
                details: objRes.length
            });
            if (objRes.length > 0) {
                return {
                    id: objRes[0].getValue({name: 'internalid'}),
                    answer: objRes[0].getValue({name: 'custrecord_ns_qrl_answer'}),
                    tran_ref: objRes[0].getValue({name: 'custrecord_ns_qrl_trx'}),
                    exp: objRes[0].getValue({name: 'custrecord_ns_qrl_valid_until'}),
                    setup_id: parseInt(objRes[0].getValue({name: 'internalid', join: 'CUSTRECORD_NS_QRL_CONFIG'})),
                    rectype: objRes[0].getValue({name: 'recordtype', join: 'custrecord_ns_qrl_trx'}),
                    url: objRes[0].getValue({name: 'custrecord_ns_qrl_link'}),
                    action_type: objRes[0].getValue({name: 'custrecord_ns_qrl_actiontype'}),
                    redirect: objRes[0].getValue({name: 'custrecord_ns_qrl_redirect'})
                };
            }

            return null;

        }

        const getCookies = (context) => {

            let cookies = {}

            let cookiesOriginal = context.request.headers['cookie'];

            if ( cookiesOriginal == null ) {
                return cookies;
            }

            cookiesOriginal = cookiesOriginal.split("; ");

            for ( let i = 0; i < cookiesOriginal.length; i++ ){

                let thisCookie = cookiesOriginal[i];

                thisCookie = thisCookie.split("=");

                cookies[thisCookie[0]] = thisCookie[1];

            }

            return cookies;

        }

        return {onRequest}

    });