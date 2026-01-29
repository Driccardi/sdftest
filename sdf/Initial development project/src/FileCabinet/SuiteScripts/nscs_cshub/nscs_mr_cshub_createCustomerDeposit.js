/**
 *    Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 *
 * Version          Date                      Author                                Remarks
 * 1.0            2025/02/25           giriesh.gunturi                       Initial Commit
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', './cshub_library'],

	(record, search, runtime, cshub) => {
		/**
		 * @name objScriptParameterIds
		 * @type {Readonly<{savedSearch_casId: string, amountFromCase: string, actionStepId: string, transactionType: string, depositAccount: string, paymentMethod: string, savedSearch_so: string}>}
		 */
		const objScriptParameterIds = Object.freeze({
			savedSearch_so: 'custscript_cshub_mr_createcd_search_so',
			depositAccount: 'custscript_cshub_mr_createcd_depacc',
			paymentMethod: 'custscript_cshub_mr_createcd_paymethod',
			savedSearch_casId: 'custscript_cshub_mr_createcd_cas_search',
			amountFromCase: 'custscript_cshub_mr_createcd_usecaseamt',
			actionStepId: 'custscript_cshub_mr_createcd_stepid',
			transactionType: 'custscript_cshub_mr_createcd_exptrantype',
            parentTranID : 'custscript_cshub_mr_cmtocd_transaction',
			customForm: 'custscript_cshub_mr_createcd_customform'
		});

		/**
		 * @typedef objScriptParameterValues
		 * @description Expected structure of script deployment parameters
		 * @property {string} savedSearch_so Internal ID of transaction (sales order) saved search from which to create Customer Deposits
		 * @property {string} depositAccount Internal ID of Account to use on Customer Deposit
		 * @property {string} paymentMethod Internal ID of Payment Method or Payment Option to use on Customer Deposit
		 * @property {string} savedSearch_case Internal ID of Case saved search for which to create Customer Deposits
		 */

		/**
		 * @name objScriptParameterValues
		 * @type {objScriptParameterValues}
		 */
		let objScriptParameterValues;

		/**
		 * @name objSalesOrderSearchResultColumns
		 * @type {Readonly<{internalId: string, classId: string, caseDetail_parentCaseId: string, cshub_caseTypeId: string, locationId: string, departmentId: string, cshub_caseDetailId: string, caseDetail_parentTransactionId: string, entityId: string, subsidiaryId: string, caseDetail_parentCaseTypeId: string}>}
		 */
		const objSalesOrderSearchResultColumns = Object.freeze({
			internalId: 'internalid',
			tranid: 'tranid',
			entityId: 'entity',
			subsidiaryId: 'subsidiary',
			departmentId: 'department',
			classId: 'class',
			locationId: 'location',
			amount: 'amount',
			cshub_caseTypeId: 'custbody_cshub_case_type',
			cshub_caseDetailId: 'custbody_cshub_createdfromcasedetail',
			caseDetail_parentCaseId: 'custrecord_cshcd_csactn_step_parent_case.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL',
			caseDetail_parentCaseTypeId: 'custrecord_cshcd_csactn_stp_prnt_cs_typ.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL',
			caseDetail_parentTransactionId: 'custrecord_cshub_casestep_prnt_tran.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL',
			associatedLineId: 'custrecord_cshub_casestep_tran_line_id.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL'
		});

		const caseAmountFieldId = 'custevent_cshub_appeasementamount';

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
		 * @name createCustomerDeposit
		 * @return {null|number}
		 * @param entityId
		 * @param salesOrderId
		 * @param salesOrderNumber
		 * @param amount
		 * @param paymentMethodId
		 * @param accountId
		 */
		const createCustomerDeposit = (entityId, salesOrderId, salesOrderNumber, amount, paymentMethodId, accountId, caseActionStepId) => {
			const strLogTitle = 'createCustomerDeposit';
			let idCustomerDeposit = null;
			try {
				//2025-06-18 GGNS Added because CD form in prod had Location made mandatory
				let customFormId = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.customForm});
				let objDefaultValues = {};
				objDefaultValues['entity'] = entityId;
				if (!isEmpty(customFormId)) {
					objDefaultValues['customform'] = customFormId;
				}
				let recCustDeposit = record.create({
					type: record.Type.CUSTOMER_DEPOSIT,
					isDynamic: true,
					defaultValues: objDefaultValues
				});

				recCustDeposit.setValue({
					fieldId: 'salesorder',
					value: salesOrderId
				});

				recCustDeposit.setValue({
					fieldId: 'memo',
					value: 'CSHUB Created For ' + salesOrderNumber
				});

				recCustDeposit.setValue({
					fieldId: 'paymentoption',
					value: paymentMethodId
				});

				recCustDeposit.setValue({
					fieldId: 'payment',
					value: amount
				});

				/*recCustDeposit.setValue({
					fieldId: 'account',
					value: accountId
				});*/

				recCustDeposit.setValue({
					fieldId: 'custbody_cshub_createdfromcasedetail',
					value: caseActionStepId
				});

				idCustomerDeposit = recCustDeposit.save({
					ignoreMandatoryFields: true,
					enableSourcing: true
				});
				log.audit({
					title: strLogTitle,
					details: 'idCustomerDeposit: ' + idCustomerDeposit
				});
			} catch (ex) {
				log.error({
					title: strLogTitle,
					details: JSON.stringify(ex)
				});
			}
			return idCustomerDeposit;
		}

		/**
		 * @name findCaseActionID
		 * @param {string} intTranLine Associated Line Id
		 * @param {string} intParentCase Case internal Id
		 * @return {{} | {arrCaseStep, idCaseAction, strCurrentActionStep}}
		 */
		const findCaseActionID = (intTranLine, intParentCase) => {
			let intTransactionType = parseInt(runtime.getCurrentScript().getParameter({name: objScriptParameterIds.transactionType}));
			let intFindActionStepSrch = parseInt(runtime.getCurrentScript().getParameter({name: objScriptParameterIds.savedSearch_casId}));
			let objSearchCase = search.load({id: intFindActionStepSrch});
			objSearchCase.filters.push(
				search.createFilter({
					name: "custrecord_cshcd_csactn_step_parent_case",
					operator: search.Operator.ANYOF,
					values: parseInt(intParentCase),
				}),
				search.createFilter({
					name: "custrecord_cshub_casestep_tran_line_id",
					operator: search.Operator.IS,
					values: intTranLine,
				}),
				search.createFilter({
					name: "custrecord_cshcd_csactn_step_exp_tran",
					operator: search.Operator.ANYOF,
					values: intTransactionType,
				})
			);
			log.debug('Current Search', objSearchCase)
			let idCaseAction;
			let arrCaseStep;
			let strCurrentActionStep;
			let searchResultCount = objSearchCase.runPaged().count;
			log.debug("objSearchCase result count", searchResultCount);
			if (searchResultCount > 0) {
				objSearchCase.run().each(function (result) {
					log.debug('result', result)
					idCaseAction = result.id;
					arrCaseStep = result.getValue({
						name: 'custevent_cshub_casestep_array_ids',
						join: 'CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE'
					});
					strCurrentActionStep = result.getValue('custrecord_cshub_csactnstep_crntstp_id')
				});
				log.audit('result', 'idCaseAction: ' + idCaseAction + ' | arrCaseStep: ' + arrCaseStep + ' | strCurrentActionStep: ' + strCurrentActionStep);

				return {
					idCaseAction: idCaseAction,
					strCurrentActionStep: strCurrentActionStep,
					arrCaseStep: arrCaseStep
				};
			} else {
				log.audit('No case action found.');
				return {};
			}
		}
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

		const getInputData = (inputContext) => {
			const stLogTitle = 'getInputData';
			try {
				const currentScript = runtime.getCurrentScript();
				const isReExecution = currentScript.getParameter({name: cshub.general.mapreduceParamsForUE[currentScript.id].param_reexecute});
				log.debug({
					title: stLogTitle,
					details: 'isReExecution: ' + isReExecution
				});
				//let intSavedSearch = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.savedSearch_so});
				//let objTransactionSearch = search.load(intSavedSearch);
                // objTransactionSearch = cshub.general.filterByTransactionID(objTransactionSearch, objScriptParameterIds.parentTranID, 'internalid')

				//changed to use searchBuilder consistent with other MR scripts 2025-04-26
				let objTransactionSearch;
				let savedSearchBuilder = cshub.general.mrSearchBuilder();
				log.debug({
					title: stLogTitle,
					details: 'savedSearchBuilder: ' + JSON.stringify(savedSearchBuilder)
				});
				if (cshub.general.isEmpty(savedSearchBuilder)) {
					throw {
						name: 'ERR_SEARCH_BUILDER',
						message: 'mrSearchBuilder returned no result.'
					}
				} else {
					objTransactionSearch = search.load({id: savedSearchBuilder.savedSearchId});
					//uses the transaction saved search
					objTransactionSearch.filters.push(search.createFilter({
						name: savedSearchBuilder.filterName,
						join: 'CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL',
						operator: search.Operator.ANYOF,
						values: savedSearchBuilder.filterValue
					}));
				}
				let objSearchResultCount = objTransactionSearch.runPaged().count;
				log.debug({
					title: stLogTitle,
					details: 'objSearchResultCount: ' + objSearchResultCount
				});

				if (objSearchResultCount > 0) {
					return objTransactionSearch;
				} else {
					log.audit('No data to process', 'Saved search is not getting results')
					return false;
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: JSON.stringify(ex)
				});
				return false;
			}
		}

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

		const map = (mapContext) => {
			const stLogTitle = 'map';

			try {
				/*log.debug({
					title: stLogTitle,
					details: 'mapContext.value: ' + mapContext.value
				});*/
				let param_useCaseAmount = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.amountFromCase});
				let param_depositAccount = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.depositAccount});
				let param_paymentMethod = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.paymentMethod});
				log.debug({
					title: stLogTitle,
					details: 'param_useCaseAmount: ' + param_useCaseAmount + '; param_paymentMethod: ' + param_paymentMethod + '; param_depositAccount: ' + param_depositAccount
				});
				let objSearchResults = JSON.parse(mapContext.value);
				let objResultValues = objSearchResults.values;
				/*
				values: {
	  internalid: {
		 value: "384392",
		 text: "384392"
	  },
	  tranid: "SO554812630851723649923046065176148",
	  entity: {
		 value: "16377",
		 text: "1234568188 Bruce Wayne"
	  },
	  statusref: {
		 value: "pendingFulfillment",
		 text: "Pending Fulfillment"
	  },
	  amount: "2926.59",
	  subsidiary: {
		 value: "2",
		 text: "Parent Company : N. Tepperman Limited"
	  },
	  location: {
		 value: "10",
		 text: "LONDON"
	  },
	  department: "",
	  class: "",
	  custbody_cshub_case_type: {
		 value: "518",
		 text: "70 - iA / W3 Replacement"
	  },
	  custbody_cshub_createdfromcasedetail: {
		 value: "14824",
		 text: "CASE419 1234568188 Bruce Wayne, 70 - iA / W3 Replacement, INV1937 For70.2.0 - Create Replacement Sales Order"
	  },
	  "custrecord_cshcd_csactn_step_parent_case.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL": {
		 value: "979323",
		 text: "CASE419 1234568188 Bruce Wayne, 70 - iA / W3 Replacement, INV1937"
	  },
	  "custrecord_cshcd_csactn_stp_prnt_cs_typ.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL": {
		 value: "518",
		 text: "70 - iA / W3 Replacement"
	  },
	  "custrecord_cshub_casestep_prnt_tran.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL": {
		 value: "376474",
		 text: "Invoice #INV1937"
	  },
	  "custrecord_cshub_casestep_tran_line_id.CUSTBODY_CSHUB_CREATEDFROMCASEDETAIL": "376474_3028878"
   }
				 */

				let objData = {};
				objData['useCaseAmount'] = param_useCaseAmount;
				objData['depositAccount'] = param_depositAccount;
				objData['paymentMethod'] = param_paymentMethod;
				for (const key in objSalesOrderSearchResultColumns) {
					if (isEmpty([objSalesOrderSearchResultColumns[key]])) {
						objData[key] = null;
					} else if (typeof objResultValues[objSalesOrderSearchResultColumns[key]] === 'object' && !Array.isArray(objResultValues[objSalesOrderSearchResultColumns[key]])) {
						objData[key] = objResultValues[objSalesOrderSearchResultColumns[key]].value;
					} else if (Array.isArray(objResultValues[objSalesOrderSearchResultColumns[key]])) {
						objData[key] = objResultValues[objSalesOrderSearchResultColumns[key]][0].value;
					} else {
						objData[key] = objResultValues[objSalesOrderSearchResultColumns[key]];
					}
				}

				if (objData.useCaseAmount) {
					let caseAmountResult = search.lookupFields({
						type: search.Type.SUPPORT_CASE,
						id: objData.caseDetail_parentCaseId,
						columns: caseAmountFieldId
					});
					log.debug({
						title: stLogTitle,
						details: 'caseAmountResult: ' + JSON.stringify(caseAmountResult)
					});
					objData.amount = search.lookupFields({
						type: search.Type.SUPPORT_CASE,
						id: objData.caseDetail_parentCaseId,
						columns: caseAmountFieldId
					})[caseAmountFieldId];
				}
				log.debug({
					title: stLogTitle,
					details: 'objData: ' + JSON.stringify(objData)
				});

				mapContext.write({
					key: objData.internalId,
					value: objData
				});

			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: JSON.stringify(ex)
				});
			}

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
		const reduce = (reduceContext) => {
			const stLogTitle = 'reduce';
			try {
				const objReduceKey = JSON.parse(reduceContext.key);
				const objData = JSON.parse(reduceContext.values[0]); //assumes only one result per sales order

				let objCaseActionStep = findCaseActionID(objData.associatedLineId, objData.caseDetail_parentCaseId);
				log.debug({
					title: stLogTitle,
					details: 'objCaseActionStep: ' + JSON.stringify(objCaseActionStep)
				});
				if (isEmpty(objCaseActionStep)) {
					/*throw {
						name: 'ERR_CAS_ID',
						message: 'findCaseActionId returned empty.'
					}*/
					log.audit({
						title: stLogTitle,
						details: 'findCaseActionId returned empty for objData.associatedLineId: ' + objData.associatedLineId + ' and objData.caseDetail_parentCaseId: ' + objData.caseDetail_parentCaseId + ' and objData.tranid: ' + objData.tranid
					});
					return;
				}

				let idCustomerDeposit = createCustomerDeposit(
					objData.entityId,
					objData.internalId,
					objData.tranid,
					objData.amount,
					objData.paymentMethod,
					objData.depositAccount,
					objCaseActionStep.idCaseAction
				);
				log.debug({
					title: stLogTitle,
					details: 'idCustomerDeposit: ' + idCustomerDeposit
				});

				if (!isEmpty(idCustomerDeposit)) {

					let casId = record.submitFields({
						type: 'customrecord_cshub_caseactionstep',
						id: objCaseActionStep.idCaseAction,
						values: {
							custrecord_cshcd_csactn_step_crtd_tran: idCustomerDeposit,
							custrecord_cshub_actnstep_stts: 3
						}
					});
				} else {
					record.submitFields({
						type: 'customrecord_cshub_caseactionstep',
						id: objCaseActionStep.idCaseAction,
						values: {
							custrecord_cshub_actnstep_stts: 4
						}
					});
				}

			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: JSON.stringify(ex)
				});
				record.submitFields({
					type: 'customrecord_cshub_caseactionstep',
					id: objCaseDetails.idCaseAction,
					values: {
						custrecord_cshub_actnstep_stts: 4
					}
				});
			}
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
		const summarize = (summaryContext) => {
			const stLogTitle = 'summarize';
			try {
				log.audit(stLogTitle, 'Execution time in seconds: ' + summaryContext.seconds +
					' | Usage Consumed: ' + summaryContext.usage +
					' | Usage Consumed: ' + summaryContext.yields +
					' | Concurrency Number: ' + summaryContext.concurrency
				);
				if (summaryContext.inputSummary.error !== null) {
					log.error({
						title: 'Input Error: ',
						details: summaryContext.inputSummary.error
					});
				}
				summaryContext.mapSummary.errors.iterator().each(function (key, error) {
					log.error({
						title: stLogTitle + '_mapError',
						details: 'key: ' + key + '; error: ' + error
					});
					return true;
				});
				summaryContext.reduceSummary.errors.iterator().each(function (key, error) {
					log.error({
						title: stLogTitle + '_reduceError',
						details: 'key: ' + key + '; error: ' + error
					});
					return true;
				});
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: ex
				});
			}
		}

		return {getInputData, map, reduce, summarize}

	});
