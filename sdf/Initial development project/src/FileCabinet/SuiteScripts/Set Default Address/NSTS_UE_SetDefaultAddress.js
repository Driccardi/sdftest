/**
 * Copyright (c) 1998-2025 Oracle-NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * @changeLog:   1.0       21 Mar 2025       Manuel Teodoro       Initial version
 *
 */
define(function(require)
{
        let record = require("N/record");
        let runtime = require("N/runtime");
        let NSUtil  = require ('../Library/NSUtilvSS2');

        let UE = {};
        let Helper = {};

        UE.beforeSubmit = function (context)
        {
                let stLogTitle = "UE.beforeSubmit";
                log.debug(stLogTitle);

                try
                {
                        if (context.type !== context.UserEventType.EDIT) return;
                        //if (runtime.executionContext !== runtime.ContextType.WEBSTORE) return;

                        let recCustomer = context.newRecord;
                        let recOldCustomer = context.oldRecord;
                        let intPrevBillingAddress = Helper.getDefaultAddress(recOldCustomer, 'defaultbilling');
                        let intPreShippingAddress = Helper.getDefaultAddress(recOldCustomer, 'defaultshipping');
                        log.debug(stLogTitle, 'intPrevBillingAddress:' + intPrevBillingAddress + ' | intPreShippingAddress:' + intPreShippingAddress);

                        recCustomer.setValue({
                                fieldId: 'custentity_prev_default_billing_id',
                                value: intPrevBillingAddress
                        });
                        recCustomer.setValue({
                                fieldId: 'custentity_prev_default_shipping_id',
                                value: intPreShippingAddress
                        });
                }
                catch (ex)
                {
                        log.error('UE.beforeSubmit | Error ', ex.name + ' : ' + ex.message);
                }
        };

        UE.afterSubmit = function(context)
        {
                let stLogTitle = "UE.afterSubmit";
                log.debug(stLogTitle);

                if (context.type !== context.UserEventType.EDIT) return;
                // if (runtime.executionContext !== runtime.ContextType.WEBSTORE) return;

                try
                {
                        let blIsMaintainBillingAddress = runtime.getCurrentScript().getParameter('custscript_maintain_def_billing');
                        let blIsMaintainShippingAddress = runtime.getCurrentScript().getParameter('custscript_maintain_def_shipping');

                        if (blIsMaintainBillingAddress || blIsMaintainBillingAddress)
                        {
                                let recCustomer = record.load({ type: record.Type.CUSTOMER, id: context.newRecord.id, isDynamic: false });
                                let intPrevBillingAddress = recCustomer.getValue('custentity_prev_default_billing_id');
                                let intPrevShippingAddress = recCustomer.getValue('custentity_prev_default_shipping_id');
                                let intBillingAddressId = Helper.getDefaultAddress(recCustomer, 'defaultbilling');
                                let intShippingAddressId = Helper.getDefaultAddress(recCustomer, 'defaultshipping');

                                if (blIsMaintainBillingAddress && intPrevBillingAddress !== intBillingAddressId)
                                {
                                        Helper.setDefaultAddress(recCustomer, 'defaultbilling', intPrevBillingAddress);
                                }

                                if (blIsMaintainShippingAddress && intPrevShippingAddress !== intShippingAddressId)
                                {
                                        Helper.setDefaultAddress(recCustomer, 'defaultshipping', intPrevShippingAddress);
                                }
                                recCustomer.save();
                        }
                }
                catch (ex)
                {
                        log.error('UE.afterSubmit | Error ', ex.name + ' : ' + ex.message);
                }
        };

        Helper.getDefaultAddress = function(record, field)
        {
                let stLogTitle = "Helper.getDefaultAddress";
                log.debug(stLogTitle);

                let count = record.getLineCount('addressbook');
                for (let i = 0; i < count; i++)
                {
                        if (record.getSublistValue({ sublistId: 'addressbook', fieldId: field, line: i }))
                        {
                                return record.getSublistValue({ sublistId: 'addressbook', fieldId: 'id', line: i });
                        }
                }
                return null;
        }

        Helper.setDefaultAddress = function (record, field, value)
        {
                let stLogTitle = "Helper.setDefaultAddress";
                log.debug(stLogTitle);

                let count = record.getLineCount('addressbook');

                for (let i = 0; i < count; i++)
                {
                        let intAddressId = record.getSublistValue({sublistId: 'addressbook', fieldId: 'id', line: i});
                        let blIsDefault = parseInt(intAddressId) === parseInt(value);
                        log.debug(stLogTitle, 'intAddressId:' + intAddressId + ' | value:' + value + ' blIsDefault: ' + blIsDefault);
                        record.setSublistValue({sublistId: 'addressbook', fieldId: field, line: i, value: blIsDefault});
                }
        }

        return UE;
});
