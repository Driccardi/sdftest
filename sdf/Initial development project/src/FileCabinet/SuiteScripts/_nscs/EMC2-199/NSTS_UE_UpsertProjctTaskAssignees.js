/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Author Heeju Park
 */


// Assumption
// 1. per resrouce per task - No validation
// 2. must allocate based on hours, client side script to validate Allocation Unit. Only Hours. And Serverside validation


define(['N/record', 'N/search', '/SuiteScripts/_nscs/Library/NSUtilvSS2.js', 'N/error'],
    /**
     * @param {record} record
     * @param NSUtil
     * @param error
     */

    function (record, search, NSUtil, error) {

        const OBJ_ERROR_MSGS = {
            missingValues: "USER_ERROR: Missing Value(s).|The record cannot be saved because required values are missing. Please ensure that both 'Units' and 'Unit Cost' are entered.",
            invalidAllocationUnit: "USER_ERROR: Invalid Allocation Unit|The record cannot be saved because the selected 'Allocation Unit' is incorrect. It must be set to 'Hours' in order to copy to Project Task Assignment."
        }

        function getSumOfAllocatedHours(idProject, idProjectTask, idResource){

            let arrSearchFilter = [
                ["allocationunit",search.Operator.ANYOF,"H"],
                "AND",
                ["project",search.Operator.ANYOF,idProject],
                "AND",
                ["projecttask",search.Operator.ANYOF,idProjectTask],
                "AND",
                ["resource",search.Operator.ANYOF,idResource]
            ]
            let arrSearchColumn = [
                search.createColumn({
                    name: "numberhours",
                    summary: "SUM"
                })
            ]

            let objResourceAllocationData = NSUtil.search(record.Type.RESOURCE_ALLOCATION, null, arrSearchFilter, arrSearchColumn);

            if(!NSUtil.isEmpty(objResourceAllocationData[0])) {
                return Number(objResourceAllocationData[0].getValue({
                    name: "numberhours",
                    summary: "SUM"
                }));

            } else {
                return false;
            }
        }
        function setAssigneeLineValues(objProjectTaskRec, sublistId, objFieldValues, fltSumOfAllocatedHours){
            let idResource = objFieldValues.allocationresource;
            let percentUnits = objFieldValues.custevent_ps_ra_units;
            let idBillingClass = objFieldValues.custevent_psware_ra_billingclass;
            let idServiceItem = objFieldValues.custevent_ps_ra_service_item;
            let fltHours = objFieldValues.allocationamount
            let fltUnitCost = objFieldValues.custevent_ps_ra_unit_cost
            let flotUnitPrice = objFieldValues.custevent_ps_ra_price

            let idAllocationUnit = objFieldValues.allocationunit;

            if(NSUtil.isEmpty(percentUnits) || NSUtil.isEmpty(fltUnitCost)){
                errorHandler(OBJ_ERROR_MSGS.missingValues)
            }
            // if Allocation Unit is not 'Hour', throw an error.
            if(idAllocationUnit !== 'H'){
                errorHandler(OBJ_ERROR_MSGS.invalidAllocationUnit)
            }

            log.debug(`percentUnits: ${percentUnits}, idBillingClass: ${idBillingClass}`)
            log.debug(`idServiceItem: ${idServiceItem}, fltHours: ${fltHours}, fltSumOfAllocatedHours: ${fltSumOfAllocatedHours}`)
            log.debug(`fltUnitCost: ${fltUnitCost}, flotUnitPrice: ${flotUnitPrice}`)

            objProjectTaskRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'resource',
                value: idResource,
                ignoreFieldChange: false
            });
            objProjectTaskRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'units',
                value: percentUnits
            });

            if(!NSUtil.isEmpty(idBillingClass)){
                objProjectTaskRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'billingclass',
                    value: idBillingClass,
                    ignoreFieldChange: false
                });
            }
            if(!NSUtil.isEmpty(idServiceItem)){
                objProjectTaskRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'serviceitem',
                    value: idServiceItem
                });
            }

            if(fltSumOfAllocatedHours){
                objProjectTaskRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'plannedwork',
                    value: fltSumOfAllocatedHours
                });
            } else {
                objProjectTaskRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'plannedwork',
                    value: fltHours
                });
            }

            objProjectTaskRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'unitcost',
                value: fltUnitCost
            });
            objProjectTaskRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'unitprice',
                value: flotUnitPrice
            });
            //if the Billing Type is not Charge Based, map Unit Price('Price') to the Project Tasks, Project > Financial > Billing Type
        }

        function upsertAssignees(idProjectTask, objFieldValues){

            let idResource = objFieldValues.allocationresource;

            let doesAssigneeExist = false;

            let objProjectTaskRec = record.load({
                type: record.Type.PROJECT_TASK,
                id: idProjectTask,
                isDynamic: true,
            });

            let sublistId = 'assignee'
            let intAssigneeLines = objProjectTaskRec.getLineCount({ sublistId: sublistId });

            for (let i = 0; i < intAssigneeLines; i++) {
                let idAssignedResource = objProjectTaskRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'resource',
                    line: i
                });
                log.debug(`idResource: ${idResource}, idAssignedResource: ${idAssignedResource}`)

                // Updating the existing Assignee line
                if(idResource === idAssignedResource){
                    doesAssigneeExist = true;

                    let fltSumOfAllocatedHours = getSumOfAllocatedHours(objFieldValues.project, idProjectTask, idResource)
                    objProjectTaskRec.selectLine({
                        sublistId: sublistId,
                        line: i
                    });
                    log.debug(`i: ${i}`)
                    setAssigneeLineValues(objProjectTaskRec, sublistId, objFieldValues, fltSumOfAllocatedHours);

                    objProjectTaskRec.commitLine({
                        sublistId: sublistId
                    });
                }
            }

            // Adding a new Assignee line
            if(!doesAssigneeExist){

                log.debug(`in second if doesAssigneeExist: ${doesAssigneeExist}`)
                objProjectTaskRec.selectNewLine({
                    sublistId: sublistId
                });
                setAssigneeLineValues(objProjectTaskRec, sublistId, objFieldValues, false);
                objProjectTaskRec.commitLine({
                    sublistId: sublistId
                });
            }

            objProjectTaskRec.save();
        }

        function errorHandler(objErrorMsgs){

            let objError = error.create({
                name: objErrorMsgs.split("|")[0],
                message: objErrorMsgs.split("|")[1]
            });

            throw `${objError.name} ${objError.message}`;
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */

        function afterSubmit(scriptContext) {
            const OBJ_NEW_REC = scriptContext.newRecord;
            if (scriptContext.type !== scriptContext.UserEventType.DELETE) {

                let idProjectTask = OBJ_NEW_REC.getValue({fieldId: 'projecttask'});
                let shouldCopyTask = OBJ_NEW_REC.getValue({fieldId: 'custevent_psware_ra_copytask'});

                if(!NSUtil.isEmpty(idProjectTask) && NSUtil.getCheckboxValue(shouldCopyTask)){

                    let objFieldIDs = OBJ_NEW_REC.getFields();
                    let objFieldValues = {};

                    objFieldIDs.forEach(function(fieldId) {
                        objFieldValues[fieldId] = OBJ_NEW_REC.getValue({ fieldId: fieldId });
                    });


                    upsertAssignees(idProjectTask, objFieldValues);

                }

            }


        }

        return {
            afterSubmit: afterSubmit
        };

    });
