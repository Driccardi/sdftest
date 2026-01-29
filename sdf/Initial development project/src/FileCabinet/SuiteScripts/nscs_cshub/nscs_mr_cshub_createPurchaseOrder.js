/**
 *  Copyright (c) 2024, Oracle and/or its affiliates. All rights reserved.
 *  This software is the confidential and proprietary information of
 * NetSuite, Inc. ('Confidential Information'). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 *
 * The map/reduce script type is designed for scripts that need to handle large amounts of data.
 * It is best suited for situations where the data can be divided into small, independent parts.
 * When the script is executed, a structured framework automatically creates enough jobs to process all of these parts.
 *
 * This script will be used for CSHUB Purchase Orders. It creates a stand-alone Purchase Order per case created from CSHUB.
 * Uses saved search CSHUB MR Create Purchase Order ***DO NOT EDIT. SCRIPT USE***
 *
 * Version          Date                      Author                                Remarks
 *
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/task', './cshub_library'],

	(record, search, runtime, task, cshub) => {

		/**
		 * @typedef {Object} objSearchResultValue
		 * @property {string} value
		 * @property {string} text
		 */
		/**
		 * @typedef {Object} getInputDataSearchResult
		 * @property {string} internalid Internal ID of CSHUB Case Step Action record
		 * @property {objSearchResultValue} custrecord_cshcd_csactn_step_parent_case Case record
		 * @property {objSearchResultValue} custrecord_cshcd_csactn_stp_prnt_cs_typ CSHUB Case Type
		 * @property {objSearchResultValue} custrecord_cshub_casestep_prnt_tran Case CSHUB Transaction
		 * @property {string} custrecord_cshub_casestep_tran_line_id Associated Line ID
		 * @property {objSearchResultValue} custrecord_cshub_glreasoncode.CUSTRECORD_CSHUB_CASESTEP_RSN_CODE Assocaited GL Reason Code
		 * @property {string} custrecord_cshub_casestep_qty Quantity
		 * @property {objSearchResultValue} custrecord_schub_parent_config_step
		 * @property {objSearchResultValue} custrecord_cshub_casestep_rsn_code
		 * @property {objSearchResultValue} custrecord_cshcd_csactn_step_crtd_tran
		 * @property {objSearchResultValue} custrecord_cshub_actnstep_stts
		 * @property {string} custrecord_cshub_csactnstep_crntstp_id
		 * @property {string} custevent_cshub_casestep_array_ids.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE
		 * @property {objSearchResultValue} custevent_cshub_nextstep.CUSTRECORD_CSHCD_CSACTN_STEP_PARENT_CASE
		 * @property {string} custrecord_cshub_actnstep_intrns_rec_loc
		 * @property {objSearchResultValue} location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN
		 * @property {string} custrecord_cshub_casestep_amt
		 * @property {string} custrecord_cas_class
		 * @property {string} custrecord_cas_department
		 * @property {string} class.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN
		 * @property {string} department.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN
		 *
		 */
		/**
		 * @typedef {Object} POHeader
		 * @property vendorId
		 * @property memo
		 * @property locationId
		 * @property classId
		 * @property departmentId
		 * @property employeeId
		 */
		/**
		 * @typedef {Object} POItem
		 * @property sublistId
		 * @property itemId
		 * @property quantity
		 * @property rate
		 * @property associatedLineId
		 */
		/**
		 * @typedef {Array.<POItem>} arrPOItems
		 */
		/**
		 * @typedef {Object} tranCSHUBFields
		 * @property caseActionStepId
		 * @property caseTypeId
		 */
		/**
		 * @typedef {Object} objScriptParameterValues
		 * @property {string} cas_search
		 * @property {string} cas_stepId
		 * @property {string} [lineKey]
		 * @property {number} vendorId
		 * @property {number} [employeeId]
		 * @property {number} itemId
		 * @property {string} memo
		 * @property {number} [customForm]
		 */
		/**
		 * @name objScriptParameterIds
		 * Script parameter IDs for this MR script
		 * @type {Readonly<{lineKey: string, cas_search: string, cas_stepId: string}>}
		 */
		const objScriptParameterIds = Object.freeze({
			cas_search: 'custscript_cshub_mr_po_search',
			cas_stepId: 'custscript_cshub_mr_po_stepid',
			lineKey: 'custscript_cshub_mr_po_linekey',
			vendorId: 'custscript_cshub_mr_po_vendor',
			employeeId: 'custscript_cshub_mr_po_employee',
			itemId: 'custscript_cshub_mr_po_item',
			memo: 'custscript_cshub_mr_po_memo',
			customForm: 'custscript_cshub_mr_po_customform',
            parentTranID: 'custscript_cshub_mr_po_transaction'
		});

		const cas_statusFieldId = 'custrecord_cshub_actnstep_stts';
		const cas_createdTranFieldId = 'custrecord_cshcd_csactn_step_crtd_tran';

		const log_noData = 'Saved search returned no results. Terminating.';
		const stRecType_caseActionStep = 'customrecord_cshub_caseactionstep';

		let stLogTitle = 'cshub_mr_po_';

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
		const getParameterValue = (paramId) => {
			return runtime.getCurrentScript().getParameter({name: paramId});
		}

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
			/*
			SAMPLE
			{
   				cas_search: "4706",
   				cas_stepId: "50.0.7",
   				lineKey: "custcol_cshub_associatedlineid",
   				vendorId: "3239",
   				employeeId: "6068",
   				itemId: "111718",
   				memo: "Created by CSHUB for Home Damage Repair",
   				customForm: null
			}
			 */
		}

		/**
		 * @name createPurchaseOrder
		 * @param {POHeader} objHeader
		 * @param {tranCSHUBFields} objCSHUB
		 * @param {arrPOItems} arrObjItems
		 * @param {objScriptParameterValues} objScriptParamValues
		 * @returns {number} poId Internal ID of created PO
		 */
		const createPurchaseOrder = (objHeader, arrObjItems, objCSHUB, objScriptParamValues) => {
			stLogTitle = 'createPurchaseOrder';
			let poDefaultValues = {};
			if (!isEmpty(objScriptParamValues.customForm)) {
				poDefaultValues.customform = objScriptParamValues.customForm;
			}
			if (!isEmpty(objHeader.vendorId)) {
				poDefaultValues.entity = objHeader.vendorId;
			} else {
				throw {
					name: stLogTitle,
					message: 'Missing Vendor. Terminating.'
				}
			}
			log.debug({
				title: stLogTitle,
				details: 'poDefaultValues: ' + JSON.stringify(poDefaultValues)
			});
			/*
			SAMPLE poDefaultValues
			{
			   entity: "3239"
			}
			 */
			let po = record.create({
				type: record.Type.PURCHASE_ORDER,
				isDynamic: true,
				defaultValues: poDefaultValues
			});
			// if (!isEmpty(objScriptParamValues.vendorId)) {
			// 	po.setValue({
			// 		fieldId: 'entity',
			// 		value: objScriptParamValues.vendorId
			// 	});
			// } else {
			// 	throw {
			// 		name: stLogTitle,
			// 		message: 'Missing Vendor'
			// 	}
			// }
			if (!isEmpty(objHeader.locationId)) {
				po.setValue({
					fieldId: 'location',
					value: objHeader.locationId
				});
			}
			if (!isEmpty(objHeader.classId)) {
				po.setValue({
					fieldId: 'class',
					value: objHeader.classId
				});
			}
			if (!isEmpty(objHeader.departmentId)) {
				po.setValue({
					fieldId: 'department',
					value: objHeader.departmentId
				});
			}
			if (!isEmpty(objHeader.employeeId)) {
				po.setValue({
					fieldId: 'employee',
					value: objHeader.employeeId
				});
			}

			po.setValue({
				fieldId: 'memo',
				value: objHeader.memo
			});
			po.setValue({
				fieldId: 'custbody_cshub_createdfromcasedetail',
				value: objCSHUB.caseActionStepId
			});
			po.setValue({
				fieldId: 'custbody_cshub_case_type',
				value: objCSHUB.caseTypeId
			});
			//todo
			//Defaults for PO
			po.setValue({
				fieldId: 'tobeemailed',
				value: false
			});

			//add sublist lines
			for (let i = 0; i < arrObjItems.length; i++) {
				let objLine = arrObjItems[i];
				let stSublistId = objLine.sublistId;
				po.selectNewLine({
					sublistId: stSublistId
				});
				po.setCurrentSublistValue({
					sublistId: stSublistId,
					fieldId: 'item',
					value: objLine.itemId
				});
				po.setCurrentSublistValue({
					sublistId: stSublistId,
					fieldId: 'quantity',
					value: objLine.quantity
				});
				po.setCurrentSublistValue({
					sublistId: stSublistId,
					fieldId: 'rate',
					value: objLine.rate
				});
				po.setCurrentSublistValue({
					sublistId: stSublistId,
					fieldId: objScriptParamValues.lineKey,
					value: objLine.associatedLineId
				});

                let fltAmount = forceFloat(objLine.rate) * forceFloat(objLine.quantity)

                po.setCurrentSublistValue({
                    sublistId: stSublistId,
                    fieldId: 'amount',
                    value: fltAmount
                });

                po.setCurrentSublistValue({
                    sublistId: stSublistId,
                    fieldId: objScriptParamValues.lineKey,
                    value: objLine.associatedLineId
                });
				po.commitLine({
					sublistId: stSublistId
				});
			}

			let poId = po.save({
				enableSourcing: false,
				ignoreMandatoryFields: true
			});

			log.debug({
				title: stLogTitle,
				details: 'poId: ' + poId
			});

			return poId;
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
			stLogTitle += 'getInputData';
			log.debug({
				title: stLogTitle,
				details: 'BEGIN'
			});
			try {
				let objScriptParamValues = getScriptParameterValues();
				log.debug({
					title: stLogTitle,
					details: 'objScriptParamValues: ' + JSON.stringify(objScriptParamValues)
				});
				if (isEmpty(objScriptParamValues)) {
					throw {
						name: 'ERR_EMPTY_PARAMS',
						message: 'Script parameters are empty.'
					}
				} else if (isEmpty(objScriptParamValues.cas_search)) {
					throw {
						name: 'ERR_EMPTY_SEARCH',
						message: 'Script parameter SAVED SEARCH is empty.'
					}
				} else if (isEmpty(objScriptParamValues.vendorId)) {
					throw {
						name: 'ERR_EMPTY_VENDOR',
						message: 'Script parameter VENDOR is empty.'
					}
				} else if (isEmpty(objScriptParamValues.item)) {

				}

				/*let objSearch = search.load({
					id: objScriptParamValues.cas_search
				});
                objSearch = cshub.general.filterByTransactionID(objSearch, objScriptParameterIds.parentTranID)*/
				//modified 2024-04-25 for re-execute capability
				let objTransactionSearch;
				let savedSearchBuilder = cshub.general.mrSearchBuilder();
				if (cshub.general.isEmpty(savedSearchBuilder)) {
					throw {
						name: 'ERR_SEARCH_BUILDER',
						message: 'mrSearchBuilder returned no result.'
					}
				} else {
					objTransactionSearch = search.load({id: savedSearchBuilder.savedSearchId});
					objTransactionSearch.filters.push(search.createFilter({
						name: savedSearchBuilder.filterName,
						operator: search.Operator.ANYOF,
						values: savedSearchBuilder.filterValue
					}));
				}
				let intSearchResultCount = objTransactionSearch.runPaged().count;
				log.debug({
					title: stLogTitle,
					details: 'intSearchResultCount: ' + intSearchResultCount
				});
				if (intSearchResultCount > 0) {
					return objTransactionSearch;
				} else {
					log.audit({
						title: stLogTitle,
						details: log_noData
					});
					return false;
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: ex.name + '; message: ' + ex.message + '; stack: ' + ex.stack
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
			stLogTitle += 'reduce';
			log.debug({
				title: stLogTitle,
				details: 'BEGIN'
			});
			let objScriptParamValues = getScriptParameterValues();
			log.debug({
				title: stLogTitle,
				details: 'objScriptParamValues: ' + JSON.stringify(objScriptParamValues)
			});
			const arrContextValues = reduceContext.values;
			log.debug({
				title: stLogTitle,
				details: 'arrContextValues: ' + arrContextValues
			});
			try {
				for (let i = 0; i < arrContextValues.length; i++) {
					/**
					 * @name objContextValue
					 * @type {getInputDataSearchResult}
					 */
					let objContextValue = JSON.parse(arrContextValues[i]).values;
					log.debug({
						title: stLogTitle,
						details: 'objContextValue: ' + JSON.stringify(objContextValue)
					});
					/**
					 * @name objPOHeader
					 * @type {POHeader}
					 */
					let objPOHeader = {};
					objPOHeader.vendorId = objScriptParamValues.vendorId;
					objPOHeader.employeeId = objScriptParamValues.employeeId;
					objPOHeader.memo = objScriptParamValues.memo;


					if (!isEmpty(objContextValue.custrecord_cshub_actnstep_intrns_rec_loc)) {
						objPOHeader.locationId = objContextValue.custrecord_cshub_actnstep_intrns_rec_loc;
					} else if (!isEmpty(objContextValue['location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN'])) {
						// log.debug({
						// 	title: stLogTitle,
						// 	details: 'objContextValue[\'location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN\']: ' + objContextValue['location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN']
						// });
						// log.debug({
						// 	title: stLogTitle,
						// 	details: 'objContextValue[\'location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN\']: ' + objContextValue['location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN'].value
						// });
						objPOHeader.locationId = JSON.parse(objContextValue['location.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN']).value;
					}

					if (!isEmpty(objContextValue.custrecord_cas_class)) {
						objPOHeader.classId = objContextValue.custrecord_cas_class;
					} else if (!isEmpty(objContextValue['class.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN'])) {
						objPOHeader.classId = JSON.parse(objContextValue['class.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN']).value;
					}

					if (!isEmpty(objContextValue.custrecord_cas_department)) {
						objPOHeader.departmentId = objContextValue.custrecord_cas_department;
					} else if (!isEmpty(objContextValue['department.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN'])) {
						objPOHeader.departmentId = JSON.parse(objContextValue['department.CUSTRECORD_CSHUB_CASESTEP_PRNT_TRAN']).value;
					}

					log.debug({
						title: stLogTitle,
						details: 'objPOHeader: ' + JSON.stringify(objPOHeader)
					});
					/*
					SAMPLE objPOHeader
					{
					   vendorId: "3239",
					   employeeId: "6068",
					   memo: "Created by CSHUB for Home Damage Repair",
					   locationId: "10"
					}
					 */

					/**
					 * @name objPOCSHUBFields
					 * @type {tranCSHUBFields}
					 */
					let objPOCSHUBFields = {};
					objPOCSHUBFields.caseTypeId = objContextValue.custrecord_cshcd_csactn_stp_prnt_cs_typ.value;
					objPOCSHUBFields.caseActionStepId = objContextValue.internalid.value;
					/*
					SAMPLE objPOCSHUBFields
					{
					   caseTypeId: "120",
					   caseActionStepId: "3523"
					}
					 */

					log.debug({
						title: stLogTitle,
						details: 'objPOCSHUBFields: ' + JSON.stringify(objPOCSHUBFields)
					});

					/**
					 * @name objPOItem
					 * @type {POItem}
					 */
					let objPOItem = {};
					objPOItem.sublistId = 'item';
					objPOItem.quantity = 1;
					objPOItem.itemId = objScriptParamValues.itemId;
					objPOItem.rate = objContextValue.custrecord_cshub_casestep_amt;
					objPOItem.associatedLineId = objContextValue.custrecord_cshub_casestep_tran_line_id;

					/**
					 * @name arrPOLines
					 * @type {arrPOItems}
					 */
					let arrPOLines = [];
					arrPOLines.push(objPOItem);
					/*
					SAMPLE arrPOLines
					[{
					   sublistId: "item",
					   quantity: 1,
					   itemId: "111718",
					   rate: "17.00",
					   associatedLineId: ""
					}]
					 */

					log.debug({
						title: stLogTitle,
						details: 'arrPOLines: ' + JSON.stringify(arrPOLines)
					});

					let intPOId = createPurchaseOrder(objPOHeader, arrPOLines, objPOCSHUBFields, objScriptParamValues);
					log.audit({
						title: stLogTitle,
						details: 'PO Created. Internal ID: ' + intPOId
					});

					/*let submitValues = {
						cas_statusFieldId: 3,
						cas_createdTranFieldId: intPOId
					};*/

					let submitValues = {};
					submitValues[cas_statusFieldId] = 3;
					submitValues[cas_createdTranFieldId] = intPOId;

					let cas_id = record.submitFields({
						type: stRecType_caseActionStep,
						id: objContextValue.internalid.value,
						values: submitValues
					});
					log.debug({
						title: stLogTitle,
						details: 'submitFields cas_id: ' + cas_id
					});
				}
				log.debug({
					title: stLogTitle,
					details: 'END'
				});
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: ex.name + '; message: ' + ex.message + '; stack: ' + ex.stack
				});
				/*let submitValues = {
					cas_statusFieldId: 4
				};*/
				let submitValues = {};
				submitValues[cas_statusFieldId] = 4;

				let cas_id = record.submitFields({
					type: stRecType_caseActionStep,
					id: objContextValue.internalid.value,
					values: submitValues
				});
				log.debug({
					title: stLogTitle,
					details: 'submitFields cas_id: ' + cas_id
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
			try {
				stLogTitle += 'summarize';

				log.audit(stLogTitle, 'Execution time in seconds: ' + summaryContext.seconds +
					' | Usage Consumed: ' + summaryContext.usage +
					' | Usage Consumed: ' + summaryContext.yields +
					' | Concurrency Number: ' + summaryContext.concurrency
				);
				if (summaryContext.inputSummary.error !== null) {
					log.error('Input Error: ', summaryContext.inputSummary.error);
				}
				summaryContext.reduceSummary.errors.iterator().each(function (key, error) {
					log.error('Reduce Error: ', error);
					return true;
				});

			} catch (e) {
				log.error("Error at [" + stLogTitle + "] function",
					'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
			}
		}

        const forceFloat = (stValue)=>
        {
            let flValue = parseFloat(stValue);

            if (isNaN(flValue) || (stValue == Infinity))
            {
                return 0.00;
            }

            return flValue;
        };

		return {getInputData, reduce, summarize}

	});
