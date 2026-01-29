/**
 *  Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * This script will be used for CSHUB Case Action Step records. Sets the CSHUB Next Step on Case records.
 * Uses saved search CSHUB UE Next Step ***DO NOT EDIT. SCRIPT USE***
 *
 * Version          Date                      Author                                Remarks
 *
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime'],

	(record, search, runtime) => {

		const objScriptParameterIds = Object.freeze({
			search_nextStep: 'custscript_cshub_ue_nextstep_search'
		});

		const objCASStatuses = Object.freeze({
			pending: 1,
			inProgress: 2,
			success: 3,
			error: 4,
			completed: 5
		});

		const recType_CaseActionStep = 'customrecord_cshub_caseactionstep';

		const objCASFieldIds = Object.freeze({
			status: 'custrecord_cshub_actnstep_stts',
			currentStepId: 'custrecord_cshub_csactnstep_crntstp_id',
			parentCase: 'custrecord_cshcd_csactn_step_parent_case'
		});

		const objCaseCSHUBFieldIds = Object.freeze({
			status: 'custevent_cshub_casesubstatus',
			caseType: 'custevent_cshub_case_type',
			stepIdArray: 'custevent_cshub_casestep_array_ids',
			nextStep: 'custevent_cshub_nextstep',
			casUpdateCompleted: 'custevent_cshub_act_stps_ctrd'
		});

		/**
		 * @name isEmpty
		 * @param value
		 * @returns {boolean}
		 */
		const isEmpty = (value) => {
			if (value === null)
				return true;
			if (value === undefined)
				return true;
			if (value === 'undefined')
				return true;
			if (value === '')
				return true;
			if (value.constructor === Object && Object.keys(value).length === 0)
				return true;
			if (value.constructor === Array && value.length === 0)
				return true;
			return false;
		}

		/**
		 * @typedef {Object} objScriptParameterValues
		 * @property {string} search_nextStep
		 */
		/**
		 * @name getScriptParameterValues
		 * @returns {objScriptParameterValues}
		 */
		const getScriptParameterValues = () => {
			let objScriptParamValues = {}
			for (const key in objScriptParameterIds) {
				/*log.debug({
					title: stLogTitle,
					details: 'key: ' + key + '; objScriptParameterIds.key: ' + objScriptParameterIds[key]
				});
				log.debug({
					title: stLogTitle,
					details: 'key: ' + key + '; objScriptParameterValue: ' + getParameterValue(objScriptParameterIds[key])
				});*/
				objScriptParamValues[key] = getParameterValue(objScriptParameterIds[key]);
			}
			return objScriptParamValues;
		}

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
			const stLogTitle = 'afterSubmit';
			const eventType = scriptContext.type;
			const newRecord = scriptContext.newRecord;
			const oldRecord = scriptContext.oldRecord;
			/*log.debug({
					title: stLogTitle,
					details: 'scriptContext: ' + JSON.stringify(scriptContext)
			});*/
			try {
				if (eventType == scriptContext.UserEventType.CREATE || eventType == scriptContext.UserEventType.EDIT || eventType == scriptContext.UserEventType.XEDIT) {
					//upon CAS status Completed and Success, set next step based on current status
					//get Step ID Array, CSHUB Status, CSHUB Case Type, Current Step ID
					let arrColumns = [objCASFieldIds.currentStepId, objCASFieldIds.status, objCASFieldIds.parentCase];
					let objCASFieldValues = search.lookupFields({
						type: recType_CaseActionStep,
						id: parseInt(newRecord.id),
						columns: arrColumns
					});
					/*
					SAMPLE objCASFieldValues
					{
					   custrecord_cshub_csactnstep_crntstp_id: "50.0.7",
					   custrecord_cshub_actnstep_stts: [
						  {
							 value: "3",
							 text: "Processed - Success"
						  }
					   ],
					   custrecord_cshcd_csactn_step_parent_case: [
						  {
							 value: "866729",
							 text: "CASE353 994492121 Mengli He, 50 - Home Damage, INV919"
						  }
					   ]
					}
					 */
					log.debug({
						title: stLogTitle,
						details: 'objCASFieldValues: ' + JSON.stringify(objCASFieldValues)
					});
					log.debug({
						title: stLogTitle,
						details: 'objCASFieldValues[objCASFieldIds.status].value: ' + objCASFieldValues[objCASFieldIds.status][0].value
					});

					//if (objCASFieldValues[objCASFieldIds.status].value != objCASStatuses.completed && objCASFieldValues[objCASFieldIds.status].value != objCASStatuses.success) {
					let arrCheckStatus = [];
					arrCheckStatus.push(objCASStatuses.completed);
					arrCheckStatus.push(objCASStatuses.success);
					log.debug({
						title: stLogTitle,
						details: 'arrCheckStatus: ' + arrCheckStatus
					});
					log.debug({
						title: stLogTitle,
						details: 'arrCheckStatus.includes(objCASFieldValues[objCASFieldIds.status][0].value): ' + (arrCheckStatus.includes(parseInt(objCASFieldValues[objCASFieldIds.status][0].value)))
					});

					if (!arrCheckStatus.includes(parseInt(objCASFieldValues[objCASFieldIds.status][0].value))) {
						return;
					}

					arrColumns = [objCaseCSHUBFieldIds.caseType, objCaseCSHUBFieldIds.status, objCaseCSHUBFieldIds.stepIdArray];
					let objCaseCSHUBFieldValues = search.lookupFields({
						type: search.Type.SUPPORT_CASE,
						id: objCASFieldValues[objCASFieldIds.parentCase][0].value,
						columns: arrColumns
					});
					log.debug({
						title: stLogTitle,
						details: 'objCaseCSHUBFieldValues: ' + JSON.stringify(objCaseCSHUBFieldValues)
					});

					objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray] = objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray].split(',');

					log.debug({
						title: stLogTitle,
						details: 'objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray]: ' + objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray]
					});

					let index_currentStepId = objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray].indexOf(objCASFieldValues[objCASFieldIds.currentStepId]);
					if (index_currentStepId >= 0 && index_currentStepId != objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray].length - 1) {
						let nextStepId = objCaseCSHUBFieldValues[objCaseCSHUBFieldIds.stepIdArray][index_currentStepId + 1];
						log.debug({
							title: stLogTitle,
							details: 'nextStepId: ' + nextStepId
						});
						let savedSearchId = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.search_nextStep});

						let objSearch_nextStep = search.load({
							id: savedSearchId
						});
						objSearch_nextStep.filters.push(search.createFilter({
							name: 'custrecord_cshub_csactnstep_crntstp_id',
							operator: search.Operator.IS,
							values: nextStepId
						}));
						let nextStepResultsCount = objSearch_nextStep.runPaged().count;
						if (isEmpty(nextStepResultsCount) || !(nextStepResultsCount > 0)) {
							log.audit({
								title: stLogTitle,
								details: 'nextStepResultsCount empty or 0'
							});
							return;
						}
						let nextStepResults = objSearch_nextStep.run().getRange({start: 0, end: 1});
						log.debug({
							title: stLogTitle,
							details: 'nextStepResults: ' + JSON.stringify(nextStepResults)
						});
						let nextStepInternalId = nextStepResults[0].getValue({name: 'internalid'});
						log.debug({
							title: stLogTitle,
							details: 'nextStepInternalId: ' + nextStepInternalId
						});
						let submitFieldValues = {};
						submitFieldValues[objCaseCSHUBFieldIds.nextStep] = nextStepInternalId;
						let caseId = record.submitFields({
							type: record.Type.SUPPORT_CASE,
							id: objCASFieldValues[objCASFieldIds.parentCase][0].value,
							values: submitFieldValues
						});
						log.debug({
							title: stLogTitle,
							details: 'submitFields caseId: ' + caseId
						});
					}
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: ex.name + '; message: ' + ex.message + '; stack: ' + ex.stack
				});
			}
		}

		return {afterSubmit}

	});
