/**
 * Copyright (c) 1998-2025 Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * Version          Date                Author               Remarks
 * 1.00             2025-10-21          riccardi             proxy-download only
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define([
    'N/ui/serverWidget',
    'N/runtime',
    'N/https',
    'N/log',
    'N/encode',
    'N/file'
], function(
    serverWidget,
    runtime,
    https,
    log,
    encode,
    file
) {

    function onRequest(context) {
        var request = context.request;
        var response = context.response;
        var script = runtime.getCurrentScript();
        const DEFAULTSTYLE = `<style>
                                    .redwood-table {
                                    width: 100%;
                                    border-collapse: collapse;
                                    font-family: "Oracle Sans", "Arial", sans-serif;
                                    }
                                    .redwood-table thead th {
                                    background-color: #f4f6f8; /* light neutral background */
                                    color: #323338;              /* dark text */
                                    text-align: left;
                                    padding: 8px 12px;
                                    border-bottom: 2px solid #e0e3e8;
                                    }
                                    .redwood-table tbody td {
                                    padding: 8px 12px;
                                    border-bottom: 1px solid #e0e3e8;
                                    }
                                    .redwood-table tbody tr:hover {
                                    background-color: #eef0f3; /* subtle hover highlight */
                                    }
                                    .redwood-table a {
                                    color: #0066cc; /* link colour */
                                    text-decoration: none;
                                    }
                                    .redwood-table a:hover {
                                    text-decoration: underline;
                                    }
                                    </style>`;

        if (request.method === 'GET') {
            var form = serverWidget.createForm({ title: 'XML Chunk & Save (Proxy-Download)' });

            var fldUrl = form.addField({
                id: 'custpage_zip_url',
                type: serverWidget.FieldType.URL,
                label: 'ZIP File URL'
            });
            fldUrl.isMandatory = true;
            fldUrl.defaultValue = script.getParameter({ name: 'custscript_zip_url_default' }) || '';

            var fldFolder = form.addField({
                id: 'custpage_folder_id',
                type: serverWidget.FieldType.INTEGER,
                label: 'Output Folder ID'
            });
            fldFolder.isMandatory = true;
            fldFolder.defaultValue = script.getParameter({ name: 'custscript_folder_id_default' }) || '';

            var fldChunk = form.addField({
                id: 'custpage_chunk_size',
                type: serverWidget.FieldType.INTEGER,
                label: 'Chunk Size (items per file)'
            });
            fldChunk.isMandatory = true;
            fldChunk.defaultValue = script.getParameter({ name: 'custscript_chunk_size_default' }) || '100';
            var splitNode = form.addField({
                id: 'custpage_xml_split_node',
                type: serverWidget.FieldType.TEXT,
                label: 'XML Split Node'
            });
            splitNode.isMandatory = true;
            splitNode.defaultValue = script.getParameter({ name: 'custscript_xml_split_node_default' }) || 'product_specs';
            var fileHeader = form.addField({
                id: 'custpage_xml_file_header',
                type: serverWidget.FieldType.TEXT,
                label: 'XML File Header'
            });
            fileHeader.isMandatory = true;
            fileHeader.defaultValue = script.getParameter({ name: 'custscript_xml_file_header_default' }) || '<?xml version="1.0" encoding="ISO-8859-1"?><product_data>';
            var fileFooter = form.addField({
                id: 'custpage_xml_file_footer',
                type: serverWidget.FieldType.TEXT,
                label: 'XML File Footer'
            });
            fileFooter.isMandatory = true;
            fileFooter.defaultValue = script.getParameter({ name: 'custscript_xml_file_footer_default' }) || '</product_data>';

            var htmlField =form.addField({
                id: 'custpage_file_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Result'
            });
            htmlField.defaultValue = DEFAULTSTYLE + `<div id="html_results"></div>`;
            htmlField.updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
            });
            form.clientScriptModulePath = './ns_cs_cxil_xmllauncherclient.js';
            form.addButton({
                id: 'custpage_btn_run',
                label: 'Run Download & Chunk',
                functionName: 'onRunButtonClick'
            });

            response.writePage(form);

        } else {
            // post actions
            const requestBody = JSON.parse(request.body);
            const action = requestBody.action || request.parameters.custpage_action;

            if (action === 'saveChunk') {
                try {
                const chunkName   = requestBody.chunkName;
                const xmlContent  = requestBody.xmlContent;
                const folderId    = parseInt(requestBody.folderId, 10);

                if (!chunkName || !xmlContent || !folderId) {
                    throw new Error('Missing required parameter(s) for saveChunk: chunkName / xmlContent / folderId');
                }

                // Create the file in File Cabinet
                const fileObj = file.create({
                    name:     chunkName,
                    fileType: file.Type.XMLDOC,
                    contents: xmlContent
                });
                fileObj.folder = folderId;

                const fileId = fileObj.save();

                const savedFile = file.load({ id: fileId });
                const fileUrl  = savedFile.url;
                const fileSizeKB = (savedFile.size / 1024).toFixed(2);

                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({
                    success:      true,
                    fileId:       fileId,
                    fileName:     chunkName,
                    fileUrl:      fileUrl,
                    fileSizeKB:   fileSizeKB
                }));
                return;

                } catch (err) {
                log.error({ title: 'saveChunk error', details: err });
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({
                    success: false,
                    error:   err.toString()
                }));
                return;
                }
            }

            // Default: proxy download action

            try {
                var body = JSON.parse(request.body);
                var zipUrl = body.zipUrl;

                if (!zipUrl) {
                    throw new Error('Missing ZIP URL parameter');
                }

                log.audit('Proxy downloading ZIP', zipUrl);
                var resp = https.get({ url: zipUrl, headers: {} });
                if (resp.code !== 200) {
                    throw new Error('ZIP download failed with HTTP code: ' + resp.code);
                }

                // Convert body (string) -> Uint8Array? But we may encode as Base64 for JSON transport.
                var zipBody = resp.body;

                var bodyLength = zipBody.length;
                log.audit('ZIP downloaded', 'Size: ' + bodyLength + ' bytes');
                let fObj = {};
                let fId = null;
                if( bodyLength > 0 && bodyLength < 10000000 ) { // 10 MB limit
                    // all good

                    fObj = file.create({
                        name: 'proxy_downloaded_zip_' + Date.now() + '.zip',
                        fileType: file.Type.ZIP,
                        contents: zipBody,
                        folder: -10 // Attachments Received
                    });
                    fId = fObj.save();
                    log.audit('Temporary ZIP file saved', 'File ID: ' + fId);
                    
                }
                var b64 = encode.convert({ string: zipBody, inputEncoding: encode.Encoding.UTF_8, outputEncoding: encode.Encoding.BASE_64 });
                log.debug('ZIP file encoded to Base64', 'Length: ' + b64.length + ' characters');
                if (fId){ fObj = file.load({ id: fId });
                  response.write(JSON.stringify({
                    success: true,
                    zipBase64: b64,
                    url: fObj.url || null,
                    fileId: fId || null
                }));          
            
            }else{
                response.write(JSON.stringify({
                    success: true,
                    zipBase64: b64,
                    url: null,
                    fileId: null
                }));
            }


                return;

            } catch (err) {
                log.error({ title: 'Suitelet proxy error', details: err });
                response.write(JSON.stringify({ success: false, error: err.toString() }));
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
