/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/redirect', 'N/record', 'N/ui/message', 'N/task', 'N/query', './cshub_library'],
	(serverWidget, search, runtime, redirect, record, message, task, query, cshub) => {

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
		};


		const objRenderType = Object.freeze({
			flat: 1,
			hierarchical: 2
		});
		let strTitle;
		const onRequest = (context) => {
			strTitle = "OnRequest";
			let strFormName = getParameter('custscript_nscs_cshub_sl_name');
			try {
				let objForm = serverWidget.createForm({
					title: strFormName ? strFormName : 'Customer Service Hub'
				});
				const request = context.request;
				if (request.method === 'GET') {
					initialPage(context, objForm);
				} else {
					post(request);
				}
			} catch (e) {

				log.error("Error at [" + strTitle + "] function",
					'Message:<\/br>' + e.message + '<\/br><\/br>Stack:<\/br>' + e.stack);
			}
		};

		const initialPage = (context, objForm) => {
			strTitle = "initialPage";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let intTranID = context.request.parameters.custscript_intTranID;
			let fltAppeasementAmt = context.request.parameters.custscript_amt;
			let bfromPost = context.request.parameters.custparam_from_post;
			let bMRComplete = context.request.parameters.custscript_mr_complete;
			let recCaseCreated = context.request.parameters.custparam_rec_case_id;

			if (bfromPost == true) {
				if (recCaseCreated) {
					objForm.addPageInitMessage({
						title: "Done",
						message: 'Case Created ID: ' + recCaseCreated,
						type: message.Type.CONFIRMATION
					});
				} else {
					objForm.addPageInitMessage({
						title: "Done",
						message: 'Process Complete',
						type: message.Type.CONFIRMATION
					});
				}

			}
			let strStandbyMessage = getParameter('custscript_nscs_cshub_stale_standby_msg');
			if (bMRComplete == 1 || bMRComplete == 3) {
				objForm.addPageInitMessage({
					title: "Creating Cases",
					message: strStandbyMessage,
					type: message.Type.INFORMATION
				});

			} else if (bMRComplete == 2) {
				objForm.addPageInitMessage({
					title: "Done",
					message: 'Process Complete. Please Click the search button again',
					type: message.Type.CONFIRMATION
				});

			}

			CSHubLanding(objForm, intTranID, bMRComplete, fltAppeasementAmt);
			context.response.writePage(objForm);
			if (bMRComplete == 3) {
				runMapReduce(intTranID);
			}
		};

		const CSHubLanding = (objForm, intTranID, bMRComplete, fltAppeasementAmt) => {
			strTitle = "CSHubLanding";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');

			let intCurrentUser = runtime.getCurrentUser().id;
			let bIsSupportRep = validateSupportRep(intCurrentUser);

			addHeaderFields(objForm, intTranID, intCurrentUser, bIsSupportRep, fltAppeasementAmt);

			//client script
			let strClientScriptPath = getParameter('custscript_ns_client_script_path');
			objForm.clientScriptModulePath = strClientScriptPath;

			let objSearchButton = objForm.addButton({
				id: 'searchbtn',
				label: 'Search',
				functionName: "searchTransaction()"
			});

			if (getCaseActionDetail().renderType != 1) {
				addSublistFields(objForm, intTranID, bMRComplete);
			} else {
				objSearchButton.isDisabled = true;
			}

			let objReset = objForm.addButton({
				id: 'resetbtn',
				label: 'Reset',
				functionName: "resetTransaction()"
			});


			if (!bIsSupportRep) {
				objSearchButton.isDisabled = true;
				objReset.isDisabled = true;
				objForm.addPageInitMessage({
					title: "You do not have privileges to use CS Hub.",
					message: 'Please contact your administrator and request to be enabled as a Support Rep on your user profile.',
					type: message.Type.ERROR
				});
			}

			//adding submit button
			objForm.addSubmitButton('Submit');
		};

		const addHeaderFields = (objForm, intTranID, intCurrentUser, bIsSupportRep, fltAppeasementAmt) => {
			strTitle = "addHeaderFields";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');

			let intCaseType = getCaseActionDetail().caseType;
			let objTranidFld = objForm.addField({
				id: 'custpage_tranid',
				type: serverWidget.FieldType.SELECT,
				source: 'transaction',
				label: 'Document Number'
			});

			log.debug(strTitle + ' intTranID', intTranID);

			let objOtherRefNum = objForm.addField({
				id: 'custpage_order_number',
				type: serverWidget.FieldType.TEXT,
				label: 'Other Reference Number'
			});

			let objTransactionName = objForm.addField({
				id: 'custpage_tran_text',
				type: serverWidget.FieldType.TEXT,
				label: 'Transaction Text'
			});
			objTransactionName.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			let objCaseTypeFld = objForm.addField({
				id: 'custpage_case_type',
				type: serverWidget.FieldType.SELECT,
				source: 'customrecord_cshub_caseactions',
				label: 'Case Type'
			});
			objCaseTypeFld.defaultValue = intCaseType;
			objCaseTypeFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

			let objCurrentUserField = objForm.addField({
				id: 'custpage_current_user',
				type: serverWidget.FieldType.SELECT,
				source: 'employee',
				label: 'Current User'
			});
			objCurrentUserField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objCurrentUserField.defaultValue = intCurrentUser;

			//Tentative Fields
			let objTranID = objForm.addField({
				id: 'custpage_tran_id',
				type: serverWidget.FieldType.SELECT,
				source: 'transaction',
				label: 'Service Request For'
			});
			objTranID.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

			let objCustID = objForm.addField({
				id: 'custpage_customer_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Customer ID'
			});
			objCustID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			let objCustName = objForm.addField({
				id: 'custpage_customer_name',
				type: serverWidget.FieldType.TEXT,
				label: 'Customer Name'
			});
			objCustName.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

			let objCustEmail = objForm.addField({
				id: 'custpage_customer_email',
				type: serverWidget.FieldType.TEXT,
				label: 'Customer Email'
			});
			objCustEmail.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

			let objTranDate = objForm.addField({
				id: 'custpage_trandate',
				type: serverWidget.FieldType.DATE,
				label: 'Transaction Date'
			});
			objTranDate.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

			let objRefundNeeded = objForm.addField({
				id: 'custpage_refund_needed',
				type: serverWidget.FieldType.CHECKBOX,
				label: 'Refund Needed'
			});
			objRefundNeeded.defaultValue = validateRefund(intCaseType);
			objRefundNeeded.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			addAppeasementFields(objForm, getCaseActionDetail(), fltAppeasementAmt, intCaseType);

			let objActionDetail = objForm.addField({
				id: 'custpage_action_detail',
				type: serverWidget.FieldType.LONGTEXT,
				label: 'Action Details'
			});
			objActionDetail.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			objActionDetail.defaultValue = getParameter('custscript_ns_cshub_action_details');

			let strHelp = getParameter('custscript_ns_cshub_help');
			let objHelp = objForm.addField({
				id: 'custpage_cshub_help',
				type: serverWidget.FieldType.LONGTEXT,
				label: 'Help'
			});
			objHelp.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			if (strHelp) {
				objHelp.defaultValue = strHelp;
			}


			if (!bIsSupportRep) {
				objTranidFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
				objOtherRefNum.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
			}
			if (intTranID) {
				let objHeaderDefault = getTranIDInfo(intTranID);
				// objTranidFld.defaultValue = objHeaderDefault.strTranID;
				objTranidFld.defaultValue = intTranID;
				objOtherRefNum.defaultValue = objHeaderDefault.strBRHNumber;
				// objOtherRefNum.defaultValue = intTranID;
				objTranID.defaultValue = intTranID;
				objCustID.defaultValue = objHeaderDefault.intCustID;
				objCustName.defaultValue = objHeaderDefault.strCustName;
				objCustEmail.defaultValue = objHeaderDefault.strCustEmail;
				objTranDate.defaultValue = objHeaderDefault.dtTrandate;
				objTransactionName.defaultValue = objHeaderDefault.strTranID;
			}

			addParamFields(objForm);
		};

		const addAppeasementFields = (objForm, caseAction, fltAppeasementAmt, intCaseType) => {
			let objAppeasement = objForm.addField({
				id: 'custpage_appeasement_amount',
				type: serverWidget.FieldType.CURRENCY,
				label: 'Appeasement Amount'
			});

			let objItem = objForm.addField({
				id: 'custpage_item_header',
				type: serverWidget.FieldType.SELECT,
				label: 'Item'
			});

			let objQuantity = objForm.addField({
				id: 'custpage_quantity_header',
				type: serverWidget.FieldType.FLOAT,
				label: 'Quantity to Service'
			});

			let objReason = objForm.addField({
				id: 'custpage_reason_header',
				type: serverWidget.FieldType.SELECT,
				// source: 'customrecord_cshub_returnreasons',
				label: 'Reason for Service'
			});

			let objLocation = objForm.addField({
				id: 'custpage_location_header',
				type: serverWidget.FieldType.SELECT,
				source: 'location',
				label: 'Receipt Location'
			});
			objLocation.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			if (!getCaseActionDetail().amtInput) {
				objAppeasement.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				objItem.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				objQuantity.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
				objReason.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			} else {
				addAppeasementItems(objItem);
				objItem.defaultValue = getCaseActionDetail().appeasementType;
				objLocation.defaultValue = getParameter('custscript_ns_default_receipt_location');

				objQuantity.defaultValue = 1;
				objQuantity.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
				filterReasonForServiceField(objReason, intCaseType);
				if (parseInt(getCaseActionDetail().renderType) !== objRenderType.flat) {
					objReason.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				}
				objReason.defaultValue = getCaseActionDetail().returnReason;
				objItem.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				objAppeasement.defaultValue = 0.00;

			}
			if (fltAppeasementAmt) {
				objAppeasement.defaultValue = parseFloat(fltAppeasementAmt);
			}

		};

		const filterReasonForServiceField = (objReason, intCaseType) => {
			strTitle = 'intReturnReason';
			log.debug(strTitle, intCaseType);
			let objReturnReason = search.load({id: 'customsearch_cshub_sl_scnd_rtrn_rsn'}); //temp hard-coded
			if (parseInt(getCaseActionDetail().renderType) === objRenderType.flat) {
				objReturnReason.filters.push(
					search.createFilter({
						name: 'custrecord_cshub_reason_casetype',
						operator: search.Operator.ANYOF,
						values: intCaseType
					})
				);
			}
			var searchResultCount = objReturnReason.runPaged().count;
			log.debug("customrecord_cshub_returnreasonsSearchObj result count", searchResultCount);

			objReturnReason.run().each(function (result) {
				// .run().each has a limit of 4,000 results
				objReason.addSelectOption({
					value: result.id,
					text: result.getValue('name')
				});
				return true;
			});
		};

		const addAppeasementItems = (objItem) => {
			let intSearch = getParameter('custscript_cs_hub_appeasement_item');

			let objSearchAppeasementItem = search.load(intSearch);

			objSearchAppeasementItem.run().each(function (result) {
				objItem.addSelectOption({
					value: parseInt(result.id),
					text: result.getValue('itemid')
				});
				return true;
			});
		};

		const getParameter = (id) => {
			return runtime.getCurrentScript().getParameter(id);
		};

		const getCaseActionDetail = () => {
			let intCaseType = getParameter('custscript_nscs_cshub_casetype');
			let objEnableInpt = search.lookupFields({
				type: 'customrecord_cshub_caseactions',
				id: parseInt(intCaseType),
				columns: ['custrecord_cshub_caseactn_enbl_qty_inpt', 'custrecord_cshub_caseactn_render_type', 'custrecord_cshub_caseactn_rtn_rsn', 'custrecord_cshub_caseactn_apps_type', 'custrecord_cshub_caseactn_dsbl_qty_inpt', 'custrecord_cshcd_caseactions_step_parent']
			});

			return {
				amtInput: objEnableInpt.custrecord_cshub_caseactn_enbl_qty_inpt,
				caseType: parseInt(intCaseType),
				renderType: objEnableInpt.custrecord_cshub_caseactn_render_type[0] ? parseInt(objEnableInpt.custrecord_cshub_caseactn_render_type[0].value) : null,
				returnReason: objEnableInpt.custrecord_cshub_caseactn_rtn_rsn[0] ? parseInt(objEnableInpt.custrecord_cshub_caseactn_rtn_rsn[0].value) : null,
				appeasementType: objEnableInpt.custrecord_cshub_caseactn_apps_type[0] ? parseInt(objEnableInpt.custrecord_cshub_caseactn_apps_type[0].value) : null,
				qtyInput: objEnableInpt.custrecord_cshub_caseactn_dsbl_qty_inpt,
				associatedStep: objEnableInpt.custrecord_cshcd_caseactions_step_parent
			};
		};

		const validateSupportRep = (intCurrentUser) => {
			strTitle = "validateSupportRep";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let objSupportRepSearch = search.lookupFields({
				type: search.Type.EMPLOYEE,
				id: parseInt(intCurrentUser),
				columns: 'issupportrep'
			});
			log.debug(strTitle, 'isSupportRep? ' + objSupportRepSearch.issupportrep);
			return objSupportRepSearch.issupportrep;
		};

		const validateRefund = (intCaseType) => {
			strTitle = "validateRefund";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let objDisableQTYInpt = search.lookupFields({
				type: 'customrecord_cshub_caseactions',
				id: parseInt(intCaseType),
				columns: 'custrecord_cshub_caseactn_donot_refund'
			});
			log.debug(strTitle, 'objDisableQTYInpt? ' + objDisableQTYInpt.custrecord_cshub_caseactn_donot_refund);
			if (objDisableQTYInpt.custrecord_cshub_caseactn_donot_refund) {
				return 'T';
			} else {
				return 'F';
			}

		};

		const validateQTYDisable = (intCaseType) => {
			strTitle = "validateQTYDisable";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let objDisableQTYInpt = search.lookupFields({
				type: 'customrecord_cshub_caseactions',
				id: parseInt(intCaseType),
				columns: 'custrecord_cshub_caseactn_dsbl_qty_inpt'
			});
			log.debug(strTitle, 'objDisableQTYInpt? ' + objDisableQTYInpt.custrecord_cshub_caseactn_dsbl_qty_inpt);
			if (objDisableQTYInpt.custrecord_cshub_caseactn_dsbl_qty_inpt) {
				return 'T';
			} else {
				return 'F';
			}

		};

		const addParamFields = (objForm) => {
			strTitle = "addParamFields";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			//getting script details
			let strScriptID = runtime.getCurrentScript().id;
			let strScriptDeployment = runtime.getCurrentScript().deploymentId;
			let strError1 = getParameter('custscript_nscs_cshub_pre_sbmt_vldtn_1');
			let strError2 = getParameter('custscript_nscs_cshub_pre_sbmt_vldtn_2');
			let strErrorTrnsctn = getParameter('custscript_nscs_cshub_no_trsctn_error');
			let strStandbyMsg = getParameter('custscript_nscs_cshub_stale_standby_msg');
			let strBRHNumSearch = getParameter('custscript_ns_cshub_brh_number_search');
			let strSearch3 = getParameter('custscript_ns_transaction_search_3');
			let strSearch1 = getParameter('custscript_ns_transaction_search_1');

			let objSearch1 = objForm.addField({
				id: 'custpage_tran_search_1',
				type: serverWidget.FieldType.TEXT,
				label: 'BRH Number Search'
			});
			objSearch1.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objSearch1.defaultValue = strSearch1;

			let objSearch3 = objForm.addField({
				id: 'custpage_tran_search_3',
				type: serverWidget.FieldType.TEXT,
				label: 'BRH Number Search'
			});
			objSearch3.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objSearch3.defaultValue = strSearch3;

			let objBRHNumSearch = objForm.addField({
				id: 'custpage_brh_num_search',
				type: serverWidget.FieldType.TEXT,
				label: 'BRH Number Search'
			});
			objBRHNumSearch.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objBRHNumSearch.defaultValue = strBRHNumSearch;

			let objScriptID = objForm.addField({
				id: 'custpage_script_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objScriptID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objScriptID.defaultValue = strScriptID;

			let objDeploymentID = objForm.addField({
				id: 'custpage_deployment_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objDeploymentID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objDeploymentID.defaultValue = strScriptDeployment;

			let objError1 = objForm.addField({
				id: 'custpage_error_1',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objError1.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objError1.defaultValue = strError1;

			let objError2 = objForm.addField({
				id: 'custpage_error_2',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objError2.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objError2.defaultValue = strError2;

			let objTranError = objForm.addField({
				id: 'custpage_tran_error',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objTranError.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objTranError.defaultValue = strErrorTrnsctn;

			let objStandbyMsg = objForm.addField({
				id: 'custpage_standby_msg',
				type: serverWidget.FieldType.TEXT,
				label: 'Script ID'
			});
			objStandbyMsg.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
			objStandbyMsg.defaultValue = strStandbyMsg;

		};

		const getTranIDInfo = (intTransactionID) => {
			strTitle = "getTranIDInfo";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let objHeaderFields = search.lookupFields({
				type: search.Type.TRANSACTION,
				id: parseInt(intTransactionID),
				columns: ['otherrefnum', 'entity', 'trandate', 'tranid']
			});

			log.debug('objHeaderFields', objHeaderFields);
			let strBRHNumber = '';
			if (objHeaderFields.otherrefnum) {
				strBRHNumber = objHeaderFields.otherrefnum;
			}
			let intCustID = objHeaderFields.entity[0].value;
			let strCustName = objHeaderFields.entity[0].text;
			let dtTrandate = objHeaderFields.trandate;
			let strTranID = objHeaderFields.tranid;

			let objCustomer = search.lookupFields({
				type: search.Type.CUSTOMER,
				id: parseInt(intCustID),
				columns: ['email']
			});
			let strCustEmail = objCustomer.email;

			log.debug('objHeaderFields', 'intCustID: ' + intCustID + ' | strCustName:' + strCustName + ' | dtTrandate:' + dtTrandate + ' | strCustEmail:' + strCustEmail + ' | strTranID:' + strTranID);

			if (!strBRHNumber) {
				strBRHNumber = '';
			}
			if (!intCustID) {
				intCustID = '';
			}
			if (!strCustName) {
				strCustName = '';
			}
			if (!strCustEmail) {
				strCustEmail = '';
			}
			return {
				strBRHNumber: strBRHNumber,
				intCustID: intCustID,
				strCustName: strCustName,
				strCustEmail: strCustEmail,
				dtTrandate: dtTrandate,
				strTranID: strTranID
			};
		};

		const addSublistFields = (objForm, intTranID, bMRComplete) => {
			strTitle = "addSublistFields";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');

			// Results grid
			let objSublist = objForm.addSublist({
				id: 'custpage_results_sublist',
				type: serverWidget.SublistType.LIST,
				// type: serverWidget.SublistType.INLINEEDITOR,
				label: 'Details'
			});

			objSublist.addField({
				id: 'custpage_item_name',
				type: serverWidget.FieldType.TEXT,
				label: 'Item'
			});

			let objItemID = objSublist.addField({
				id: 'custpage_item_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Item ID'
			});
			objItemID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			objSublist.addField({
				id: 'custpage_description',
				type: serverWidget.FieldType.TEXT,
				label: 'Description'
			});

			objSublist.addField({
				id: 'custpage_item_attribute',
				type: serverWidget.FieldType.TEXT,
				label: 'Item Attributes'
			});

			let objTranlineID = objSublist.addField({
				id: 'custpage_tranline_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Tran Line ID'
			});
			objTranlineID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			objSublist.addField({
				id: 'custpage_quantity_ordered',
				type: serverWidget.FieldType.INTEGER,
				label: 'Original Quantity'
			});

			objSublist.addField({
				id: 'custpage_service_avl_qty',
				type: serverWidget.FieldType.INTEGER,
				label: 'Quantity Available for Servicing'
			});

			let objQTYSrvcFld = objSublist.addField({
				id: 'custpage_serviceable_qty',
				type: serverWidget.FieldType.INTEGER,
				label: 'Quantity to Service'
			});
			objQTYSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});

			let objReasonSrvcFld = objSublist.addField({
				id: 'custpage_reason_service',
				type: serverWidget.FieldType.SELECT,
				source: 'customrecord_cshub_returnreasons',
				label: 'Reason for Service'
			});
			objReasonSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});

			let objReasonCodeID = objSublist.addField({
				id: 'custpage_reason_id',
				type: serverWidget.FieldType.TEXT,
				label: 'Reason Code ID'
			});
			objReasonCodeID.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			objSublist.addField({
				id: 'custpage_validations',
				type: serverWidget.FieldType.TEXT,
				label: 'Validations'
			});

			let objProcessMR = objForm.addField({
				id: 'custpage_mr_process_check',
				type: serverWidget.FieldType.CHECKBOX,
				label: 'Process MR'
			});
			objProcessMR.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			let objMRScriptDone = objForm.addField({
				id: 'custpage_mr_process_done',
				type: serverWidget.FieldType.CHECKBOX,
				label: 'MR Process Done'
			});
			objMRScriptDone.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			let objMRScriptProcessing = objForm.addField({
				id: 'custpage_mr_processing',
				type: serverWidget.FieldType.CHECKBOX,
				label: 'MR Processing'
			});
			objMRScriptProcessing.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			let objReceiptLoc = objSublist.addField({
				id: 'custpage_receipt_loc',
				source: 'location',
				type: serverWidget.FieldType.SELECT,
				label: 'Receipt Location'
			});
			objReceiptLoc.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

			if (bMRComplete == 1) {
				objProcessMR.defaultValue = 'T';
			} else if (bMRComplete == 2) {
				objMRScriptDone.defaultValue = 'T';
			} else if (bMRComplete == 3) {
				objMRScriptProcessing.defaultValue = 'T';
			} else if (intTranID) {
				let objSearch1 = cshub.general.getRSQStaleData(intTranID);//runTransactionSearches(intTranID, 'custscript_ns_transaction_search_1')
				//GGNS 2025-07-08 added isEmpty check
				if (!isEmpty(objSearch1)) {
					log.debug('objSearch1.results.length', objSearch1.results.length);
					//GGNS 2025-07-08 updated parseInt to look at results.length
					//if (parseInt(objSearch1) > 0) {
					if (parseInt(objSearch1.results.length) > 0) {
						objProcessMR.defaultValue = 'T';
						//GGNS 2025-07-08 uncommented runMapReduce
						runMapReduce(intTranID, objForm);
					} else {
						let objSearch2 = runTransactionSearches(intTranID, 'custscript_ns_transaction_search_2');
						if (objSearch2) {
							let objSublistValues = getSublistValues(objForm, objSearch2);
							populateSublist(objSublist, objQTYSrvcFld, objReasonSrvcFld, objSublistValues);
						} else {
							let strNoResultMsg = getParameter('custscript_ns_cshub_main_no_result_msg');
							objForm.addPageInitMessage({
								title: "No Results",
								message: strNoResultMsg ? strNoResultMsg : "No result found under this criteria.",
								type: message.Type.WARNING
							});
						}
					}
				} else {
                    //GGNS 2025-07-08 added else block to catch any execution that falls through
                    log.debug('objSearch1_else', 'objSearch1 is empty');
                    //GGNS 2025-07-08 copied code from above
                    let objSearch2 = runTransactionSearches(intTranID, 'custscript_ns_transaction_search_2');
                    if (objSearch2) {
                        let objSublistValues = getSublistValues(objForm, objSearch2);
                        populateSublist(objSublist, objQTYSrvcFld, objReasonSrvcFld, objSublistValues);
                    } else {
                        let strNoResultMsg = getParameter('custscript_ns_cshub_main_no_result_msg');
                        objForm.addPageInitMessage({
                            title: "No Results",
                            message: strNoResultMsg ? strNoResultMsg : "No result found under this criteria.",
                            type: message.Type.WARNING
                        });
                    }
				}
			}
		};

		const runTransactionSearches = (intTranID, strSearchParam) => {
			strTitle = "runTransactionSearches " + strSearchParam;
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let strSearchID = getParameter(strSearchParam);
			let objTrnsctnSearch = search.load(strSearchID);
			objTrnsctnSearch.filters.push(
				search.createFilter({
					name: "internalid",
					operator: search.Operator.ANYOF,
					values: intTranID
				})
			);

			let intResultCount = objTrnsctnSearch.runPaged().count;
			log.debug(strTitle + ' intResultCount', intResultCount);
			if (intResultCount > 0) {
				let objResult = objTrnsctnSearch.run().getRange({
					start: 0,
					end: 999
				});
				return objResult;
			} else {
				return false;
			}
		};

		const populateSublist = (objSublist, objQTYSrvcFld, objReasonSrvcFld, objSublistValues) => {
			strTitle = "populateSublist";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let intCaseType = getParameter('custscript_nscs_cshub_casetype');
			log.debug(strTitle, 'intCaseType: ' + validateQTYDisable(intCaseType));

			if (validateQTYDisable(intCaseType) === 'T') {
				objQTYSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
			}
			log.debug(strTitle + ' objSublistValues', objSublistValues);

			for (let i = 0; objSublistValues.length > i; i++) {
				let intItem = objSublistValues[i].intItem;
				let strItem = objSublistValues[i].strItem;
				let strDescription = objSublistValues[i].strDescription;
				let strItemAttribute = objSublistValues[i].strItemAttribute;
				let strTranLine = objSublistValues[i].strTranLine;
				let intOrigQTY = objSublistValues[i].intOrigQTY;
				let intQTYSrvcbl = objSublistValues[i].intQTYSrvcbl;
				let intQTYtoSrvc = objSublistValues[i].intQTYtoSrvc;
				let intReasonCode = objSublistValues[i].intReasonCode;
				let strValidation = objSublistValues[i].strValidation;
				let intReceiptLoc = objSublistValues[i].intReceiptLoc;
				log.debug(strTitle + ' result', 'intItem: ' + intItem + ' | strItem: ' + strItem + ' | strDescription: ' + strDescription + ' | strItemAttribute: ' + strItemAttribute + ' | strTranLine: ' + strTranLine + ' | intOrigQTY: ' + intOrigQTY + ' | intQTYSrvcbl: ' + intQTYSrvcbl + ' | intReceiptLoc: ' + intReceiptLoc);

				if (!intItem) {
					log.debug({
						title: strTitle,
						details: '!intItem'
					});
					intItem = '';
				}
				objSublist.setSublistValue({
					id: 'custpage_item_id',
					line: i,
					value: intItem
				});

				if (!strItem) {
					log.debug({
						title: strTitle,
						details: '!strItem'
					});
					strItem = '';
				}
				objSublist.setSublistValue({
					id: 'custpage_item_name',
					line: i,
					value: strItem
				});

				/*if (!strDescription) {
					log.debug({
						title: strTitle,
						details: '!strDescription'
					});
					strDescription = ''
				}*/
				if (isEmpty(strDescription)) {
					log.debug({
						title: strTitle,
						details: 'strDescription Empty'
					});
					strDescription = null;
				}
				objSublist.setSublistValue({
					id: 'custpage_description',
					line: i,
					value: strDescription
				});

				if (strItemAttribute) {
					objSublist.setSublistValue({
						id: 'custpage_item_attribute',
						line: i,
						value: strItemAttribute
					});
				}


				if (intReceiptLoc) {
					objSublist.setSublistValue({
						id: 'custpage_receipt_loc',
						line: i,
						value: parseInt(intReceiptLoc)
					});
					log.audit('SET RECEIPT LOCATION', intReceiptLoc);
				}


				if (strTranLine) {
					objSublist.setSublistValue({
						id: 'custpage_tranline_id',
						line: i,
						value: strTranLine
					});
				}


				if (!intOrigQTY) {
					log.debug({
						title: strTitle,
						details: '!intOrigQTY'
					});
					intOrigQTY = 0;
				}
				objSublist.setSublistValue({
					id: 'custpage_quantity_ordered',
					line: i,
					value: parseInt(intOrigQTY)
				});

				if (!intQTYSrvcbl) {
					log.debug({
						title: strTitle,
						details: '!intQTYSrvcbl'
					});
					intQTYSrvcbl = 0;
				}
				objSublist.setSublistValue({
					id: 'custpage_service_avl_qty',
					line: i,
					value: parseInt(intQTYSrvcbl)
				});

				if (validateQTYDisable(intCaseType) === 'T') {
					objSublist.setSublistValue({
						id: 'custpage_serviceable_qty',
						line: i,
						value: parseInt(intQTYSrvcbl)
					});
				}

				// if (!intQTYtoSrvc) {
				//     intQTYtoSrvc = 0
				// }
				// objSublist.setSublistValue({
				//     id: 'custpage_serviceable_qty',
				//     line: i,
				//     value: intQTYtoSrvc
				// });
				//
				// if (!intReasonCode) {
				//     intReasonCode = null
				// }
				// objSublist.setSublistValue({
				//     id: 'custpage_reason_service',
				//     line: i,
				//     value: intReasonCode
				// });
				//
				//
				// if (!strValidation) {
				//     strValidation = null
				// }
				// objSublist.setSublistValue({
				//     id: 'custpage_validations',
				//     line: i,
				//     value: strValidation
				// });

				// if (parseInt(intQTYSrvcbl) <= 0) {
				//     log.audit('----FIELD DISABLED---',typeof  intQTYSrvcbl )
				//     objQTYSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				//     objReasonSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				// }
				// else{
				//     log.audit('----FIELD ENABLED---',intQTYSrvcbl )
				//     objQTYSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
				//     objReasonSrvcFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
				// }
			}
		};

		const getSublistValues = (objForm, result) => {
			strTitle = "getSublistValues";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			log.debug(strTitle + ' result', result);
			if (result.length == 0) {
				let strNoResultMsg = getParameter('custscript_ns_cshub_main_no_result_msg');
				objForm.addPageInitMessage({
					title: "No Results",
					message: strNoResultMsg ? strNoResultMsg : "No result found under this criteria.",
					type: message.Type.WARNING
				});
			} else {
				let objSublistValues = [];
				for (let i = 0; i < result.length; i++) {
					let strItem = result[i].getText('item');
					let intItem = parseInt(result[i].getValue('item'));
					if (intItem) {
						let strDescription = result[i].getValue({
							name: 'displayname',
							join: 'item'
						});
						// result.getValue(result.columns[2])
						let strItemAttribute = result[i].getValue('formulatext');
						let intReceiptLoc = parseInt(result[i].getValue({
							name: 'custrecord_br_intrns_loc',
							join: 'location'
						}));

						intReceiptLoc = intReceiptLoc ? intReceiptLoc : parseInt(result[i].getValue({
							name: 'location'
						}));

						//otherrefnum
						let strEtailID = getParameter('custscript_ns_cs_hub_etail_field_id_sl');
						log.audit('Etail Param Value:', strEtailID);
						let strTranLine = result[i].getValue(strEtailID);
						//custcol_br_associated_etail_id
						let intOrigQTY = parseInt(result[i].getValue('quantity'));
						let intQTYSrvcbl = parseInt(result[i].getValue('custcol_cshub_srvcbl_qty'));

						objSublistValues.push({
							'intItem': intItem,
							'strItem': strItem,
							'strDescription': strDescription,
							'strItemAttribute': strItemAttribute,
							'strTranLine': strTranLine,
							'intOrigQTY': intOrigQTY,
							'intQTYSrvcbl': intQTYSrvcbl,
							'intQTYtoSrvc': null,
							'intReasonCode': null,
							'strValidation': null,
							'intReceiptLoc': intReceiptLoc
						});
					}
				}
				return objSublistValues;
			}

		};


		const post = (request) => {
			strTitle = 'post';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let strScriptID = runtime.getCurrentScript().id;
			let strScriptDeployment = runtime.getCurrentScript().deploymentId;

			let intTranID = request.parameters.custpage_tran_id;
			let intCustID = request.parameters.custpage_customer_id;
			let bMRProcessDone = request.parameters.custpage_mr_process_done;
			let intCurrentUser = request.parameters.custpage_current_user;
			let strTranText = request.parameters.custpage_tran_text;
			let strCustName = request.parameters.custpage_customer_name;

			let objCaseDetails = getRecordDetails(request, intTranID, bMRProcessDone);
			log.debug(strTitle + ' objCaseDetails', objCaseDetails);

			let strRecID = createTaskRecord(intTranID, intCustID, objCaseDetails, intCurrentUser, strTranText, strCustName);
			// lockRecord(intTranID)
			log.audit('CREATED CASE', strRecID);
			// casenumber
			let strCaseNum = getCaseNumber(strRecID.id);

			redirect.toSuitelet({
				scriptId: strScriptID,
				deploymentId: strScriptDeployment,
				parameters: {
					'custparam_from_post': 1,
					'custparam_rec_case_id': strCaseNum
				}
			});

		};

		const getCaseNumber = (intCaseID) => {
			strTitle = 'getCaseNumber';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let objCaseNum = search.lookupFields({
				type: search.Type.SUPPORT_CASE,
				id: parseInt(intCaseID),
				columns: 'casenumber'
			});

			return objCaseNum.casenumber;
		};

		const getRecordDetails = (request, intTranID, bMRProcessDone) => {
			strTitle = 'getRecordDetails';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let intSublistCount = request.getLineCount({
				group: "custpage_results_sublist"
			});

			let fltAppeasementAmt = request.parameters.custpage_appeasement_amount;
			let strProcessRfnd = request.parameters.custpage_refund_needed;


			let objFullDetail = [];
			let objRSQDetail = [];
			let objCaseDetail = getCaseActionDetail();
			log.debug('getCaseActionDetail', objCaseDetail);
			if (!objCaseDetail.amtInput || (parseInt(objCaseDetail.renderType) === objRenderType.hierarchical && !objCaseDetail.qtyInput)) {
				for (let intCounter = 0; intCounter < intSublistCount; intCounter++) {
					let intItem = request.getSublistValue({
						group: "custpage_results_sublist",
						line: intCounter,
						name: "custpage_item_id"
					});

					let strTranline = request.getSublistValue({
						group: "custpage_results_sublist",
						line: intCounter,
						name: "custpage_tranline_id"
					});

					let intQTYSrvc = request.getSublistValue({
						group: "custpage_results_sublist",
						line: intCounter,
						name: "custpage_serviceable_qty"
					});

					let intReasonCode = request.getSublistValue({
						group: "custpage_results_sublist",
						line: intCounter,
						name: "custpage_reason_service"
					});

					let intReceiptLoc = request.getSublistValue({
						group: "custpage_results_sublist",
						line: intCounter,
						name: "custpage_receipt_loc"
					});
					log.audit(' location from post', intReceiptLoc);

					if (!intReceiptLoc) {
						let objLocation = search.lookupFields({
							type: search.Type.TRANSACTION,
							id: intTranID,
							columns: 'location'
						}).location;
						log.debug({objLocation});
						intReceiptLoc = objLocation[0] ? parseInt(objLocation[0].value) : null;
					} else {
						intReceiptLoc = parseInt(intReceiptLoc);
					}

					if (intReasonCode) {
						objFullDetail.push({
							'tranid': intTranID,
							'lineid': strTranline,
							'quantity': intQTYSrvc,
							'returnReason': intReasonCode,
							'itemName': intItem,
							'receiptLocation': intReceiptLoc,
							'processRefund': strProcessRfnd,
							'refAmt': fltAppeasementAmt
						});

						objRSQDetail.push({
							'1': intTranID,
							'2': strTranline,
							'3': intQTYSrvc
						});
					}
				}
			} else {
				const intQTYSrvc = request.parameters.custpage_quantity_header;
				const intReasonCode = request.parameters.custpage_reason_header;
				const intItem = request.parameters.custpage_item_header;
				let intReceiptLoc = request.parameters.custpage_location_header;
				if (!intReceiptLoc) {
					let objLocation = search.lookupFields({
						type: search.Type.TRANSACTION,
						id: intTranID,
						columns: 'location'
					}).location;
					log.debug({objLocation});
					intReceiptLoc = objLocation[0] ? parseInt(objLocation[0].value) : null;
				} else {
					intReceiptLoc = parseInt(intReceiptLoc);
				}
				objFullDetail.push({
					'tranid': intTranID,
					'lineid': `${intTranID}_0`,
					'quantity': intQTYSrvc,
					'returnReason': intReasonCode,
					'itemName': intItem,
					'receiptLocation': intReceiptLoc,
					'processRefund': strProcessRfnd,
					'refAmt': fltAppeasementAmt
				});

				objRSQDetail.push({
					'1': intTranID,
					'2': `${intTranID}_0`,
					'3': intQTYSrvc
				});
			}


			let objCaseDetails = {
				'objFullDetail': objFullDetail,
				'objRSQDetail': objRSQDetail,
				'fltRefAmount': fltAppeasementAmt
			};

			return objCaseDetails;
		};

		const lockRecord = (intTranID) => {
			let strType = getTransactionType(intTranID);
			record.submitFields({
				type: strType,
				id: parseInt(intTranID),
				values: {
					custbody_ns_lock_record: true
				}
			});
		};

		const getTransactionType = (idTransaction) => {
			strTitle = 'getTransactionType';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let strTranType = search.lookupFields({
				id: idTransaction,
				type: search.Type.TRANSACTION,
				columns: ['type']
			}).type[0].text;
			log.debug(strTitle + ' strType:', strTranType);
			return strTranType.toLowerCase().replace(/\s/g, '');
		};

		const createTaskRecord = (intTranID, intCustID, objCaseDetails, intCurrentUser, strTranText, strCustName) => {
			strTitle = 'createTaskRecord';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let intCaseType = getParameter('custscript_nscs_cshub_casetype');
			let objCaseType = search.lookupFields({
				type: "customrecord_cshub_caseactions",
				id: parseInt(intCaseType),
				columns: ['name', 'custrecord_caseaction_defaultstatus']
			});

			let intCSHubStatus = objCaseType.custrecord_caseaction_defaultstatus[0];
			intCSHubStatus = intCSHubStatus ? intCSHubStatus.value : false;

			let strSubject = strCustName + ', ' + objCaseType.name + ', ' + strTranText;

			let recCase = record.create({
				type: record.Type.SUPPORT_CASE,
				isDynamic: true
			});

			recCase.setValue({
				fieldId: 'assigned',
				value: parseInt(intCurrentUser)
			});

			recCase.setValue({
				fieldId: 'company',
				value: parseInt(intCustID)
			});

			recCase.setValue({
				fieldId: 'custevent_cshub_case_type',
				value: parseInt(intCaseType)
			});

			let intStatus = getParameter('custscript_cshub_sl_sec_casestatusnative');
			if (intStatus) {
				recCase.setValue({
					fieldId: 'status',
					value: intStatus
				});
			}

			if (intCSHubStatus) {
				recCase.setValue({
					fieldId: 'custevent_cshub_casesubstatus',
					value: parseInt(intCSHubStatus)
				});
			}

			recCase.setValue({
				fieldId: 'custevent_cshub_appeasementamount',
				value: objCaseDetails.fltRefAmount !== "" && objCaseDetails.fltRefAmount !== 0 ? parseFloat(objCaseDetails.fltRefAmount) : 0.00
			});


			recCase.setValue({
				fieldId: 'custevent_cshub_case_tran',
				value: parseInt(intTranID)
			});

			recCase.setValue({
				fieldId: 'title',
				value: strSubject
			});

			recCase.setValue({
				fieldId: 'custevent_cshub_casedtls_scrpt_use',
				value: JSON.stringify(objCaseDetails.objFullDetail)
			});

			recCase.setValue({
				fieldId: 'custevent_cshub_casedtls_rsq',
				value: JSON.stringify(objCaseDetails.objRSQDetail)
			});


			recCase.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			});
			log.audit('Case Record Created', recCase);
			return recCase;

		};

		const runMapReduce = (intTranID) => {
			strTitle = "runMapReduce";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let strScriptID = runtime.getCurrentScript().id;
			let strScriptDeployment = runtime.getCurrentScript().deploymentId;
			// MR Script
			let taskMapReduce = task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: getParameter('custscript_cshub_sl_sec_rsqmrscript'),
				// deploymentId: getParameter('custscript_cshub_sl_sec_rsqmrdeployment'),
				params: {
					custscript_ns_cs_hub_rsq_transaction_id: intTranID
				}
			});
			taskMapReduce.submit();

			wait(15);
			let bRunSearch = runTransactionSearches(intTranID, 'custscript_ns_transaction_search_3');
			log.debug(strTitle + ' bRunSearch :', bRunSearch);

			while (bRunSearch) {
				wait(15);
				log.debug('**********SEARCH RUNNING********');
				bRunSearch = runTransactionSearches(intTranID, 'custscript_ns_transaction_search_3');
			}
			redirect.toSuitelet({
				scriptId: strScriptID,
				deploymentId: strScriptDeployment,
				parameters: {
					custscript_mr_complete: 2,
					custscript_intTranID: intTranID
				}
			});
			return bRunSearch;
		};

		const wait = (sec) => {
			strTitle = 'wait';
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');

			// start of timer
			let now = new Date().getSeconds();
			let want = new Date().getSeconds() + parseInt(sec);

			if (want >= 60) {
				want = want - 60;

			}
			while (now != want) {
				now = new Date().getSeconds();
			}
			log.debug('Current Process END', '--------- ' + strTitle + ' ---------');
		};

		const getRSQStaleData = (intID) => {
			strTitle = "getRSQStaleData ";
			log.debug('Current Process', '--------- ' + strTitle + ' ---------');
			let sql = `
                SELECT tran.id                                as "Internal ID",
                       tran.tranid                            as "Document Number",
                       tran.custbody_cshub_srvc_qty_timestamp as "CSHUB RSQ Timestamp",
                       tran.lastModifiedDate                  as "Transaction Last Modified",
                       casRecord.id                           as "CSHUB CAS ID",
                       casRecord.lastmodified                 as "CSHUB CAS Last Modified",
                       (CASE
                            WHEN tran.custbody_cshub_srvc_qty_timestamp < casRecord.lastmodified THEN 1
                            ELSE 0 END)                       as "Compare"

                FROM Transaction as tran

                         INNER JOIN
                     TransactionLine as tranline ON tranline.transaction = tran.id

                         INNER JOIN
                     CUSTOMRECORD_CSHUB_CASEACTIONSTEP as casRecord
                     ON casRecord.custrecord_cshub_casestep_prnt_tran = tran.id

                WHERE tranline.mainline = 'T'
                  AND (CASE WHEN tran.custbody_cshub_srvc_qty_timestamp < casRecord.lastmodified THEN 1 ELSE 0 END) = 1
                  AND casRecord.custrecord_cshcd_csactn_stp_prnt_cs_typ IS NOT null
                  AND casRecord.custrecord_cshcd_csactn_stp_prnt_cs_typ NOT IN
                      ('18', '118', '119', '120', '19', '218', '322', '323', '719', '718', '618', '619', '620')
                  AND tran.id = ? `;
			let resultSet = query.runSuiteQL({query: sql, params: [intID]});
			let results = resultSet.results;
			let intResultLength = results.length;
			log.debug('RSQ intResultLength', intResultLength);
			// for (let i = results.length - 1; i >= 0; i--)
			//     log.debug(results[i].values);
			//
			// let resultsObj = resultSet.asMappedResults();
			// log.debug("Mapped Results",resultsObj);
			return intResultLength;
		};

		return {
			onRequest: onRequest
		};
	}
);