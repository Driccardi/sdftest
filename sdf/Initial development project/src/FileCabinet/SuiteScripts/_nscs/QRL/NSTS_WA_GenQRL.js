/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *
 * File  Name  : NSTS_WA_GenOTU.js
 *
 * Workflow Action Script that generates the OTU.
 *
 * Version    Date         Author               Note
 * 1.00       Mar 17 2025  Kaiser Torrevillas   Initial commit.
 * 2.00       Mar 17 2025  Kaiser Torrevillas   Change how GUUID is generated.
 * 3.00       Apr 12 2025  Kaiser Torrevillas   Fix bug in linking the OTU setup record; Add setting of redirect
 *
 * **/
/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/record', 'N/currentRecord', 'N/search', 'N/runtime', 'N/crypto/random', 'N/query', 'N/url', 'N/format', './lib/NSUtilvSS2'],

    (record, currentRecord, search, runtime, random, query, url, format, nsUtil) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {
            let stTitle = 'onAction';
            log.audit({title:stTitle+'scriptContext', details: scriptContext});
            const recCurrent = scriptContext.newRecord;
            let objOTUValidation = hasOTURec(scriptContext.newRecord.id)
            const objParams = {
                id: recCurrent.id,
                tranid: recCurrent.getValue({fieldId: 'tranid'}),
                bRegen: objOTUValidation.existing,
                otu_id: objOTUValidation.otu_id,
                idTranType:  runtime.getCurrentScript().getParameter({name:'custscript_ns_type'})
            }
            log.audit({title:stTitle+'_objParams', details: objParams});
            // return;
            try {

                let objOTUConfig = getOTUSetup(objParams.idTranType);
                if(nsUtil.isEmpty(objOTUConfig)){
                    log.audit({title:stTitle+'OTU SETUP NOT FOUND FOR'+objParams.idTranType, details:'PLEASE CONTACT AN ADMINISTRATOR!'});
                    return;
                }

                log.audit({title:stTitle+'-objParams', details:objParams});
                // objParams = JSON.parse(objParams);
                let stBaseExternalURL = objOTUConfig.ext_form;
                log.audit({title:stTitle+'-recCurrent.id', details:recCurrent.id});
                log.audit({title:stTitle+'-recCurrent.getField({fieldId:\'tranid\'})', details:recCurrent.getField({fieldId:'tranid'})});

                let stParsedGUID=getUUID(objOTUConfig.id);

                log.audit({title:stTitle+'-stParsedGUID', details:stParsedGUID});

                // let stOTU = stBaseExternalURL+'&rf='+stGUUID+'&tp='+objOTUConfig.id;
                let stOTU = stBaseExternalURL+'&rf='+stParsedGUID;
                log.audit({title:stTitle+'-stOTU', details:stOTU});

                let recOTU;
                if(objParams.bRegen){
                    //Regenerate OTU
                    recOTU = record.load({
                        type:'customrecord_ns_qrl',
                        id: objParams.otu_id
                    });
                } else {
                    //Create the OTU record
                    recOTU = record.create({
                        type:'customrecord_ns_qrl',
                    });
                }

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_config',
                    value:objOTUConfig.id
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_valid_until',
                    value:format.parse({
                        value: getExpirationDate(objOTUConfig.validity),
                        type: format.Type.DATE
                    })
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_redirect',
                    value:recCurrent.getValue({fieldId:'custbody_ns_csgn_url'})
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_guid',
                    value:stParsedGUID
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_trx',
                    value:recCurrent.id
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_maxuse',
                    value:objOTUConfig.def_max_usage
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_remaininguse',
                    value:objOTUConfig.def_max_usage
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_answer',
                    value:objParams.tranid
                });

                recOTU.setValue({
                    fieldId:'custrecord_ns_qrl_link',
                    value:stOTU
                });

                let recID = recOTU.save();
                log.audit({title:stTitle+'-recID', details:recID});

                return stOTU;
                // record.submitFields({
                //     type: recCurrent.type,
                //     id: objParams.id,
                //     values:{
                //         custbody_ns_gen_qrl: stOTU,
                //         custbody_ns_gen_qrl_lt: stOTU
                //     }
                // });
            } catch (e) {
                log.error(stTitle+ 'UE ERROR', e.toJSON ? e : (e.stack ? e.stack : e.toString()));
            }
        }

        const hasOTURec = (idRec) => {
            let objSearch = search.load({id:'customsearch_ns_get_qrl'});
            objSearch.filters.push(search.createFilter({
                name:'custrecord_ns_qrl_trx',
                operator:search.Operator.ANYOF,
                values:idRec
            }));

            let objRes = objSearch.run().getRange({start:0, end:1})

            log.debug({
                title: 'hasOTURec',
                details: objRes
            });
            log.debug({
                title: 'hasOTURec-length',
                details: objRes.length
            });

            return {
                existing: objRes.length>0,
                otu_id: objRes.length>0?objRes[0].getValue({name:'internalid'}):null
            };

        }

        const getOTUSetup = (idTranType)=>{
            log.debug({
                title: 'getOTUSetup',
                details: idTranType
            });

            let objSearch = search.load({id: 'customsearch_ns_get_qrl_setup'});
            objSearch.filters.push(search.createFilter({
                name: 'custrecord_ns_qrlsetup_rectype',
                operator: search.Operator.ANYOF,
                values: idTranType
            }));

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
                    ext_form: objRes[0].getValue({name: 'custrecord_ns_qrlsetup_extform'}),
                    ext_sl: objRes[0].getValue({name: 'custrecord_ns_qrlsetup_extsl'}),
                    validity: objRes[0].getValue({name: 'custrecord_ns_qrlsetup_valperiod'}),
                    def_max_usage: objRes[0].getValue({name: 'custrecord_ns_qrlsetup_maxusage'})
                };
            }
            return null;
        }

        const getUUID = (id) => {
            let stParsedGUID = '';
            //GUUID
            let stGUUID = random.generateUUID();
            //8-4-4-4-12
            let intPlace = random.generateInt({min: 0, max:4});
            log.audit({title:'getUUID-stGUUID', details:stGUUID});
            log.audit({title:'getUUID-intPlace', details:intPlace});

            //Deconstruct GUID
            let arrGUID = stGUUID.split('-');
            let stIX1 = `${arrGUID[intPlace]}${id}`

            log.audit({title:'getUUID-stIX1', details:stIX1});
            //Reconstruct the GUID inserting the setup id
            for(let i=0; i<arrGUID.length; i++){
                let str = arrGUID[i];
                if(i===intPlace){
                    str = stIX1;
                }
                stParsedGUID+=stParsedGUID.length===0?str:'-'+str;
            }
            return stParsedGUID;
        }
        const getExpirationDate = (intDays) =>{
            log.audit({title:'getExpirationDate - DAYS TO ADD', details:intDays})

            let today = new Date();
            today.setDate(today.getDate() + parseInt(intDays));
            let yyyy = today.getFullYear();
            let mm = today.getMonth() + 1; // Months start at 0!
            let dd = today.getDate();
            const dtExpiration = mm.toString().padStart(2,'0') + '/' + dd.toString().padStart(2,'0') + '/' +  yyyy;
            log.audit({title:'EXPIRATION DATE', details:dtExpiration});

            return dtExpiration;
        }

        return {onAction};
    });
