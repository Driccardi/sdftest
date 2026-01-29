/**
 *    Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * Suitelets are server scripts that operate in a request-response model, and
 * are invoked by HTTP GET or POST requests to system generated URLs.
 *
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2024/01/02            shekainah.castillo                       Initial Commit
 *
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/redirect', 'N/record', 'N/ui/message', 'N/task'],

    (serverWidget, search, runtime, redirect, record, message, task) => {
        let strTitle;

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            strTitle = "onRequest";

            try{
                let strFormName = runtime.getCurrentScript().getParameter('custscript_ns_suitelet_copy_name');
                let objForm = serverWidget.createForm({
                    title: (strFormName)? strFormName : 'CSHUB Landing'
                });
                const request = context.request;
                if (request.method === 'GET') {
                    initialPage(context, objForm)
                } else {
                    post(request)
                }

            }catch (e) {
                log.error("Error at [" + strTitle + "] function",
                    'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack)
            }
        }

        const initialPage = (context, objForm) => {
            strTitle = "initialPage";
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            let bFromSearch = context.request.parameters.custscript_search;
            let objFilters = context.request.parameters.custscript_filters;
            pageLanding(objForm, bFromSearch, objFilters)
            context.response.writePage(objForm);
        }

        const pageLanding = (objForm, bFromSearch, objFilters) => {
            strTitle = "pageLanding";
            log.debug('Current Process', '--------- ' + strTitle + ' ---------');

            let objBRHNumFld = objForm.addField({
                id: 'custpage_order_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Other Reference Number'
            });

            objForm.addField({
                id: 'custpage_tranid',
                type: serverWidget.FieldType.SELECT,
                source: 'transaction',
                label: 'Document Number'
            });

            let intCaseType = runtime.getCurrentScript().getParameter('custscript_ns_case_action_type');
            let objDsrdActnFld = objForm.addField({
                id: 'custpage_desired_actn',
                type: serverWidget.FieldType.SELECT,
                source: 'customrecord_cshub_caseactions',
                label: 'Desired Action'
            });
            objDsrdActnFld.defaultValue = intCaseType;
            objDsrdActnFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

            let objFromDtFld = objForm.addField({
                id: 'custpage_from_date',
                type: serverWidget.FieldType.DATE,
                label: 'From Date'
            });

            let objToDtFld = objForm.addField({
                id: 'custpage_to_date',
                type: serverWidget.FieldType.DATE,
                label: 'To Date'
            });

            let objSearchParam = objForm.addField({
                id: 'custpage_search_param',
                type: serverWidget.FieldType.TEXT,
                label: 'Search Parameter'
            })
            objSearchParam.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            

            const strPortletSearch = runtime.getCurrentScript().getParameter('custscript_ns_suitelet_copy_search');
            objSearchParam.defaultValue = strPortletSearch;

            let objScriptIDFld = objForm.addField({
                id: 'custpage_script_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Script ID'
            })
            objScriptIDFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            objScriptIDFld.defaultValue = runtime.getCurrentScript().id;

            let objDeploymentID = objForm.addField({
                id: 'custpage_deployment_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Deployment ID'
            })
            objDeploymentID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            objDeploymentID.defaultValue = runtime.getCurrentScript().deploymentId;


            let objDsntnScriptIDFld = objForm.addField({
                id: 'custpage_dstntn_script_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Script ID'
            })
            objDsntnScriptIDFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            objDsntnScriptIDFld.defaultValue = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_action_sl_scrp_id');

            let objDsntnDeploymentID = objForm.addField({
                id: 'custpage_dstntn_deployment_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Deployment ID'
            })
            objDsntnDeploymentID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            objDsntnDeploymentID.defaultValue = runtime.getCurrentScript().getParameter('custscript_ns_cs_hub_action_sl_deploy_id');

            let objSublist = addSublistFields(objForm)
            let strClientScriptPath = runtime.getCurrentScript().getParameter('custscript_ns_copy_client_script_path');
            objForm.clientScriptModulePath = strClientScriptPath;

            let objSearchButton = objForm.addButton({
                id: 'searchbtn',
                label: 'Search',
                functionName: "searchTransaction()",
            });
            let intCurrentUser = runtime.getCurrentUser().id;
            let bIsSupportRep = validateSupportRep(intCurrentUser);

            // if (!bIsSupportRep) {
            //     objSearchButton.isDisabled = true;
            //     objForm.addPageInitMessage({
            //         title: "You do not have privileges to use CS Hub.",
            //         message: 'Please contact your administrator and request to be enabled as a Support Rep on your user profile.',
            //         type: message.Type.ERROR,
            //     });
            //     objBRHNumFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            //     objFromDtFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            //     objToDtFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            // }
            if(bFromSearch){
                let objResults = runTransactionSearches(objFilters, strPortletSearch)
                if(!objResults){
                    let strNoResultMsg = runtime.getCurrentScript().getParameter('custscript_ns_cshub_no_result_msg')
                    objForm.addPageInitMessage({
                        title: "No Results",
                        message: strNoResultMsg? strNoResultMsg : "No result found under this criteria.",
                        type: message.Type.WARNING,
                    });
                }else{
                    let objSublistValues = getSublistValues(objForm, objResults)
                    populateSublist(objSublist, objSublistValues)
                }
            }

        }
        const validateSupportRep = (intCurrentUser) => {
            strTitle = "validateSupportRep";
            log.debug('Current Process', '--------- ' + strTitle + ' ---------');
            let objSupportRepSearch = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: parseInt(intCurrentUser),
                columns: 'issupportrep'
            });
            log.debug(strTitle, 'isSupportRep? ' + objSupportRepSearch.issupportrep);
            return objSupportRepSearch.issupportrep;
        }

        const getSublistValues = (objForm, result) => {
            strTitle = "getSublistValues";
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            log.debug(strTitle + ' result', result)
            if (result.length != 0) {
                let objSublistValues = [];
                for (let i = 0; i < result.length; i++) {
                    let intTranID = result[i].id;
                    let strTranID = result[i].getValue('tranid');
                    let dtDate = result[i].getValue('trandate');
                    let dtDateCreated = result[i].getValue('datecreated');
                    let strItemNumber = result[i].getText('item');
                    let strBRHNum = result[i].getValue('otherrefnum');
                    let strCreatedFrom = result[i].getText('createdfrom');
                    let strReplacementOf = result[i].getText('custbody_br_sc_rplc_xcg');
                    let strItemName = result[i].getValue({
                        name: 'displayname',
                        join: 'item'
                    });
                    let intQTY = parseInt(result[i].getValue('quantity'));
                    let fltPrice = result[i].getValue('amount');
                    let bMainline = result[i].getValue('mainline');
                    let intRSQ = result[i].getValue('custcol_cshub_srvcbl_qty');

                    //ggns 2025-02-28 added strBRHNumber to intTranId to allow header only usage
                    if (!strBRHNum) {
                        strBRHNum = intTranID;
                    }
                    objSublistValues.push({
                        intTranID : intTranID,
                        strTranID : strTranID,
                        dtDate : dtDate,
                        strBRHNum : strBRHNum,
                        strItemName : strItemName,
                        intQTY : intQTY,
                        intRSQ : intRSQ,
                        fltPrice : fltPrice,
                        bMainline : (bMainline === '*'),
                        strCreatedFrom : strCreatedFrom,
                        strReplacementOf : strReplacementOf,
                        dtDateCreated : dtDateCreated,
                        strItemNumber : strItemNumber
                    });
                }
                return objSublistValues;
            }

        }

        const populateSublist = (objSublist, objSublistValues) => {
            strTitle = 'populateSublist'
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            let intCaseType = runtime.getCurrentScript().getParameter('custscript_nscs_cshub_casetype');
            log.debug(strTitle + ' objSublistValues', objSublistValues);

            for (let i = 0; objSublistValues.length > i; i++) {
                //custpage_tranid
                let intTranID = objSublistValues[i].intTranID
                let strTranID = objSublistValues[i].strTranID
                let dtDate = objSublistValues[i].dtDate
                let strBRHNum = objSublistValues[i].strBRHNum
                let strItemName = objSublistValues[i].strItemName
                let intQTY = objSublistValues[i].intQTY
                let intRSQ = objSublistValues[i].intRSQ
                let strCreatedFrom = objSublistValues[i].strCreatedFrom
                let strReplacementOf = objSublistValues[i].strReplacementOf
                let dtDateCreated = objSublistValues[i].dtDateCreated
                let strItemNumber = objSublistValues[i].strItemNumber
//$$$$$ - Start
                log.debug('$$$1- intQTY', intQTY);
                intQTY = parseInt(intQTY);
                log.debug('$$$2- intQTY', intQTY);
//$$$$$ - End
                let fltPrice = objSublistValues[i].fltPrice
                let bMainline = objSublistValues[i].bMainline
                log.debug(strTitle + ' result', 'strTranID: ' + strTranID + ' | dtDate: ' + dtDate + ' | strBRHNum: ' + strBRHNum + ' | strItemName: ' + strItemName + ' | intQTY: ' + intQTY + ' | fltPrice: ' + fltPrice+ ' | bMainline: ' + bMainline);

                objSublist.setSublistValue({
                    id: 'custpage_tranid',
                    line: i,
                    value: parseInt(intTranID)
                });



                if (!strTranID) {
                    strTranID = ''
                }
                if (!bMainline) {
                    if (strItemName) {
                        objSublist.setSublistValue({
                            id: 'custpage_item_name',
                            value: strItemName,
                            line: i,
                        });
                    }

                    if(strItemNumber){
                        objSublist.setSublistValue({
                            id: 'custpage_item_number',
                            value: strItemNumber,
                            line: i,
                        });
                    }

                    objSublist.setSublistValue({
                        id: 'custpage_quantity',
                        line: i,
                        value: intQTY ? parseInt(intQTY) : 0
                    });

                    objSublist.setSublistValue({
                        id: 'custpage_cshub_avl_qty_srvc',
                        line: i,
                        value: intRSQ ? parseInt(intRSQ) : 0
                    });

                    objSublist.setSublistValue({
                        id: 'custpage_doc_num',
                        line: i,
                        value: strTranID
                    });


                    objSublist.setSublistValue({
                        id: 'custpage_otherrefnum',
                        line: i,
                        value: (strBRHNum) ? strBRHNum : ' '
                    });

                    if (fltPrice) {
                        objSublist.setSublistValue({
                            id: 'custpage_price',
                            line: i,
                            value: fltPrice
                        });
                    }

                }else{
                    let strHyperlink = runtime.getCurrentScript().getParameter('custscript_ns_cshub_action')
                    //let strImageLink = 'https://8285163.app.netsuite.com/core/media/media.nl?id=70802&c=8285163&h=FlTh2dKc3u6JGhcXa5XRkXlGtOME2o8o-T2pHbrWf_-3WUUk'
                    let strImageLink = runtime.getCurrentScript().getParameter('custscript_cshub_landing_actionimageurl')
                    objSublist.setSublistValue({
                        id: 'custpage_item_name',
                        value: '<B><A HREF=\"' +strHyperlink+intTranID+'\">'+'<img src = '+strImageLink+' alt = "Click To Process"/>'+'</A></B>',
                        line: i,
                    });
                    objSublist.setSublistValue({
                        id: 'custpage_doc_num',
                        line: i,
                        value: '<B>'+strTranID+'</B>'
                    });

                    if (dtDate) {
                        objSublist.setSublistValue({
                            id: 'custpage_date',
                            line: i,
                            value:'<B>'+ dtDate+'</B>'
                        });
                    }

                    if (dtDateCreated) {
                        objSublist.setSublistValue({
                            id: 'custpage_date_created',
                            line: i,
                            value:'<B>'+ dtDateCreated+'</B>'
                        });
                    }

                    if(strCreatedFrom){
                        objSublist.setSublistValue({
                            id: 'custpage_created_from',
                            line: i,
                            value: '<B>'+strCreatedFrom+'</B>'
                        });
                    }

                    if(strReplacementOf){
                        objSublist.setSublistValue({
                            id: 'custpage_replacement_of',
                            line: i,
                            value: '<B>'+strReplacementOf+'</B>'
                        });
                    }

                    if (dtDate) {
                        objSublist.setSublistValue({
                            id: 'custpage_date',
                            line: i,
                            value: '<B>'+dtDate+'</B>'
                        });
                    }

                    objSublist.setSublistValue({
                        id: 'custpage_otherrefnum',
                        line: i,
                        value: (strBRHNum) ? '<B>'+strBRHNum+'</B>' : ' '
                    });
                }






            }
        }

        const runTransactionSearches = (objFilter, strSearchParam) => {
            strTitle = "runTransactionSearches " + strSearchParam;
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            log.debug(strTitle, ' Filters: ' + objFilter)
            let objTrnsctnSearch = search.load(strSearchParam);
            if(objFilter){
                objFilter = JSON.parse(objFilter)

                if(objFilter.intTranid){
                    objTrnsctnSearch.filters.push(
                        search.createFilter({
                            name: "internalid",
                            operator: search.Operator.ANYOF,
                            values: objFilter.intTranid,
                        })
                    );
                }else if(objFilter.intBRHNumber){
                    objTrnsctnSearch.filters.push(
                        search.createFilter({
                            name: "poastext",
                            operator: search.Operator.IS,
                            values: objFilter.intBRHNumber,
                        })
                    );
                }

                if(objFilter.dtFrom){
                    objTrnsctnSearch.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: objFilter.dtFrom,
                        })
                    );
                }

                if(objFilter.dtTo){
                    objTrnsctnSearch.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: objFilter.dtTo,
                        })
                    );
                }
            }


            let intResultCount = objTrnsctnSearch.runPaged().count;
            log.debug(strTitle + ' intResultCount', intResultCount)
            if (intResultCount > 0) {
                let objResult = objTrnsctnSearch.run().getRange({
                    start: 0,
                    end: 999,
                });
                return objResult;
            } else {
                return false;
            }
        }

        const addSublistFields = (objForm) => {
            let objSublist = objForm.addSublist({
                id: 'custpage_results_sublist',
                type: serverWidget.SublistType.LIST,
                // type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Details'
            });

            objSublist.addField({
                id: 'custpage_date_created',
                type: serverWidget.FieldType.TEXT,
                label: 'Date Created',
            });

            objSublist.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.TEXT,
                label: 'Date',
            });

            objSublist.addField({
                id: 'custpage_doc_num',
                type: serverWidget.FieldType.TEXT,
                label: 'Document Number',
            });



            objSublist.addField({
                id: 'custpage_otherrefnum',
                type: serverWidget.FieldType.TEXT,
                label: 'Other refnum',
            });

            //ADD Created From and Replacement Of Column
            objSublist.addField({
                id: 'custpage_created_from',
                type: serverWidget.FieldType.TEXT,
                label: 'Created From',
            });

            objSublist.addField({
                id: 'custpage_replacement_of',
                type: serverWidget.FieldType.TEXT,
                label: 'Replacement of',
            });

            //END Created From and Replacement Of Column

            objSublist.addField({
                id: 'custpage_item_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Item Number',
            });


            objSublist.addField({
                id: 'custpage_item_name',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Item Name',
            });



//SCRIPT CHANGE QTY DATA TYPE
            objSublist.addField({
                id: 'custpage_quantity',
                type: serverWidget.FieldType.TEXT,
                label: 'Qty',
            });
//END OF SCRIPT CHANGE QTY DATA TYPE


            objSublist.addField({
                id: 'custpage_cshub_avl_qty_srvc',
                type: serverWidget.FieldType.FLOAT,
                label: 'Available for Servicing',
            });

            objSublist.addField({
                id: 'custpage_price',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Price',
            });

            let objTranline = objSublist.addField({
                id: 'custpage_tranid',
                type: serverWidget.FieldType.INTEGER,
                label: 'Tran ID',
            });
            objTranline.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

            // let objLaunchRequest = objSublist.addField({
            //     id: 'custpage_launch_request',
            //     type: serverWidget.FieldType.URL,
            //     label: 'Launch Request',
            // });
            //
            //
            // objLaunchRequest.defaultValue = runtime.getCurrentScript().getParameter('custscript_ns_accnt_url') + runtime.getCurrentScript().getParameter('custscript_ns_cshub_action');
            //
            // objLaunchRequest.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

            return objSublist;
        }

        const post = (request) => {
            strTitle = 'post'
            log.debug('Current Process', '--------- ' + strTitle + ' ---------')
            let intTranID = request.parameters.custpage_tran_id;
            let intCustID = request.parameters.custpage_customer_id;
            let bMRProcessDone = request.parameters.custpage_mr_process_done;
        }

        return {
            onRequest: onRequest
        };

    });