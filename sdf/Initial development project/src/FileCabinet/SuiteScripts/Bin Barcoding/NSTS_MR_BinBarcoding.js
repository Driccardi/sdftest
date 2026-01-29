/*
 * Copyright (c) 1998-2023 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @changeLog: 1.0            19 June 2023        Manuel Teodoro            Initial version.
 */

define( //using require instead for better module loading especially for the have dependencies.
    (require) => {
        //Custom modules
        let NSUtil = require('../Library/NSUtilvSS2.js');
        let scriptutil = require('./NSTS_MD_CommonLibrary');
        let ZPLTpl = require('./NSTS_TPL_ZPL');

        //Native Modules
        let record = require('N/record');
        let runtime = require('N/runtime');
        let search = require('N/search');
        let render = require('N/render');
        let file = require('N/file');
        let compress = require('N/compress');

        //Script parameter definition
        let PARAM_DEF = {
            executionid: {
                id: 'mr_bin_execuction_id',
                optional: false
            },
            binid: {
                id: 'mr_bin_id',
                optional: false
            },
            srchbin: {
                id: 'mr_bin_savedsearch',
                optional: false
            },
            fldrzpl: {
                id: 'mr_bin_flder_zpl',
                optional: false
            },
            fldrpdf: {
                id: 'mr_bin_fldr_pdf',
                optional: false
            },
        };

        let EXECUTION_STATUS = {
            'PENDING' : 1,
            'INPROGRESS' : 2,
            'COMPLETED' : 3,
            'ERROR' : 4
        }

        let EntryPoint = {};
        let Helper = {};

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
        EntryPoint.getInputData = () =>
        {
            let stLogTitle = 'getInputData';
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

            let arrData = [];
            let paramsScript = scriptutil.getParameters(PARAM_DEF, true);
            let objExecutionSearch = search.create({
                type: "customrecord_ns_bin_label_execution",
                filters:
                    [
                        ["internalid","anyof",paramsScript.executionid]
                    ],
                columns:
                    [
                        search.createColumn({name: "custrecord_bler_date", label: "Date"}),
                        search.createColumn({name: "custrecord_bler_employee", label: "Employee"}),
                        search.createColumn({name: "custrecord_bler_status", label: "Status"}),
                        search.createColumn({name: "custrecord_bler_labels_to_create", label: "# of Labels to Create"}),
                        search.createColumn({name: "custrecord_bler_location", label: "Location"}),
                        search.createColumn({name: "custrecord_bler_zone", label: "Zone"}),
                        search.createColumn({name: "custrecord_bler_sort_by_type", label: "Sort By Type"}),
                        search.createColumn({name: "custrecord_bler_first_bin", label: "First Bin"}),
                        search.createColumn({name: "custrecord_bler_last_bin", label: "Last Bin"}),
                        search.createColumn({name: "custrecord_bler_label_type", label: "Label Type"}),
                        search.createColumn({name: "custrecord_bler_label_template", label: "Label Template"})
                    ]
            });
            objExecutionSearch.run().each(function(result){
                arrData.push({
                    date: result.getValue({ name: 'custrecord_bler_date'}),
                    employee: result.getValue({ name: 'custrecord_bler_employee'}),
                    status: result.getValue({ name: 'custrecord_bler_status'}),
                    printqty: result.getValue({ name: 'custrecord_bler_labels_to_create'}),
                    location: result.getValue({ name: 'custrecord_bler_location'}),
                    sort: result.getValue({ name: 'custrecord_bler_sort_by_type'}),
                    firstbin: result.getValue({ name: 'custrecord_bler_first_bin'}),
                    lastbin: result.getValue({ name: 'custrecord_bler_last_bin'}),
                    type: result.getValue({ name: 'custrecord_bler_label_type'}),
                    template: result.getValue({ name: 'custrecord_bler_label_template'}),
                })
                return true;
            });

            record.submitFields({
                type: 'customrecord_ns_bin_label_execution',
                id: paramsScript.executionid,
                values : {
                    'custrecord_bler_status' : EXECUTION_STATUS.INPROGRESS
                }
            });

            return arrData;
            log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
        };

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */
        EntryPoint.map = (mapContext) =>
        {
            let stLogTitle = 'map (' + mapContext.key + ')';
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

            let objValue = JSON.parse(mapContext.value);
            log.debug(stLogTitle, "objValue : " + JSON.stringify(objValue));

            try
            {
                let intFileId;
                let paramsScript = scriptutil.getParameters(PARAM_DEF, true);
                let arrBinId = JSON.parse(paramsScript.binid);

                let arrSearchFilter = [];
                arrSearchFilter.push(search.createFilter({ //create new filter
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: arrBinId
                }));
                let arrBinSearchResult = NSUtil.search('', paramsScript.srchbin, arrSearchFilter, null);
                log.debug(stLogTitle, 'Sample:'+JSON.stringify(arrBinSearchResult[0]));

                intFileId = Helper.generateTemplateFile({
                    values: objValue,
                    bins : arrBinSearchResult,
                    params: paramsScript,
                    // template: objTemplate.pdf
                });





                // let objTemplate = Helper.getTemplateFile(objValue);
                //
                // if (objValue.type == 1) //PDF Template
                // {
                //     if (!NSUtil.isEmpty(objTemplate.pdf))
                //     {
                //         intFileId = Helper.generatePDFTemplate({
                //             values: objValue,
                //             bins : arrBinSearchResult,
                //             params: paramsScript,
                //             template: objTemplate.pdf
                //         });
                //     }
                //     else
                //     {
                //         log.error(stLogTitle, 'No PDF Template available');
                //     }
                // }
                // else if (objValue.type == 2) //ZPL Template
                // {
                //     if (!NSUtil.isEmpty(objTemplate.zpl))
                //     {
                //         intFileId = Helper.generateZPLTemplate({
                //             values: objValue,
                //             bins: arrBinSearchResult,
                //             params: paramsScript,
                //             template: objTemplate.zpl
                //         });
                //     } else {
                //         log.error(stLogTitle, 'No ZPL Template available');
                //     }
                // }

                if (intFileId)
                {
                    log.audit(stLogTitle, 'Generated Label - File ID:'+intFileId);

                    record.submitFields({
                        type: 'customrecord_ns_bin_label_execution',
                        id: paramsScript.executionid,
                        values : {
                            'custrecord_bler_file' : intFileId
                        }
                    });

                    for (let i=0; i < arrBinSearchResult.length; i++)
                    {
                        let intTemplate = arrBinSearchResult[i].getValue({ name: 'custrecord_ns_bin_label_template'});
                        let blIsOverwrite = arrBinSearchResult[i].getValue({ name: 'custrecord_ns_bin_allow_overwrite'});
                        log.debug(stLogTitle, 'intTemplate:'+intTemplate+' | blIsOverwrite:'+blIsOverwrite)

                        if (blIsOverwrite == true)
                        {
                            mapContext.write({
                                key: {
                                    id: arrBinId[i],
                                    template: intTemplate,
                                    executionid : paramsScript.executionid
                                },
                                value: objValue
                            });
                        }
                    }
                }
            }
            catch (catchError)
            {
                var stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);

                record.submitFields({
                    type: 'customrecord_ns_bin_label_execution',
                    id: paramsScript.executionid,
                    values : {
                        'custrecord_bler_status' : EXECUTION_STATUS.ERROR,
                        'custrecord_bler_error' : stErrorMsg
                    }
                });
            }
            log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
        };

        Helper.generateTemplateFile = function(objParams)
        {
            let stLogTitle = 'Helper.generateTemplateFile';
            // log.debug(stLogTitle, 'objParams:'+JSON.stringify(objParams));
            log.debug(stLogTitle);

            let objTemplate = Helper.getTemplateFile(objParams.values);
            let intTemplateId = (objParams.values.type == 1) ? objTemplate.pdf : objTemplate.zpl;
            let arrBinData = [];
            let intFolderId;
            let strZipFileName;

            for (let i=0; i < objParams.bins.length; i++)
            {
                let strLocation = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_location_code'});
                let strZone = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_zone_code'});
                let strAisle = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_asile_row'});
                let strRack = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_rack_bay'});
                let strLevel = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_level_shelf'});
                let strPosition = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_position'});
                let strQRCode = strLocation+'-'+strZone+'-'+strAisle+'-'+strRack+'-'+strLevel+'-'+strPosition;

                arrBinData.push({
                    'location': strLocation,
                    'zone': strZone,
                    'aisle': strAisle,
                    'rack': strRack,
                    'level': strLevel,
                    'position': strPosition,
                    'qrcode': strQRCode
                });
            }

            var objLabelData = {
                'copies': objParams.values.printqty,
                'bins' : arrBinData
            }

            let archiver = compress.createArchiver();
            let objTemplateFile = file.load({id: intTemplateId});

            var objPDFRenderer = render.create();
            objPDFRenderer.templateContent = objTemplateFile.getContents();

            objPDFRenderer.addCustomDataSource({
                format : render.DataSource.OBJECT,
                alias  : 'objLabel',
                data   : objLabelData
            });

            if (objParams.values.type == 1) //PDF Template
            {
                intFolderId = objParams.params.fldrpdf;
                strZipFileName = objParams.params.executionid+'_BinLabel_PDF_PDFFiles.zip';

                if (!NSUtil.isEmpty(objTemplate.pdf))
                {
                    var objBinLabelFile = objPDFRenderer.renderAsPdf();
                    objBinLabelFile.name = objParams.params.executionid+'_BinLabel_PDF.pdf';
                }
                else
                {
                    log.error(stLogTitle, 'No PDF Template available');
                }
            }
            else if (objParams.values.type == 2) //ZPL Template
            {
                intFolderId = objParams.params.fldrzpl;
                strZipFileName = objParams.params.executionid+'_BinLabel_ZPL_ZIPFiles.zip';

                if (!NSUtil.isEmpty(objTemplate.zpl))
                {

                    let objBinLabelZPL = objPDFRenderer.renderAsString();
                    var objBinLabelFile = file.create({
                        name: objParams.params.executionid+'_BinLabel_ZPL.zpl',
                        fileType: file.Type.PLAINTEXT,
                        contents: objBinLabelZPL,
                        encoding: file.Encoding.UTF8,
                        isOnline: true
                    });

                } else {
                    log.error(stLogTitle, 'No ZPL Template available');
                }
            }

            archiver.add({
                file: objBinLabelFile
            });

            let fileToDownload = archiver.archive({
                name: strZipFileName,
                type: compress.Type.ZIP,
            });
            fileToDownload.folder = intFolderId;
            let intFileId = fileToDownload.save();
            log.debug(stLogTitle, 'intFileId:'+intFileId)

            return intFileId;
        }

        // Helper.generatePDFTemplate = function(objParams)
        // {
        //     let stLogTitle = 'Helper.generatePDFTemplate';
        //     log.debug(stLogTitle);
        //
        //     let arrBinData = [];
        //     for (let i=0; i < objParams.bins.length; i++)
        //     {
        //         let strLocation = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_location_code'});
        //         let strZone = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_zone_code'});
        //         let strAisle = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_asile_row'});
        //         let strRack = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_rack_bay'});
        //         let strLevel = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_level_shelf'});
        //         let strPosition = objParams.bins[i].getValue({ name: 'custrecord_ns_bin_position'});
        //         let strQRCode = strLocation+'-'+strZone+'-'+strAisle+'-'+strRack+'-'+strLevel+'-'+strPosition;
        //
        //         arrBinData.push({
        //             'location': strLocation,
        //             'zone': strZone,
        //             'aisle': strAisle,
        //             'rack': strRack,
        //             'level': strLevel,
        //             'position': strPosition,
        //             'qrcode': strQRCode
        //         });
        //     }
        //
        //     var objLabelData = {
        //         'copies': objParams.values.printqty,
        //         'bins' : arrBinData
        //     }
        //
        //     let archiver = compress.createArchiver();
        //     var objTemplateFile = file.load({id: objParams.template});
        //
        //     var objPDFRenderer = render.create();
        //     objPDFRenderer.templateContent = objTemplateFile.getContents();
        //
        //     objPDFRenderer.addCustomDataSource({
        //         format : render.DataSource.OBJECT,
        //         alias  : 'objLabel',
        //         data   : objLabelData
        //     });
        //
        //
        //     let objBinLabelPDF = objPDFRenderer.renderAsPdf();
        //     objBinLabelPDF.name = objParams.params.executionid+'_BinLabel_PDF.pdf';
        //
        //
        //
        //
        //     archiver.add({
        //         file: objBinLabelPDF
        //     });
        //
        //     let fileToDownload = archiver.archive({
        //         name: objParams.params.executionid+'_BinLabel_PDF_PDFFiles.zip',
        //         type: compress.Type.ZIP,
        //     });
        //     fileToDownload.folder = objParams.params.fldrpdf;
        //     let intFileId = fileToDownload.save();
        //
        //     return intFileId;
        // }

        Helper.getTemplateFile = function(objValue)
        {
            let stLogTitle = 'Helper.getTemplateFile';
            log.debug(stLogTitle);

            //Get Template Files
            let objZPLTemplate  = search.lookupFields({
                type: 'customrecord_ns_bin_label_template',
                id: objValue.template,
                columns: ['custrecord_bintpl_template','custrecord_bintpl_file_id']
            });
            let objTemplate = {};
            objTemplate.zpl = objZPLTemplate['custrecord_bintpl_template'];
            objTemplate.pdf = objZPLTemplate['custrecord_bintpl_file_id'];

            return objTemplate;
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        EntryPoint.reduce = (context) =>
        {
            let objKey = JSON.parse(context.key);
            let objValue = JSON.parse(context.values[0]);
            let stLogTitle = 'reduce (' + objKey.id + ')';
            // log.debug(stLogTitle, 'objKey : ' + JSON.stringify(objKey)+' | objValue : ' + JSON.stringify(objValue));

            try
            {
                let objRecord = record.load({
                    type: 'bin',
                    id: objKey.id,
                    isDynamic: true
                });
                objRecord.setValue({
                    fieldId: 'custrecord_ns_bin_label_template',
                    value: objValue.template
                })
                let intBinId = objRecord.save();
                log.debug(stLogTitle, 'Updated Record:'+objRecord.type+':'+intBinId);
            }
            catch (catchError)
            {
                var stErrorMsg = (catchError.message !== undefined) ? catchError.name + ' : ' + catchError.message : catchError.toString();
                log.error(stLogTitle, 'Catch : ' + stErrorMsg);

                record.submitFields({
                    type: 'customrecord_ns_bin_label_execution',
                    id: objKey.executionid,
                    values : {
                        'custrecord_bler_status' : EXECUTION_STATUS.ERROR,
                        'custrecord_bler_error' : stErrorMsg
                    }
                });
            }
            log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
        }

        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        EntryPoint.summarize = (summaryContext) =>
        {
            let stLogTitle = 'summarize';
            log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

            let paramsScript = scriptutil.getParameters(PARAM_DEF, true);
            log.debug(stLogTitle, 'paramsScript:'+JSON.stringify(paramsScript));

            try {
                let type = summaryContext.toString();
                log.audit(stLogTitle, 'Type = ' + type +
                    ' | Usage Consumed = ' + summaryContext.usage +
                    ' | Concurrency Number = ' + summaryContext.concurrency +
                    ' | Number of Yields = ' + summaryContext.yields);

                record.submitFields({
                    type: 'customrecord_ns_bin_label_execution',
                    id: paramsScript.executionid,
                    values : {
                        'custrecord_bler_status' : EXECUTION_STATUS.COMPLETED,
                        'custrecord_bler_error' : ''
                    }
                });
            }
            catch (e)
            {
                log.error(stLogTitle, JSON.stringify(e));
                throw e.message;
            }
            log.debug(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
        };

        EntryPoint.config = {retryCount: 0, exitOnError: false};
        
        return EntryPoint;
    });