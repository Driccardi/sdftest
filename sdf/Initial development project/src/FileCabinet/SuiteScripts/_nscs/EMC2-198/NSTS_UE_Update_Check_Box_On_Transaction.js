/**
 * Copyright (c) 1998-2022 NetSuite, Inc. 2955 Campus Drive, Suite 100, San
 * Mateo, CA, USA 94403-2511 All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite,
 * Inc. ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with NetSuite.
 *
 *
 * Version        Date                 Author                   Remarks
 * 1.00           03 October 2024    Sravan Teja 	          Initial version
 */

/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['/SuiteScripts/_nscs/Library/NSUtilvSS2.js'],
    function (NSUtil) {
        function beforeSubmit(context) {
            if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
                let objNewRec = context.newRecord;
                let idProject = objNewRec.getValue('job');
                let strNewProject = objNewRec.getValue('custbody_new_project');

                if((NSUtil.isEmpty(idProject) && !NSUtil.isEmpty(strNewProject)) ||
                    (!NSUtil.isEmpty(idProject) && NSUtil.isEmpty(strNewProject))) {
                    objNewRec.setValue('custbody_ns_create_update_proj_task',true);
                }
            }

        }

        return {
            beforeSubmit: beforeSubmit
        };
    });
