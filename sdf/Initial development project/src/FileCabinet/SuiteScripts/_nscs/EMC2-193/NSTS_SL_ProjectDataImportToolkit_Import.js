/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/runtime', 'N/ui/serverWidget','/SuiteScripts/_nscs/Library/NSUtilvSS2'],
function(file, record, runtime, serverWidget, NSUtil) {

    const OBJ_SCRIPT = runtime.getCurrentScript();

    const SCRIPT_PARAMS_IDS = {
        FORM_TITLE: 'custscript_ns_csvimporttool_title',
        IMPORT_IMAGE: 'custscript_ns_csvimporttool_imt_image',
        IMPORT_TYPE: 'custscript_ns_csvimportool_imttype',
        INTG_CUSTOMER: 'custscript_ns_csvimporttool_intcust'
    }

    const CUSTOM_FORM_IDS = {
        INLINE_IMAGE: 'custrecord_image',
        SEL_IMPORT_TYPE: 'custrecord_import_type',
        FILE_CSV: 'custrecord_csv_file'
    }

    function onRequest(context) {
        let logTitle = 'onRequest() - CSV Import Tool'
        let formTitle = OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.FORM_TITLE }) || '';

        if (context.request.method === 'GET') {

          // Render the SuiteLet form
            let form = serverWidget.createForm({
                title: formTitle
            });

            // form.addFieldGroup({
			// 	id : 'settings_group',
			// 	label : 'Settings'
			// });

            if(!NSUtil.isEmpty(OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.IMPORT_IMAGE }))){
                let strImagePath = OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.IMPORT_IMAGE });
                let objImportImage = file.load({id: strImagePath});

                let imageFld = form.addField({
                    id: CUSTOM_FORM_IDS.INLINE_IMAGE,
                    label: 'Import Process',
                    type: serverWidget.FieldType.INLINEHTML
                });
                imageFld.defaultValue = '<img src="' + objImportImage.url + '" alt="Import Process" width="200" height="200">';

            }

            let importTypeFld = form.addField({
                id: CUSTOM_FORM_IDS.SEL_IMPORT_TYPE,
                label: 'Import Type',
                type: serverWidget.FieldType.SELECT,
                source: 'customrecord_ps_imptyp'
                // ,
				// container: 'settings_group'
            });
            importTypeFld.isMandatory = true;
            let idDefaultImportType = OBJ_SCRIPT.getParameter({name: SCRIPT_PARAMS_IDS.IMPORT_TYPE });
			log.debug('idDefaultImportType', idDefaultImportType);
			importTypeFld.defaultValue = idDefaultImportType;

            let csvFileFld = form.addField({
                id: CUSTOM_FORM_IDS.FILE_CSV,
                label: 'CSV File',
                type: serverWidget.FieldType.FILE
            });
            csvFileFld.isMandatory = true;

            form.addSubmitButton({
                label: 'Run'
            });

            context.response.writePage(form);
        } else {
            let idIntegrationCustomer = OBJ_SCRIPT.getParameter({ name: SCRIPT_PARAMS_IDS.INTG_CUSTOMER });
            let objCsvFile = context.request.files.custrecord_csv_file;
            let idImportType = context.request.parameters.custrecord_import_type;

            log.debug({title: `${logTitle}: objCsvFile`, details: JSON.stringify(objCsvFile)});
            log.debug({title: logTitle, details: `idIntegrationCustomer ${idIntegrationCustomer}, idImportType: ${idImportType}`});

            if (objCsvFile && idIntegrationCustomer && idImportType) {
                try {
                    let objCsvData = objCsvFile.getContents();
                    log.debug({title: `${logTitle}: CSV Data`, details: JSON.stringify(objCsvData)});
                    let csvRows = objCsvData.split('\n');
                    csvRows = csvRows.slice(1, (csvRows.length)-1);
                    log.debug({title: `${logTitle}: csvRows`, details: csvRows});

                    let rowsWritten = 0;
                    let strErrMsg = '';

                    let timestamp = new Date();
					
                    csvRows.forEach(function(row, lineNumber) {
                        try {

                            let rowData = parseStringTokens(row)
                            let objImportedRecord = record.create({
                                type: 'customrecord_ps_imptypimp'
                            });
                            objImportedRecord.setValue({
                                fieldId: 'custrecord_ps_imp_intcust',
                                value: idIntegrationCustomer
                            });
                            objImportedRecord.setValue({
                                fieldId: 'custrecord_ps_imp_typ',
                                value: idImportType
                            });

							objImportedRecord.setValue({
                                fieldId: 'custrecord_ps_imp_dtaset',
                                value: timestamp.toString()
                            });
							
                            objImportedRecord.setValue({
                                fieldId: 'custrecord_ps_imp_lineno',
                                value: lineNumber
                            });

                            for (let i = 0; i < rowData.length; i++) {
                                let iAsStr = (i + 1);
                                let hold = iAsStr.toString()
							  if(iAsStr<10){
								hold = "0"+hold
							  }
                                let fieldId = 'custrecord_ps_imp_fld' + hold;
                                objImportedRecord.setValue({
                                    fieldId: fieldId,
                                    value: rowData[i]
                                });
                            }

                            try {
                                objImportedRecord.save();
                                rowsWritten++;
                            } catch (e) {
                                strErrMsg += 'Error writing row ' + (lineNumber + 1) + ' to custom record: ' + e.message + '\n';
                                log.error({title: `${logTitle}: ERROR`, details: strErrMsg});
                            }
                        } catch (e) {
                            strErrMsg += 'Error parsing column in row ' + (lineNumber + 1) + ': ' + e.message + '\n';
                            log.error({title: `${logTitle}: ERROR`, details: strErrMsg});
                        }
                    });

                    let strMessage = 'CSV file processed. ' + rowsWritten + ' rows written to custom record.\n' + strErrMsg;
                    let form = serverWidget.createForm({
                        title: formTitle
                    });
                    let messageFld = form.addField({
                        id: 'message',
                        label: 'Message',
                        type: serverWidget.FieldType.TEXTAREA,
                    });
                    messageFld.defaultValue = strMessage;
                    messageFld.updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });
                    context.response.writePage(form);
                } catch (e) {

                    log.error({title: `${logTitle}: ERROR`, details: `${e.title}: ${e.message}`});
                    let form = serverWidget.createForm({
                        title: formTitle
                    });
                    let messageFld = form.addField({
                        id: 'message',
                        label: 'Message',
                        type: serverWidget.FieldType.TEXTAREA,
                    });
                    messageFld.defaultValue = e.message;
                    messageFld.updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.INLINE
                    });
                    context.response.writePage(form);
                }
            } else {
                let form = serverWidget.createForm({
                        title: formTitle
                    });
                let messageFld = form.addField({
                        id: 'message',
                        label: 'Message',
                        type: serverWidget.FieldType.TEXTAREA,
                });
                messageFld.defaultValue = 'No CSV file uploaded or missing parameters.';
                messageFld.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.INLINE
                });
                context.response.writePage(form);
            }
        }
    }
function parseStringTokens(input) {
  const tokens = [];
    let startPosition = 0;
    let isInQuotes = false;

  for (let currentPosition = 0; currentPosition < input.length; currentPosition++) {
    if (input[currentPosition] === '"') {
      isInQuotes = !isInQuotes;
    } else if (input[currentPosition] === ',' && !isInQuotes) {
        let token = input.substring(startPosition, currentPosition).replace(/"/g, '');
      tokens.push(token);
      startPosition = currentPosition + 1;
    }
  }

  const lastToken = input.substring(startPosition).replace(/"/g, '');
  if (lastToken === ',') {
    tokens.push('');
  } else {
    tokens.push(lastToken);
  }

  return tokens;
}
    return {
        onRequest: onRequest
    };
});
