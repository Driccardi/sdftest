/**
 * Copyright (c) 1998-2023 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 *
 *  Version          Date          Author               Remarks
 *  1.00            17 Apr 2025    riccardi             Populates external form URL after save
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Filename ns_su_fspk_linkbuilder.js
 */

define(['N/url', 'N/record', 'N/runtime'],
    function(url, record, runtime) {
    
      /**
       * After Submit Hook
       * Populates the `custrecord_ns_fspk_urllink` field on the setup record
       * with the externally accessible Suitelet URL and internal ID parameter.
       */
      function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;
    
        try {
          var rec = context.newRecord;
          var recId = rec.id;
    
          var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_ns_su_fspk_render', // replace with your actual script ID
            deploymentId: 'customdeploy_ns_su_fspk_render', // replace with your actual deployment ID
            returnExternalUrl: true,
            params: {
              setup: recId
            }
          });
    
          record.submitFields({
            type: 'customrecord_ns_fspk_setup',
            id: recId,
            values: {
              custrecord_ns_fspk_link: suiteletUrl
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true
            }
          });
    
        } catch (e) {
          log.error('Failed to generate and store Suitelet URL', e.message);
        }
      }
    
      return {
        afterSubmit: afterSubmit
      };
    
    });
    