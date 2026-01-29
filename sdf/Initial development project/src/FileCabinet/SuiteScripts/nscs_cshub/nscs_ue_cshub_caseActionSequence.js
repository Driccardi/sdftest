/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * User Event script to populate an Inline HTML field on CSHUB Case Action records with the
 * Associated Case Action Steps sorted in the sequence specified in the Step ID Array.
 * Used for visual validation of the sequence of steps that will be created on a CSHUB case.
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/03/15           		giriesh.gunturi                       	Initial
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope TargetAccount
 */
define(['N/record', 'N/runtime', 'N/search'],

	(record, runtime, search) => {

		const recType_caseActionSteps = 'customrecord_cshub_caseactionstep';
		const recType_caseActions = 'customrecord_cshub_caseactions';

		/**
		 * @name objCaseActionFieldIds Field IDs for CSHUB Case Action record
		 * @type {Readonly<{stepIdArray: string, inlineHTML: string}>}
		 */
		const objCaseActionFieldIds = Object.freeze({
			stepIdArray: 'custrecord_cshub_caseactn_stepidarray',
			inlineHTML: 'custrecord_caseaction_actualsequence'
		});

		/**
		 * @name objCaseActionStepsFieldIds Field IDs for CSHUB Case Action Step record
		 * @type {Readonly<{currentStepId: string, stepType: string, expectedTransaction: string, name: string}>}
		 */
		const objCaseActionStepsFieldIds = Object.freeze({
			name: 'name',
			currentStepId: 'custrecord_cshub_csactnstep_crntstp_id',
			stepType: 'custrecord_cshub_actnstep_type',
			expectedTransaction: 'custrecord_cshcd_csactn_step_exp_tran'
		});

		/**
		 * @name isEmpty Evaluates value and returns boolean
		 * @param {*} value
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
		 * @name getStepIdArray Converts string value of Step IDs into an array
		 * @param {string} stepIdString
		 * @returns {null|string[]}
		 */
		const getStepIdArray = (stepIdString) => {
			const stLogTitle = 'getStepIdArray';
			try {
				let arrStepIds = [];
				if (isEmpty(stepIdString)) {
					throw {
						name: 'ERR_STEPIDS',
						message: 'stepIdString is empty.'
					}
				}
				if (stepIdString.indexOf(",") === -1) {
					arrStepIds.push(stepIdString.trim());
				} else {
					let splitStepIds = stepIdString.split(",");
					arrStepIds = splitStepIds.map(stepId => stepId.trim());
				}
				return arrStepIds;
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack + '<\/br>stepIdString: ' + stepIdString
				});
				return null;
			}
		}

		/**
		 * @name getCaseActionSteps Searches on CSHUB Case Action Steps and returns an array of objects
		 * @param {Array<string>} arrStepIds
		 * @returns {null|Object[]} Array of objects {currentStepId, Name, ExpectedTransaction}
		 */
		const getCaseActionSteps = (arrStepIds) => {
			const stLogTitle = 'getCaseActionSteps';
			let arrCaseActionSteps = [];
			try {
				log.debug({
					title: stLogTitle,
					details: 'arrStepIds.length: ' + arrStepIds.length
				});
				let stringLiteral = '\'' + arrStepIds.join("','") + '\'';
				log.debug({
					title: stLogTitle,
					details: 'stringLiteral: ' + stringLiteral
				});
				let formulaString = 'CASE WHEN {custrecord_cshub_csactnstep_crntstp_id} IN (' + stringLiteral + ') THEN 1 ELSE 0 END';
				log.debug({
					title: stLogTitle,
					details: 'formulaString: ' + formulaString
				});
				let objSearch = search.create({
					type: recType_caseActionSteps,
					filters: [],
					columns: []
				});
				objSearch.filters.push(search.createFilter({
					name: objCaseActionStepsFieldIds.stepType,
					operator: search.Operator.ANYOF,
					values: 1 //Configuration
				}));
				objSearch.filters.push(search.createFilter({
					name: 'formulanumeric',
					operator: search.Operator.EQUALTO,
					values: 1,
					formula: formulaString
				}));

				objSearch.columns.push(search.createColumn({
					name: objCaseActionStepsFieldIds.currentStepId
				}));
				objSearch.columns.push(search.createColumn({
					name: objCaseActionStepsFieldIds.name
				}));
				objSearch.columns.push(search.createColumn({
					name: objCaseActionStepsFieldIds.expectedTransaction
				}));
				log.debug({
					title: stLogTitle,
					details: JSON.stringify(objSearch)
				});
				let objPagedData = objSearch.runPaged({pageSize: 1000});
				let resultLength = objPagedData.count;
				log.debug({
					title: stLogTitle,
					details: 'resultLength: ' + resultLength
				});
				if (resultLength > 0 && arrStepIds.length != resultLength) {
					throw {
						name: 'ERR_STEP_COUNT',
						message: 'Number of results returned not equal to number of steps in array.'
					}
				}
				if (resultLength === 0) {
					throw {
						name: 'ERR_STEP_COUNT',
						message: 'No Case Action Steps found for array of step Ids.'
					}
				}
				let arrPageRanges = objPagedData.pageRanges;
				log.debug({
					title: stLogTitle,
					details: 'arrPageRanges.length: ' + arrPageRanges.length
				});
				for (let i = 0; i < arrPageRanges.length; i++) {
					let currentRange = arrPageRanges[i];
					log.debug({
						title: stLogTitle,
						details: 'currentPage: ' + currentRange.compoundLabel + '; index: ' + currentRange.index
					});
					let currentPage = objPagedData.fetch({
						index: currentRange.index
					});
					let searchResults = currentPage.data;
					log.debug({
						title: stLogTitle,
						details: 'searchResults.length: ' + searchResults.length
					});
					for (let x = 0; x < searchResults.length; x++) {
						let objCaseActionStep = {};
						objCaseActionStep[objCaseActionStepsFieldIds.currentStepId] = searchResults[x].getValue({name: objCaseActionStepsFieldIds.currentStepId});
						objCaseActionStep[objCaseActionStepsFieldIds.name] = searchResults[x].getValue({name: objCaseActionStepsFieldIds.name});
						objCaseActionStep[objCaseActionStepsFieldIds.expectedTransaction] = searchResults[x].getValue({name: objCaseActionStepsFieldIds.expectedTransaction});
						arrCaseActionSteps.push(objCaseActionStep);
					}
				}
				log.debug({
					title: stLogTitle,
					details: 'arrCaseActionSteps: ' + JSON.stringify(arrCaseActionSteps)
				});
				return arrCaseActionSteps;
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack + '<\/br>arrStepIds: ' + arrStepIds
				});
				return null;
			}
		}

		/**
		 * @name sortCaseActionSteps Sorts Case Action Steps based on Step ID array
		 * @param {Array<string>} arrStepIds
		 * @param {Object[]} arrCaseActionSteps
		 * @returns {null|Object[]} Array of objects {currentStepId, Name, ExpectedTransaction} sorted based on arrStepIds
		 */
		const sortCaseActionSteps = (arrStepIds, arrCaseActionSteps) => {
			const stLogTitle = 'sortCaseActionSteps';
			let arrSortedSteps = [];
			try {
				for (let i = 0; i < arrStepIds.length; i++) {
					log.debug({
						title: stLogTitle,
						details: 'i: ' + i + '; arrStepIds[i]: ' + arrStepIds[i]
					});
					let step = arrCaseActionSteps.find(function (caseActionStep) {
						log.debug({
							title: 'find',
							details: 'caseActionStep: ' + JSON.stringify(caseActionStep)
						});
						log.debug({
							title: 'find',
							details: 'caseActionStep[objCaseActionStepsFieldIds.currentStepId]: ' + caseActionStep[objCaseActionStepsFieldIds.currentStepId]
						});
						return caseActionStep[objCaseActionStepsFieldIds.currentStepId] === arrStepIds[i];
					});

					if (!isEmpty(step)) {
						arrSortedSteps.push(step);
					}
					log.debug({
						title: stLogTitle,
						details: JSON.stringify(step)
					});
				}
				log.debug({
					title: stLogTitle,
					details: JSON.stringify(arrSortedSteps)
				});
				return arrSortedSteps;
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack
				});
				return null;
			}
		}

		/**
		 * @name createHTML Generates HTML content based on sequenced CSHUB Case Action Steps for Inline HTML field
		 * @param {Object[]} sortedCaseStepsArray
		 * @returns {null|string} HTML string
		 */
		const createHTML = (sortedCaseStepsArray) => {
			const stLogTitle = 'createHTML';
			try {
				let htmlString = '<html><ul>';
				for (let i = 0; i < sortedCaseStepsArray.length; i++) {
					htmlString += '<li>';
					htmlString += sortedCaseStepsArray[i][objCaseActionStepsFieldIds.name];
					htmlString += '</li>';
				}
				htmlString += '</ul></html>';
				return htmlString;
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack
				});
				return null;
			}
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
			const stLogTitle = 'beforeLoad';
			const eventType = scriptContext.type;
			const newRecord = scriptContext.newRecord;
			//let stepIdValue, actionSteps, sequencedSteps, arrStepIds;
			try {
				if (newRecord.type != recType_caseActions) {
					throw {
						name: 'ERR_RECORD_TYPE',
						message: 'Script cannot execute on this record type.'
					}
				}
				log.debug({
					title: stLogTitle,
					details: 'eventType: ' + eventType
				});
				if (eventType === scriptContext.UserEventType.EDIT || eventType === scriptContext.UserEventType.VIEW) {
					let stepIdValue = newRecord.getValue({fieldId: objCaseActionFieldIds.stepIdArray});
					log.debug({
						title: stLogTitle,
						details: 'stepIdValue: ' + stepIdValue
					});
					if (isEmpty(stepIdValue)) {
						return;
					}
					let arrStepIds = getStepIdArray(stepIdValue);
					if (isEmpty(arrStepIds)) {
						throw {
							name: 'ERR_STEP_IDS',
							message: 'arrStepIds is empty.'
						}
					}
					log.debug({
						title: stLogTitle,
						details: 'arrStepIds.length: ' + arrStepIds.length
					});
					let actionSteps = getCaseActionSteps(arrStepIds);
					if (isEmpty(actionSteps)) {
						throw {
							name: 'ERR_CASE_STEPS',
							message: 'actionSteps is empty.'
						}
					}
					log.debug({
						title: stLogTitle,
						details: 'actionSteps.length: ' + actionSteps.length
					});
					let sequencedSteps = sortCaseActionSteps(arrStepIds, actionSteps);
					if (isEmpty(sequencedSteps)) {
						throw {
							name: 'ERR_SORTED_STEPS',
							message: 'sequencedSteps is empty.'
						}
					}
					let htmlContent = createHTML(sequencedSteps);
					if (isEmpty(htmlContent)) {
						throw {
							name: 'ERR_HTML_CONTENT',
							message: 'htmlContent is empty.'
						}
					}
					newRecord.setValue({
						fieldId: objCaseActionFieldIds.inlineHTML,
						value: htmlContent
					});
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack: ' + ex.stack + '<\/br>id: ' + newRecord.id
				});
			}
		}

		return {beforeLoad}

	});
