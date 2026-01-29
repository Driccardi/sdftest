/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime'],

	(record, search, runtime) => {
		const objScriptParameterIds = Object.freeze({
			itemSearch: 'custscript_nscs_mr_iut_itemsearch',
			killSwitch: 'custscript_nscs_mr_iut_kill',
			warrantyValue: 'custscript_nscs_mr_iut_warrantyprodtype'
		});

		const objItemUsageType = Object.freeze({
			merch: 1,
			nonMerch: 6,
			warranty: 3,
			appeasement: 4,
			discount: 2
		});

		const objSearchResultFields = Object.freeze({
			itemType: 'type',
			internalId: 'internalid',
			productType: 'custitem_tepp_commonproducttype',
			itemUsageType: 'custitem_nscs_itemusage'
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
				let itemSearchId = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.itemSearch});
				if (isEmpty(itemSearchId)) {
					throw {
						name: 'ERR_PARAM',
						message: 'No item search found in parameters.'
					}
				}
				let objSearch = search.load({
					id: itemSearchId
				});
				let intResultsCount = objSearch.runPaged().count;
				if (intResultsCount == 0) {
					log.audit({
						title: stLogTitle,
						details: 'No items to update. intResultsCount: ' + intResultsCount
					});
					return false;
				} else {
					let intRangeEnd = (intResultsCount < 25) ? intResultsCount : 24;
					return objSearch.run().getRange({start: 0, end: intRangeEnd});
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack
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
				const bool_killSwitch = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.killSwitch});
				if (bool_killSwitch) {
					log.audit({
						title: stLogTitle,
						details: 'Terminating. killSwitch: ' + bool_killSwitch
					});
					return false;
				}
				const warrantyProductType = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.warrantyValue});

				const objResult = JSON.parse(mapContext.value);
				const itemType = objResult['recordType'];
				const itemInternalId = objResult['id'];
				let itemProductType;
				if (!isEmpty(objResult.values[objSearchResultFields.productType])) {
					itemProductType = objResult.values[objSearchResultFields.productType].value;
				}

				const arrMerch = [
					record.Type.INVENTORY_ITEM,
					record.Type.KIT_ITEM,
					record.Type.ASSEMBLY_ITEM,
					record.Type.GIFT_CERTIFICATE_ITEM,
					record.Type.ITEM_GROUP,
					record.Type.NON_INVENTORY_ITEM
				];

				/*log.debug({
					title: stLogTitle,
					details: 'arrMerch: ' + arrMerch
				});*/

				const arrNonMerch = [
					record.Type.OTHER_CHARGE_ITEM,
					record.Type.SERVICE_ITEM
				];

				/*log.debug({
					title: stLogTitle,
					details: 'arrNonMerch: ' + arrNonMerch
				});*/

				let itemUsageType = null;

				if (arrMerch.includes(itemType)) {
					log.debug({
						title: stLogTitle,
						details: 'arrMerch.includes(itemType)'
					});
					itemUsageType = objItemUsageType.merch;
				} else if (arrNonMerch.includes(itemType) && itemProductType !== warrantyProductType) {
					log.debug({
						title: stLogTitle,
						details: 'arrNonMerch.includes(itemType) && itemProductType !== warrantyProductType'
					});
					itemUsageType = objItemUsageType.nonMerch;
				} else if (arrNonMerch.includes(itemType) && itemProductType === warrantyProductType) {
					log.debug({
						title: stLogTitle,
						details: 'Warranty. arrNonMerch.includes(itemType) && itemProductType === warrantyProductType'
					});
					itemUsageType = objItemUsageType.warranty;
				} else {
					throw {
						name: 'ERR_ITEM_TYPE',
						message: 'ItemType cannot be evaluated.'
					}
				}
				mapContext.write({
					key: {itemType: itemType, itemUsageType: itemUsageType},
					value: itemInternalId
				});
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack + '</br>mapContext.value: ' + mapContext.value
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
				const bool_killSwitch = runtime.getCurrentScript().getParameter({name: objScriptParameterIds.killSwitch});
				if (bool_killSwitch) {
					log.audit({
						title: stLogTitle,
						details: 'Terminating. killSwitch: ' + bool_killSwitch
					});
					return false;
				}
				const reduceKey = JSON.parse(reduceContext.key);
				const itemType = reduceKey.itemType;
				const itemUsageType = reduceKey.itemUsageType;
				const itemIds = reduceContext.values;
				log.debug({
					title: stLogTitle,
					details: 'itemType: ' + itemType + '; itemUsageType: ' + itemUsageType
				});
				log.debug({
					title: stLogTitle,
					details: 'itemIds.length: ' + itemIds.length
				});
				let objValue = {};
				objValue[objSearchResultFields.itemUsageType] = itemUsageType;
				for (let i = 0; i < itemIds.length; i++) {
					let itemId = record.submitFields({
						type: itemType,
						id: itemIds[i],
						values: objValue,
						options: {
							enablesourcing: false,
							ignoreMandatoryFields: true
						}
					});
					log.audit({
						title: stLogTitle,
						details: 'Updated item ' + itemId
					});
				}
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack + '<\/br>reduceContext.key: ' + reduceContext.key
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
				log.audit({
					title: stLogTitle,
					details: 'Execution time in seconds: ' + summaryContext.seconds +
						' | Usage Consumed: ' + summaryContext.usage +
						' | Usage Consumed: ' + summaryContext.yields +
						' | Concurrency Number: ' + summaryContext.concurrency
				});
			} catch (ex) {
				log.error({
					title: stLogTitle,
					details: 'name: ' + ex.name + '<\/br>message:  ' + ex.message + '<\/br>stack:  ' + ex.stack
				});
			}
		}

		return {getInputData, map, reduce, summarize}

	});
