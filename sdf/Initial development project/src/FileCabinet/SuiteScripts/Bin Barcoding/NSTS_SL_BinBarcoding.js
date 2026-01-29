/**
 * Copyright (c) 1998-2025 NetSuite, Inc. 2955 Campus Drive, Suite 100, San
 * Mateo, CA, USA 94403-2511 All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite,
 * Inc. ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with NetSuite.
 *
 * Version          Date       	     Author                    Remarks
 * 1.0              2025 Apr 15      Manuel Teodoro            Initial commit
 *
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define( //using require instead for better module loading especially for the have dependencies.
	function (require) {
		//Custom modules
		let nsutil = require('../Library/NSUtilvSS2.js');
		let scriptutil = require('./NSTS_MD_CommonLibrary');

		//Native modules
		let http = require('N/http');
		let redirect = require('N/redirect');
		let runtime = require('N/runtime');
		let search = require('N/search');
		let ui = require('N/ui/serverWidget');
		let url = require('N/url');
		let task = require('N/task');
		let error = require('N/error');
		let record = require('N/record');

		//Script parameter definition
		//Usage: PARAM_DEF = {parameter1:{id:'custcript_etc', optional:true}}
		var PARAM_DEF = {
			lbl_title: {
				id: 'bin_suitelettitle',
				optional: false
			},
			lbl_sublist: {
				id: 'bin_lbl_sublist',
				optional: false
			},
			btn_search: {
				id: 'bin_search_btn',
				optional: false
			},
			srch_bin: {
				id: 'bin_search',
				optional: false
			},
			clientscript: {
				id: 'bin_clientscript',
				optional: false
			},
			mrscript: {
				id: 'bin_mrscript',
				optional: false
			},
		};

		var EntryPoint = (typeof EntryPoint === 'undefined') ? {} : EntryPoint;

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		EntryPoint.onRequest = function (context)
		{
			let stLogTitle = 'onRequest';
			log.debug(stLogTitle, '**** START: Entry Point Invocation ****');

			try
			{
				let blWareHouseMgtFeature = runtime.isFeatureInEffect({
					feature: 'WMSSYSTEM'
				});
				log.debug(stLogTitle, 'blWareHouseMgtFeature:'+blWareHouseMgtFeature)

				let paramsScript = scriptutil.getParameters(PARAM_DEF,true);
				let paramsHttp = context.request.parameters;
				log.audit(stLogTitle, 'paramsScript: ' + JSON.stringify(paramsScript) + ' | paramsHttp: ' + JSON.stringify(paramsHttp));

				//Combine parameters
				let params = {};
				ctrller.mergeParams(params, paramsScript);
				ctrller.mergeParams(params, paramsHttp);
				paramsScript.script = paramsHttp.script;
				paramsScript.deploy = paramsHttp.deploy;
				log.audit(stLogTitle, 'params: ' + JSON.stringify(params));

				if (context.request.method === http.Method.GET)
					ctrller.methodGet(context.request, context.response, params);
				if (context.request.method === http.Method.POST)
					ctrller.methodPost(context.request, context.response, params);

				log.audit(stLogTitle, 'Remaining Units: ' + runtime.getCurrentScript().getRemainingUsage());

			} catch (e) {
				log.error(stLogTitle, JSON.stringify(e));
				throw e.message;
			}
			log.audit(stLogTitle, '**** END: Entry Point Invocation **** | Remaining Units : ' + runtime.getCurrentScript().getRemainingUsage());
		};

		let view = {};

		view.drawFormPage = function(params, stTitle)
		{
			var stLogTitle = "view.drawFormPage";
			log.debug(stLogTitle);

			var objForm = ui.createForm({
				title: stTitle,
				hideNavBar: false
			});
			objForm.clientScriptModulePath = params.clientscript;

			return objForm;
		};

		view.drawHeader = function(params, objForm, stMode)
		{
			var stLogTitle = "view.drawHeader";
			log.debug(stLogTitle,params);

			{
				objField = objForm.addField({
					id: "custpage_mode",
					type: ui.FieldType.TEXT,
					label: "Mode"
				});
				objField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
				objField.updateBreakType({ breakType: ui.FieldBreakType.STARTCOL });
				objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				objField.defaultValue = stMode;

				objField = objForm.addField({
					id: "custpage_error",
					type: ui.FieldType.TEXTAREA,
					label: "Error"
				});
				objField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
				objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });


				var objField = objForm.addField({
					id: 'custpage_inline_script',
					type: ui.FieldType.INLINEHTML,
					label: '&nbsp;',
				});
				objField.updateBreakType({
					breakType: ui.FieldBreakType.STARTCOL
				});
				objField.updateLayoutType({
					layoutType: ui.FieldLayoutType.OUTSIDEABOVE
				});
				objField.defaultValue = '<script>\n' +
					'let addOverlay =' + view.addOverlay.toString() + '\n' +
					'let removeOverlay =' + view.removeOverlay.toString() + '\n' +
					((stMode != 'PROCESS') ? 'addOverlay(\'Loading of page is in progress. Please wait.\');'
						: 'addOverlay(\'Request has been successfully queued. ' +
						'To reduce risk of error, it is recommended to wait for this request ' +
						'to complete before processing a new one.\', \'CONFIRMATION\', \'PROCESS\', \''+params.executionurl+'\');') + '\n' +
					'</script>';
				objField = objForm.addField({
					id: "custpage_params",
					type: ui.FieldType.RICHTEXT,
					label: "Parameters"
				});
				objField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
				objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.defaultValue = JSON.stringify(params);
			}

			//Field Group
			//Add Field Group
			objForm.addFieldGroup({
				id : 'filter',
				label : 'Filter'
			});
			objForm.addFieldGroup({
				id : 'information',
				label : 'List of Bins'
			});

			//Add header fields
			if (params.custpage_mode != 'PROCESS')
			{
				//NUMBER OF LABELS TO CREATE
				objField = objForm.addField({
					id: "custpage_printqty",
					type: ui.FieldType.INTEGER,
					label: "Number of Labels to Create",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.defaultValue = (!nsutil.isEmpty(params.printqty)) ? params.printqty : null;

				//Location
				objField = objForm.addField({
					id: "custpage_location",
					type: ui.FieldType.SELECT,
					source: 'location',
					label: "Location",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.defaultValue = (!nsutil.isEmpty(params.location)) ? params.location : null;

				//Zone
				objField = objForm.addField({
					id: "custpage_zone",
					type: ui.FieldType.SELECT,
					label: "Zone",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				ctrller.setZoneFieldValue(params,objField);
				objField.defaultValue = (!nsutil.isEmpty(params.zone)) ? params.zone : null;

				//SORT BY TYPE
				objField = objForm.addField({
					id: "custpage_sort",
					type: ui.FieldType.SELECT,
					source: 'customlist_ns_bin_sort_by_type',
					label: "Sort by Type",
					container: 'filter'
				});
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.defaultValue = (!nsutil.isEmpty(params.sort)) ? params.sort : null;

				//First Bin
				objField = objForm.addField({
					id: "custpage_firstbin",
					type: ui.FieldType.SELECT,
					// source: 'bin',
					label: "First Bin",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				ctrller.setBinFieldValue(params,objField);
				objField.defaultValue = (!nsutil.isEmpty(params.firstbin)) ? params.firstbin : null;

				//Last Bin
				objField = objForm.addField({
					id: "custpage_lastbin",
					type: ui.FieldType.SELECT,
					// source: 'bin',
					label: "Last Bin",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				ctrller.setBinFieldValue(params,objField,true);
				objField.defaultValue = (!nsutil.isEmpty(params.lastbin)) ? params.lastbin : null;

				//Label Template
				objField = objForm.addField({
					id: "custpage_labeltype",
					type: ui.FieldType.SELECT,
					source: 'customlist_ns_binlbl_file_type',
					label: "Label Type",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				objField.defaultValue = (!nsutil.isEmpty(params.type)) ? params.type : null;

				//Label Template
				objField = objForm.addField({
					id: "custpage_template",
					type: ui.FieldType.SELECT,
					// source: 'customrecord_ns_bin_label_template',
					label: "Label Template",
					container: 'filter'
				});
				objField.isMandatory = true;
				// objField.updateLayoutType({ layoutType: ui.FieldLayoutType.OUTSIDEABOVE });
				// objField.updateBreakType({ breakType: ui.FieldBreakType.STARTROW });
				ctrller.setTemplateFieldValue(params,objField,true);
				objField.defaultValue = (!nsutil.isEmpty(params.template)) ? params.template : null;
			}
		};

		view.drawSublist = function (params, objForm, stMode)
		{
			let stLogTitle = 'view.drawSublist';
			log.debug(stLogTitle);

			view.drawBinSublistData(params, objForm, stMode);
		};

		view.drawBinSublistData = function (params, objForm, stMode)
		{
			var stLogTitle = 'view.drawBinSublistData';
			log.debug(stLogTitle);

			//Add sublist
			var objSublist = objForm.addSublist({
				id: 'tbl_sublist',
				type: ui.SublistType.LIST,
				label: params.lbl_sublist
			});

			if (stMode == 'VIEW')
			{
				// Show a 'Mark All' button
				objSublist.addMarkAllButtons();

				objSublist.addField({
					label: 'Select',
					type: ui.FieldType.CHECKBOX,
					id: 'match',
					display: ui.FieldDisplayType.NORMAL
				});
			}

			let fieldOptions =
				{
					internalid: {
						type: ui.FieldType.TEXT,
						source: null,
						display: ui.FieldDisplayType.HIDDEN
					},
					binnumber: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					location: {
						type: ui.FieldType.SELECT,
						source: 'location',
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_location_code: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_zone: {
						type: ui.FieldType.SELECT,
						source: 'customrecord_ns_bin_zones',
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_zone_code: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_asile_row: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_rack_bay: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_level_shelf: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					},
					custrecord_ns_bin_position: {
						type: ui.FieldType.TEXT,
						display: ui.FieldDisplayType.INLINE
					}
				};
			view.addSublistColumnsFromSearch(objSublist, fieldOptions, params.srch_bin, params);

			ctrller.listBinSublistData(params, objForm, fieldOptions, params.srch_bin, params.mode);

			return objSublist;
		};

		view.addSublistColumnsFromSearch = function(objSublist, fieldOptions, stSearchId, params)
		{
			var stLogTitle = "view.addSublistColumnsFromSearch";
			log.debug(stLogTitle);

			log.debug(stLogTitle, 'params:'+JSON.stringify(params))

			var objSearch = search.load({
				id: stSearchId
			});

			for (var i = 0; i < objSearch.columns.length; i++)
			{
				if (!objSearch.columns[i].name) continue;

				var stKeyColumn = "";
				if (objSearch.columns[i].join) stKeyColumn = objSearch.columns[i].join + "_" + objSearch.columns[i].name;
				else stKeyColumn = objSearch.columns[i].name;
				stKeyColumn = stKeyColumn.toLowerCase().replace('.','_');
				log.debug(stLogTitle, 'stKeyColumn:'+stKeyColumn)

				if (!fieldOptions[stKeyColumn]) continue;

				fieldOptions[stKeyColumn].id = stKeyColumn;
				fieldOptions[stKeyColumn].label = objSearch.columns[i].label;
				//log.debug(stLogTitle, 'fieldOptions[stKeyColumn]:'+JSON.stringify(fieldOptions[stKeyColumn]))

				var objField = objSublist.addField(fieldOptions[stKeyColumn]);
				if (fieldOptions[stKeyColumn].display)
					objField.updateDisplayType({
						displayType: fieldOptions[stKeyColumn].display
					});
			}
		};

		view.drawClosePage = function (params, stTitle, stMessage, stFunction)
		{
			var stLogTitle = 'view.drawClosePage';
			log.debug(stLogTitle);

			var objForm = ui.createForm({
				title: stTitle,
				hideNavBar: false
			});
			objForm.clientScriptModulePath = params.clientscript;

			var objField = objForm.addField({
				id: 'custpage_inline_script',
				type: ui.FieldType.INLINEHTML,
				label: '&nbsp;',
			});
			objField.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
			objField.updateLayoutType({layoutType: ui.FieldLayoutType.OUTSIDEABOVE});
			objField.defaultValue = '<script>\n' +
				'var addOverlay =' + view.addOverlay.toString() + '\n' +
				'var removeOverlay =' + view.removeOverlay.toString() + '\n' +
				('addOverlay(\'' + stMessage + '\', \'ERROR\');') + '\n' +
				'</script>';
			objField.updateDisplayType({displayType: ui.FieldDisplayType.NORMAL});

			objField = objForm.addField({
				id: 'custpage_mode',
				type: ui.FieldType.TEXT,
				label: 'Mode'
			});
			objField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
			objField.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
			objField.updateLayoutType({layoutType: ui.FieldLayoutType.OUTSIDEABOVE});
			objField.defaultValue = 'ERROR';

			objField = objForm.addField({
				id: 'custpage_params',
				type: ui.FieldType.RICHTEXT,
				label: 'Parameters'
			});
			objField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
			objField.updateLayoutType({layoutType: ui.FieldLayoutType.OUTSIDEABOVE});
			objField.updateBreakType({breakType: ui.FieldBreakType.STARTROW});
			objField.defaultValue = JSON.stringify(params);

			objForm.addButton({id: 'custpage_closebtn', label: 'Back', functionName: stFunction});

			return objForm;
		};

		view.addOverlay = function (stMessage, stType, stProcess, url)
		{
			objOverlayMsg = null;
			objProcess = stProcess;
			var strMsgUrl = '';

			if (url)
			{
				strMsgUrl += '<br><br> Click <a href="'+url+'" target="_blank">HERE</a> to view Execution Record status.';
			}

			var objPromise = Promise.resolve();
			objPromise.then(
				function () {
					//Check if NS supports jQuery else use DOM manipulation
					if (typeof this.jQuery !== 'undefined') {
						this.jQuery('body')
							.append(
								'<div id=\'overlay\'><div id=\'textOverlay\'>' + '&nbsp;' + '</div></div>');
						var objElem = this.jQuery('#overlay');
						objElem.css({
							position: 'fixed',
							display: 'block',
							width: '100%',
							height: '100%',
							top: '10px',
							left: 0,
							right: 0,
							bottom: 0,
							'background-color': 'rgba(0,0,0,0.5)',
							'z-index': 500,
							cursor: 'pointer'
						});

						var objElem = this.jQuery('#textOverlay');
						objElem.css({
							position: 'absolute',
							top: '50%',
							left: '50%',
							'font-size': '30px',
							color: 'white',
							transform: 'translate(-50%,-50%)',
							'-ms-transform': 'translate(-50%,-50%)'
						});
					} else {
						var objElemBody = this.document.getElementsByTagName('body');
						objElemBody[0].innerHTML = objElemBody[0].innerHTML + '<div id=\'overlay\'><div id=\'textOverlay\'>' + '&nbsp;' + '</div></div>';

						var stCssText = 'position: fixed;display: block;width: 100%;height: 100%;top: 10px;left: 0;right: 0;bottom: 0;background-color: rgba(0,0,0,0.5);z-index: 500;cursor: pointer;';
						var objElem = this.document.getElementById('overlay');
						objElem.style.cssText = stCssText;

						var stCssText = 'position: absolute; top: 50%; left: 50%; font-size: 50px; color: white; transform: translate(-50%,-50%); -ms-transform: translate(-50%,-50%)';
						var objElem = this.document.getElementById('textOverlay');
						objElem.style.cssText = stCssText;
					}
				}).then(
				function () {
					return new Promise(
						function (resolve, reject) {
							if (stMessage)
								require(['N/ui/message'],
									function (message) {
										//move the focus to the top screen;
										if (typeof this.jQuery !== 'undefined')
											this.jQuery('html, body').animate({
												scrollTop: 0
											}, 'fast');
										else scroll(0, 0);

										//debugger;
										var stMessageType = null;
										if (stType == null || !stType) stType = 'INFORMATION';

										stMessageType = message.Type[stType];
										if (stMessageType == null) stMessageType = message.Type.INFORMATION;

										objOverlayMsg = message.create({
											title: '',
											message: stMessage + strMsgUrl,
											type: stMessageType
										});
										objOverlayMsg.show();
										setTimeout(
											function () {
												resolve();
											}, 3000);
									});
							else resolve();
						});
				});
		};

		view.removeOverlay = function (bDontRemoveOverlayMessage)
		{
			var objPromise = Promise.resolve();
			objPromise.then(
				function () {
					return new Promise(
						function (resolve, reject) {
							require(['N/runtime'],
								function (runtime) {
									setTimeout(
										function () {
											//debugger;
											if (objProcess != 'PROCESS')
											{
												if (objOverlayMsg && !bDontRemoveOverlayMessage) objOverlayMsg.hide();
											}

											//Check if NS supports jQuery else use DOM manipulation
											if (typeof this.jQuery !== 'undefined')
												this.jQuery('#overlay').remove();
											else
												this.document.getElementById('overlay').remove();

											resolve();
										}, 100);
								});
						});
				});
		};


		let ctrller = {};

		ctrller.mergeParams = function (params, paramsHttp)
		{
			var stLogTitle = 'ctrller.mergeParams';
			log.debug(stLogTitle);

			//Combine parameters
			for (var key in paramsHttp)
			{
				params[key] = paramsHttp[key];
			}
			return params;
		};

		ctrller.methodGet = function(objRequest, objResponse, params)
		{
			let stLogTitle = "ctrller.methodGet";
			log.debug(stLogTitle);

			try
			{
				let objForm;
				params.mode = params.mode || params.custpage_mode || "SEARCH";
				log.audit(stLogTitle, "params.mode: " + params.mode);

				if (params.mode == 'SEARCH')
				{
					objForm = view.drawFormPage(params, params.lbl_title);
					view.drawHeader(params, objForm, params.mode);

					//Add buttons
					objForm.addSubmitButton({
						id: 'custpage_search',
						label: params.btn_search
					});

					ctrller.getFormHeaderValues(params, objForm, false);
				}
				else if (params.custpage_mode == 'PROCESS')
				{
					params.mode = params.custpage_mode;
					objForm = view.drawFormPage(params, params.lbl_title);
					view.drawHeader(params, objForm, params.mode);
					ctrller.getFormHeaderValues(params, objForm, true, true);

					//Add buttons
					let stLink = url.resolveScript({
						scriptId: params.script,
						deploymentId: params.deploy,
					});
					objForm.addButton({id: 'custpage_closebtn', label: 'Back', functionName: 'goBack(\'' + stLink + '\')'});
				}
				objResponse.writePage(objForm);
			}
			catch (e)
			{
				var stErrorMsg = (e.message !== undefined) ? e.name + " : " + e.message : e.toString();
				log.error(stLogTitle, stErrorMsg);

				var stLink = url.resolveScript({
					scriptId: params.script,
					deploymentId: params.deploy,
				});
				objResponse.writePage(
					view.drawClosePage(params, params.lbl_title, e.message, 'goBack(\'' + stLink + '\')')
				);
			}
		};

		ctrller.methodPost = function (objRequest, objResponse, params)
		{
			let stLogTitle = 'ctrller.methodPost';
			log.debug(stLogTitle);

			try
			{
				log.audit(stLogTitle, 'params.custpage_mode: ' + params.custpage_mode);

				if (params.custpage_mode == 'VIEW')
				{
					params.mode = params.custpage_mode;
					log.audit(stLogTitle, 'params: ' + JSON.stringify(params));

					//For post, draw first the form and header fields.
					// Then check each parameter correspond to a field in order to get passed values.
					var objForm = view.drawFormPage(params, params.lbl_title);
					view.drawHeader(params, objForm, params.mode);
					ctrller.getFormHeaderValues(params, objForm, true, true);

					view.drawSublist(params, objForm, params.mode);

					//Add buttons
					objForm.addSubmitButton({
						id: 'custpage_generate_label',
						label: 'Generate Labels'
					});

					var stLink = url.resolveScript({
						scriptId: params.script,
						deploymentId: params.deploy
					});
					objForm.addButton({
						id: 'custpage_reset_criteria',
						label: 'Reset Criteria',
						functionName: 'reset(\'' + stLink + '\')'
					});

					objResponse.writePage(objForm);
				}
				else if (params.custpage_mode == 'PROCESS')
				{
					let intLineCount = objRequest.getLineCount({group: 'tbl_sublist'});
					log.debug(stLogTitle, 'intLineCount:'+intLineCount)

					let arrReturn = [];
					for (let i=0; i<intLineCount; i++)
					{
						let stSelect = objRequest.getSublistValue({group: 'tbl_sublist', name: 'match', line: i});
						if (stSelect === false || stSelect == 'F')
						{
							continue;
						}
						let stInternalId = objRequest.getSublistValue({group: 'tbl_sublist', name: 'internalid', line: i});

						arrReturn.push(stInternalId);
					}
					log.debug(stLogTitle, 'arrReturn:'+JSON.stringify(arrReturn));

					//Create Execution Record
					let objExecutionData = {
						'custrecord_bler_date' : new Date(),
						'custrecord_bler_employee' : runtime.getCurrentUser().id,
						'custrecord_bler_status' : 1,
						'custrecord_bler_labels_to_create' : params.custpage_printqty,
						'custrecord_bler_location' : params.custpage_location,
						'custrecord_bler_zone' : params.custpage_zone,
						'custrecord_bler_sort_by_type' : params.custpage_sort,
						'custrecord_bler_first_bin' : params.custpage_firstbin,
						'custrecord_bler_last_bin' : params.custpage_lastbin,
						'custrecord_bler_label_type' : params.custpage_labeltype,
						'custrecord_bler_label_template' : params.custpage_template
					}
					let objExecRecord = record.create({
						type: 'customrecord_ns_bin_label_execution',
						isDynamic: true
					});
					for (let fieldId in objExecutionData)
					{
						objExecRecord.setValue({
							fieldId: fieldId,
							value: objExecutionData[fieldId]
						})
					}
					let intExecId = objExecRecord.save();
					log.audit(stLogTitle, 'Record Created:'+objExecRecord.type+':'+intExecId);

					let strExecUrl = url.resolveRecord({
						recordType: 'customrecord_ns_bin_label_execution',
						recordId: intExecId,
					});


					let options = {
						script: params.mrscript,
						params:
							{
							custscript_mr_bin_execuction_id: intExecId,
							custscript_mr_bin_id: JSON.stringify(arrReturn),
						}
					};
					ctrller.callMRWithDelay(options);

					redirect.toSuitelet({
						scriptId:     params.script,
						deploymentId: params.deploy,
						parameters:   {
							'custpage_mode': params.custpage_mode,
							'executionurl' : strExecUrl
						}
					});
				}
			}
			catch (e)
			{
				log.error(stLogTitle, JSON.stringify(e.message));

				var stLink = url.resolveScript({
					scriptId: params.script,
					deploymentId: params.deploy,
				});
				objResponse.writePage(
					view.drawClosePage(params, params.lbl_title, e.message,
						'goBack(\'' + stLink + '\')')
				);
			}
		}

		ctrller.setZoneFieldValue = function (params, objField)
		{
			var stLogTitle = 'ctrller.setZoneFieldValue';
			log.debug(stLogTitle);

			let intLocation = params.location || params.custpage_location;

			objField.addSelectOption({
				value: '',
				text: '- Select -'
			});

			if (!nsutil.isEmpty(intLocation))
			{
				let objSearchResult = search.create({
					type: "customrecord_ns_bin_zones",
					filters:
						[
							["custrecord_binzone_location", "anyof", intLocation]
						],
					columns:
						[
							search.createColumn({name: "name", label: "Name"}),
						]
				});
				objSearchResult.run().each(function (result) {
					var stId = result.id;
					var stName = result.getValue({ name: "name"});

					objField.addSelectOption({
						value: stId,
						text: stName
					});

					return true;
				});
			}
		}

		ctrller.setBinFieldValue = function (params, objField, isLastBin)
		{
			var stLogTitle = 'ctrller.setBinFieldValue';
			log.debug(stLogTitle);

			let intLocation = params.location || params.custpage_location;
			let intZone = params.zone || params.custpage_zone;
			let intFirstBin = params.firstbin || params.custpage_firstbin;
			let intSortBy = params.sort || params.custpage_sort;

			objField.addSelectOption({
				value: '',
				text: '- Select -'
			});

			if (!nsutil.isEmpty(intLocation) && !nsutil.isEmpty(intZone))
			{
				let arrFilter = [];
				arrFilter.push(["location","anyof",intLocation]);
				arrFilter.push("AND");
				arrFilter.push(["custrecord_ns_bin_zone","anyof",intZone]);

				let arrColumn = [];

				if (!nsutil.isEmpty(intSortBy) && intSortBy == 1)
				{
					log.debug(stLogTitle, 'Sort by Sequence')
					arrColumn.push(search.createColumn({name: "binnumber", label: "Bin Number"}));
					arrColumn.push(search.createColumn({name: "custrecord_ns_bin_sequence_number", label: "Bin Number", sort: search.Sort.ASC }));
				}
				else
				{
					log.debug(stLogTitle, 'Sort by Name')
					arrColumn.push(search.createColumn({name: "binnumber", label: "Bin Number", sort: search.Sort.ASC }));
					arrColumn.push(search.createColumn({name: "custrecord_ns_bin_sequence_number", label: "Bin Number"}));
				}

				if (isLastBin && !nsutil.isEmpty(intFirstBin))
				{
					arrFilter.push("AND");
					arrFilter.push(["internalid","noneof",intFirstBin]);
				}

				let arrBinSearchResult = nsutil.search('bin', null, arrFilter, arrColumn);

				for (let i = 0; i < arrBinSearchResult.length; i++)
				{
					var stId = arrBinSearchResult[i].id;
					var stName = arrBinSearchResult[i].getValue({ name: "binnumber"});

					objField.addSelectOption({
						value: stId,
						text: stName
					});
				}
			}
		}

		ctrller.setTemplateFieldValue = function (params, objField)
		{
			var stLogTitle = 'ctrller.setTemplateFieldValue';
			log.debug(stLogTitle);

			let intLabelType = params.type || params.custpage_labeltype;

			objField.addSelectOption({
				value: '',
				text: '- Select -'
			});

			if (!nsutil.isEmpty(intLabelType))
			{
				let arrFilter = [];
				let arrColumn = [];

				if (intLabelType == 1)
				{
					arrFilter.push(["isinactive","IS","F"]);
					arrFilter.push("AND");
					arrFilter.push(["custrecord_bintpl_file_id","isnotempty",""]);
				}
				else
				{
					arrFilter.push(["isinactive","IS","F"]);
					arrFilter.push("AND");
					arrFilter.push(["custrecord_bintpl_template","isnotempty",""]);
				}

				arrColumn.push({name: "name", label: "Name"});

				let arrSearchResult = nsutil.search('customrecord_ns_bin_label_template', null, arrFilter, arrColumn);

				for (let i = 0; i < arrSearchResult.length; i++)
				{
					var stId = arrSearchResult[i].id;
					var stName = arrSearchResult[i].getValue({ name: "name"});

					objField.addSelectOption({
						value: stId,
						text: stName
					});
				}
			}
		}

		ctrller.getFormHeaderValues = function (params, objForm, bSetOnField)
		{
			var stLogTitle = 'ctrller.getFormHeaderValues';
			log.debug(stLogTitle, params);
			log.debug(stLogTitle, 'bSetOnField:'+bSetOnField);

			var objReturn = {};

			for (var key in params)
			{
				var isHidden = false;
				var objField = objForm.getField({
					id: key
				});
				if (!objField) continue;

				objReturn[key] = params[key];

				if (bSetOnField)
				{
					if (isHidden)
					{
						objField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

					}
					else
					{
						objField.defaultValue = params[key];
						objField.updateDisplayType({
							displayType: ui.FieldDisplayType.INLINE
						});
					}
				}
			}
			log.debug(stLogTitle, 'objReturn:'+JSON.stringify(objReturn))
			return objReturn;
		};

		ctrller.listBinSublistData = function (params, objForm, fieldOptions, strSearch, stMode)
		{
			var stLogTitle = 'ctrller.listBinSublistData';
			log.debug(stLogTitle, 'params:'+JSON.stringify(params));

			let arrResults = [];
			let arrColumn = [];
			let arrFilter = [];

			//Filters
			arrFilter.push(["location","anyof",params.custpage_location]);
			arrFilter.push("AND");
			arrFilter.push(["custrecord_ns_bin_zone","anyof",params.custpage_zone]);
			arrFilter.push("AND");
			arrFilter.push([["custrecord_ns_bin_label_template","anyof",params.custpage_template],"OR",["custrecord_ns_bin_label_template","anyof","@NONE@"]]);

			//Columns
			arrColumn.push(search.createColumn({name: "internalid"}));
			arrColumn.push(search.createColumn({name: "location"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_location_code"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_zone"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_zone_code"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_asile_row"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_rack_bay"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_level_shelf"}));
			arrColumn.push(search.createColumn({name: "custrecord_ns_bin_position"}));

			if (!nsutil.isEmpty(params.custpage_sort) && params.custpage_sort == 1)
			{
				arrColumn.push(search.createColumn({name: "binnumber", label: "Bin Number"}));
				arrColumn.push(search.createColumn({
					name: "custrecord_ns_bin_sequence_number",
					label: "Bin Number",
					sort: search.Sort.ASC
				}));
			}
			else
			{
				arrColumn.push(search.createColumn({name: "binnumber", label: "Bin Number", sort: search.Sort.ASC}));
				arrColumn.push(search.createColumn({name: "custrecord_ns_bin_sequence_number", label: "Bin Number"}));
			}

			let arrBinSearchResult = nsutil.search('bin', null, arrFilter, arrColumn);
			// log.debug(stLogTitle, 'arrBinSearchResult:'+JSON.stringify(arrBinSearchResult));

			let isFirstBin = false;
			let isLastBin = false;

			for (let i=0; i < arrBinSearchResult.length; i++)
			{
				if (isLastBin === true && isLastBin === true) break;

				let intInternalId = arrBinSearchResult[i].getValue({name: "internalid"});
				let intLocation = arrBinSearchResult[i].getValue({name: "location"});
				let strLocationCode = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_location_code"});
				let intBinZone = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_zone"});
				let strBinZoneCode = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_zone_code"});
				let strAisleRow = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_asile_row"});
				let strRack = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_rack_bay"});
				let strLevel = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_level_shelf"});
				let strPosition = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_position"});
				let strBinNumber = arrBinSearchResult[i].getValue({name: "binnumber"});
				let strSequenceNumber = arrBinSearchResult[i].getValue({name: "custrecord_ns_bin_sequence_number"});
				log.debug(stLogTitle, 'strBinNumber:' + strBinNumber);

				if ((params.custpage_firstbin == intInternalId) || arrBinSearchResult.length == 1)
				{
					isFirstBin = true;
				}
				log.debug(stLogTitle, 'isFirstBin:'+isFirstBin+' | isLastBin:'+isLastBin);

				if (isFirstBin == true && isLastBin == false)
				{
					arrResults.push({
						'internalid': intInternalId,
						'location': intLocation,
						'custrecord_ns_bin_location_code': strLocationCode,
						'custrecord_ns_bin_zone': intBinZone,
						'custrecord_ns_bin_zone_code': strBinZoneCode,
						'custrecord_ns_bin_asile_row': strAisleRow,
						'custrecord_ns_bin_rack_bay': strRack,
						'custrecord_ns_bin_level_shelf': strLevel,
						'custrecord_ns_bin_position': strPosition,
						'binnumber': strBinNumber,
						'custrecord_ns_bin_sequence_number': strSequenceNumber
					});
				}

				if (params.custpage_lastbin == intInternalId)
				{
					isLastBin = true;
				}
			}

			if (arrResults.length <= 0) return;

			log.debug(stLogTitle, 'arrResults:'+JSON.stringify(arrResults))

			var objSublist = objForm.getSublist({
				id: 'tbl_sublist'
			});
			ctrller.setSublistColumnsFromSearch(arrResults, objSublist, fieldOptions, params);
		};

		ctrller.setSublistColumnsFromSearch = function (arrResults, objSublist, fieldOptions, params, objNetIncome)
		{
			let stLogTitle = 'ctrller.setSublistColumnsFromSearch';
			log.debug(stLogTitle);
			// log.debug(stLogTitle, 'fieldOptions:'+JSON.stringify(arrResults))

			let objSearch = search.load({
				id: params.srch_bin
			});
			let arrColumns = objSearch.columns;

			for (var intIndex = 0; intIndex < arrResults.length; intIndex++)
			{
				let objResult = arrResults[intIndex];
				// log.debug(stLogTitle, 'objResult:'+JSON.stringify(objResult)+' | arrColumns:'+JSON.stringify(arrColumns))

				for (var key in arrColumns)
				{
					var arrFieldIds = [];
					var stName = '';
					// log.debug(stLogTitle, 'key:'+JSON.stringify(arrColumns[key]))

					if (arrColumns[key].join) stName = arrColumns[key].join + '_' + arrColumns[key].name;
					else stName = arrColumns[key].name;
					stName = stName.toLowerCase().replace('.', '_');
					// log.debug(stLogTitle, 'stName:'+stName)

					arrFieldIds.push(stName);
					var objValue = objResult[stName];

					if (fieldOptions !== undefined && fieldOptions[stName] && fieldOptions[stName].altSearchColumn)
						objValue = objResult[fieldOptions[stName].altSearchColumn];

					if (fieldOptions !== undefined && fieldOptions[stName])
					{
						if (fieldOptions[stName].alt)
							arrFieldIds = arrFieldIds.concat(fieldOptions[stName].alt);
					}

					for (var i in arrFieldIds)
					{
						if (objValue)
						{
							objSublist.setSublistValue({
								id: arrFieldIds[i],
								line: intIndex,
								value: objValue
							});
						}
					}
				}
			}
		};

		ctrller.callMRWithDelay = function (options)
		{
			let stLogTitle = 'ctrller.callMRWithDelay';
			log.debug(stLogTitle);

			try
			{
				if (!options.script)
				{
					throw error.create({name: 'EMPTY_REQUIRED_FIELD', message: 'Script ID', notifyOff: true});
				}

				let intAttempts = options.attempts || 3;
				let intTimeDelay = options.delay || 3;
				let bSuccess = false;

				let callMR = (scriptid, params) =>
				{
                    let objTask = task.create(
                        {taskType: task.TaskType.MAP_REDUCE, scriptId: scriptid, deploymentId: null, params: params});
                    let stNewTaskId = objTask.submit();
                    let objStatus = task.checkStatus(stNewTaskId);
                    return objStatus.status;
				};

				let delay = (s) =>
				{
					if (!s)
					{return;}
					let intTimeEnd = (new Date().getTime()) + (s * 1000);
					while (new Date().getTime() <= intTimeEnd)
					{
						continue;
					}
				};

				for (let i = 0; i < intAttempts; i++)
				{
					let err = null;
					let stStatus = null;
					try
					{
						if (i > 0)
						{delay(intTimeDelay);}
						stStatus = callMR(options.script, options.params);
						bSuccess = true;
					}
					catch (e)
					{
						err = e.name + ': ' + e.message;
					}
					finally
					{
						log.error(stLogTitle, 'attempt=' + (i + 1) + ' | status=' + stStatus + (err ? (' | error=' + err) : ''));
						if (bSuccess == true)
						{break;}
					}
				}

				if (bSuccess === false)
				{
					throw error.create({
						name:      'MAP_REDUCE_CALL_ERROR',
						message:   'Map/Reduce either has insufficient deployment or too busy to accept another request.',
						notifyOff: true
					});
				}

				return bSuccess;
			}
			catch (e)
			{
				throw e;
			}
		};

		return EntryPoint;
	});