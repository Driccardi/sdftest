/**
 * Copyright (c) 1998-2025 NetSuite, Inc. 2955 Campus Drive, Suite 100, San
 * Mateo, CA, USA 94403-2511 All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite,
 * Inc. ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with NetSuite.
 *
 * Validate billing schedule mandatory fields
 *
 * Version        Date                Author                Remarks
 * 1.00           07 May 2025         manuel.teodoro        Initial version
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define( //using require instead for better module loading especially for the have dependencies.

    function (require) {
        //Custom modules
        var nsutil = require('../Library/NSUtilvSS2.js');

        //Native modules
        var currentRecord = require('N/currentRecord');
        var dialog = require('N/ui/dialog');
        var runtime = require('N/runtime');
        var search = require('N/search');

        //Script parameter definition
        //Usage: PARAM_DEF = {parameter1:{id:'custcript_etc', optional:true}}
        var PARAM_DEF = {
            // lbl_title: {
            //     id: 'lbl_suitelettitle',
            //     optional: false
            // }
        };

        var CS = {};
        var Helper = {};
        var arrError = [];
        var ST_MODE;
        var CURRENT_RECORD;

        CS.pageInit = function (scriptContext)
        {
            try {
                CURRENT_RECORD = currentRecord.get();
                ST_MODE = scriptContext.mode;
                console.log(ST_MODE);
            } catch (objError) {
                console.log(objError);
            }
        }

        CS.validateLine = function (scriptContext)
        {
            var strLogTitle = 'CS.validateLine';

            try {
                var stSublist = 'recmachcustrecord_epu_eol_header';
                var intHeaderSubsidiary = CURRENT_RECORD.getValue('custrecord_epu_eoh_subsidiary');

                var objLineData = {}
                objLineData.subsidiary = CURRENT_RECORD.getCurrentSublistValue({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_subsidiary'
                });
                objLineData.subsidiaryname = CURRENT_RECORD.getCurrentSublistText({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_subsidiary'
                });
                objLineData.ownershippct = CURRENT_RECORD.getCurrentSublistValue({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_ownership_pct'
                });
                objLineData.investmentacct = CURRENT_RECORD.getCurrentSublistValue({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_invstmnt_subsidiary'
                });
                objLineData.incomeacct = CURRENT_RECORD.getCurrentSublistValue({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_invstmnt_income'
                });
                log.debug(strLogTitle, 'objLineData:' + JSON.stringify(objLineData));

                if (intHeaderSubsidiary == objLineData.subsidiary)
                {
                    var stError = objLineData.subsidiaryname+" was already used as a Child Subsidiary.";
                    arrError.push(stError);
                    Helper.displayValidationError(arrError);
                    arrError = [];
                    return false;
                }
                Helper.checkDuplicateSubsidiary(objLineData); //Check Duplicate Subsidiary
                Helper.checkLineValues(objLineData); //Null Check

                if (!nsutil.isEmpty(arrError))
                {
                    Helper.displayValidationError(arrError);
                    arrError = [];
                    return false;
                }

                return true;
            }
            catch (objError)
            {
                console.log(objError);
            }
        }

        CS.saveRecord = function (scriptContext)
        {
            var strLogTitle = 'CS.validateLine';
            log.debug(strLogTitle);

            var bAllowSave = true;

            try
            {
                Helper.validateHeaderFields();

                if (!nsutil.isEmpty(arrError))
                {
                    Helper.displayValidationError(arrError);
                    arrError = [];
                    bAllowSave = false;
                }

                return bAllowSave;

            } catch (objError) {
                console.log(objError);

                if (objError.display) {
                    alert(objError.message);
                    bAllowSave = false;
                }
            } finally {
                return bAllowSave;
            }
        }

        Helper.checkDuplicateRecords = function()
        {
            var stLogTitle = 'Helper.checkDuplicateRecords';
            log.debug(stLogTitle);
            var stError = '';

            var intRecordId = CURRENT_RECORD.id;
            var objHeaderData = {};
            var arrSrchFilter = [];
            objHeaderData.hierarchy = CURRENT_RECORD.getValue('custrecord_epu_eoh_hierarchy');
            objHeaderData.subsidiary = CURRENT_RECORD.getValue('custrecord_epu_eoh_subsidiary');
            objHeaderData.subsidiaryname = CURRENT_RECORD.getText('custrecord_epu_eoh_subsidiary');
            log.debug(stLogTitle, 'intRecordId:'+intRecordId);

            if (!nsutil.isEmpty(intRecordId))
            {
                arrSrchFilter = [
                    ["custrecord_epu_eoh_subsidiary","anyof",objHeaderData.subsidiary],
                    // "AND",
                    // ["custrecord_epu_eoh_hierarchy","anyof",objHeaderData.hierarchy],
                    "AND",
                    ["internalid","noneof",intRecordId]
                ];
            }
            else
            {
                arrSrchFilter = [
                    ["custrecord_epu_eoh_subsidiary", "anyof", objHeaderData.subsidiary],
                    // "AND",
                    // ["custrecord_epu_eoh_hierarchy", "anyof", objHeaderData.hierarchy]
                ]
            }
            log.debug(stLogTitle, 'arrSrchFilter:'+JSON.stringify(arrSrchFilter));

            var srchEntityOwnership = search.create({
                type: "customrecord_ns_epu_entityownership_hdr",
                filters: arrSrchFilter,
                columns: []
            });
            var intRecordCount = srchEntityOwnership.runPaged().count;

            if (intRecordCount != 0)
            {
                stError = "Entity Ownership Record with Hierarchy Level "+objHeaderData.hierarchy+" and Subsidiary "+objHeaderData.subsidiaryname+" already exist.";
                arrError.push(stError);
            }
        }

        Helper.validateHeaderFields = function()
        {
            var stLogTitle = 'Helper.validateHeaderFields';
            log.debug(stLogTitle);
            var stError = '';

            var objHeaderData = {};
            objHeaderData.hierarchy = CURRENT_RECORD.getValue('custrecord_epu_eoh_hierarchy');
            objHeaderData.subsidiary = CURRENT_RECORD.getValue('custrecord_epu_eoh_subsidiary');
            objHeaderData.investmentparent = CURRENT_RECORD.getValue('custrecord_epu_eoh_invstmnt_fr_parent');
            objHeaderData.nci = CURRENT_RECORD.getValue('custrecord_epu_eoh_nci');

            if (nsutil.isEmpty(objHeaderData.hierarchy)) {
                stError = "Please provide Hierarchy Level value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objHeaderData.subsidiary)) {
                stError = "Please provide Child Subsidiary value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objHeaderData.investmentparent)) {
                stError = "Please provide Investment from Parent Account value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objHeaderData.nci)) {
                stError = "Please provide Non-Controlling Interest Account value.";
                arrError.push(stError);
            }

            if (nsutil.isEmpty(arrError))
            {
                Helper.checkDuplicateRecords();
                Helper.checkOwnershipSplit();
            }
        }

        Helper.checkDuplicateSubsidiary = function(objLineData,intCurrentLine)
        {
            var stLogTitle = 'Helper.checkDuplicateSubsidiary';
            log.debug(stLogTitle);
            var stError = '';

            var lineCount = CURRENT_RECORD.getLineCount({sublistId:'recmachcustrecord_epu_eol_header'});
            var intCurrentLine = CURRENT_RECORD.getCurrentSublistIndex({ sublistId: 'recmachcustrecord_epu_eol_header' });

            for (var i=0; i < lineCount; i++)
            {
                var intLineSubsidiary = CURRENT_RECORD.getSublistValue({
                    sublistId: 'recmachcustrecord_epu_eol_header',
                    fieldId: 'custrecord_epu_eol_subsidiary',
                    line: i
                });
                var strLineSubsidiary = CURRENT_RECORD.getSublistText({
                    sublistId: 'recmachcustrecord_epu_eol_header',
                    fieldId: 'custrecord_epu_eol_subsidiary',
                    line: i
                });

                if (objLineData.subsidiary === intLineSubsidiary && intCurrentLine != i)
                {
                    stError = strLineSubsidiary+" already exist in the Distribution sublist.";
                    arrError.push(stError);
                }

            }
            // return arrError;
        }

        Helper.checkLineValues = function(objLineData)
        {
            var stLogTitle = 'Helper.checkLineValues';
            log.debug(stLogTitle);
            var stError = '';

            if (nsutil.isEmpty(objLineData.subsidiary)) {
                stError = "Please provide Subsidiary value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objLineData.ownershippct)) {
                stError = "Please provide Ownership Percent value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objLineData.investmentacct)) {
                stError = "Please provide Investment in Subsidiary Account value.";
                arrError.push(stError);
            }
            if (nsutil.isEmpty(objLineData.incomeacct)) {
                stError = "Please provide Investment Income Account value.";
                arrError.push(stError);
            }
            log.debug(stLogTitle, 'arrError:'+JSON.stringify(arrError))

            // return arrError;
        }

        Helper.checkOwnershipSplit = function()
        {
            var stLogTitle = 'Helper.checkOwnershipSplit';
            log.debug(stLogTitle);
            var stError = '';

            var stSublist = 'recmachcustrecord_epu_eol_header';
            var ftOwnershipSplitTotal = 0;

            var intLineCount = CURRENT_RECORD.getLineCount({
                sublistId: stSublist
            });
            for (var j = 0; j < intLineCount; j++)
            {
                var ftSplitPercent = CURRENT_RECORD.getSublistValue({
                    sublistId: stSublist,
                    fieldId: 'custrecord_epu_eol_ownership_pct',
                    line: j
                });
                ftOwnershipSplitTotal = parseFloat(ftSplitPercent) + ftOwnershipSplitTotal;
                console.log(j, 'Ownership Split Perc = ' + ftSplitPercent);
            }
            console.log('Ownership Split Total: ' + ftOwnershipSplitTotal);

            if (ftOwnershipSplitTotal > 100)
            {
                stError = "Total Ownership Percentage should not exceed 100%. The current Total Percentage is "+ftOwnershipSplitTotal+"%";
                arrError.push(stError);
            }
        }

        Helper.displayValidationError = function(arrError)
        {
            var stLogTitle = 'Helper.displayValidationError';
            var stValidationError = 'The following updates are required: <br><br>';
            log.debug(stLogTitle, 'arrError: ' + JSON.stringify(arrError));

            for (var i=0; i<arrError.length; i++)
            {
                stValidationError += '- ' + arrError[i] + '<br>';
            }
            dialog.alert({title: 'Validation Error', message: stValidationError})
        }

        return CS;
    });