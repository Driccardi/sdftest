/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *
 * File  Name  : NSTS_UE_SetDefaults.js
 * Script Name : NS|UE|SetDefaults
 * Script Type : User-Event Script
 * Script ID   : customscript_ns_ue_setdefaults
 *
 * Sets the default values for Gen OTU rec's online forms
 *
 * Version    Date         Author               Note
 * 1.00       Apr 02 2025  Kaiser Torrevillas   Initial commit.
 *
 * **/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
                log.audit({title:'scriptcontext', details: scriptContext});

                scriptContext.newRecord.setValue({
                        fieldId:'custrecord_ns_otu_handler_link',
                        value:'TEST'
                });

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
                scriptContext.newRecord.setValue({
                        fieldId:'custrecord_ns_otu_handler_link',
                        value:'TEST'
                });
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
