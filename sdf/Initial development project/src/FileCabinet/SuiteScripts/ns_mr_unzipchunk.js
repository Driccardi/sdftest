/**
 * Copyright (c) 1998-2025 Oracle NetSuite, Inc.
 * 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 * All Rights Reserved.
 *
 * Version          Date                Author               Remarks
 * 1.00             2025-10-21          riccardi             initial build
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/https', 'N/file', 'N/xml', 'N/runtime', 'N/log','N/compress','./unzipit-master/src/unzipit'], 
function(https, file, xml, runtime, log, compress, unzipit) {

    //const UNZIP_LIB_URL = 'https://cdn.jsdelivr.net/npm/unzipit@1.4.3/dist/unzipit.min.js';
    const { unzip } = unzipit;

    /**
     * Downloads a ZIP from a URL and unpacks it into memory using Unzipit.
     * Returns an array of XML <product_specs> chunks (each chunk = ~100 items)
     */
    const getInputData = () => {
        try {
            const script = runtime.getCurrentScript();
            const fileUrl = script.getParameter({ name: 'custscript_zip_url' });
            const folderId = script.getParameter({ name: 'custscript_folder_id' });
            const chunkSize = parseInt(script.getParameter({ name: 'custscript_chunk_size' }) || 100);

            if (!fileUrl || !folderId) throw 'Missing required parameters (zip URL or folder ID).';

            log.audit('Downloading ZIP', fileUrl);
            const response = https.get({ url: fileUrl });
            const zipArrayBuffer = response.body ? new Uint8Array(response.body.split('').map(c => c.charCodeAt(0))) : null;

            if (!zipArrayBuffer) throw 'Invalid or empty ZIP response.';
            log.audit('ZIP file downloaded', `Size: ${zipArrayBuffer.length} bytes`);
            // Load unzipit in sandbox context
            //const { unzip } = eval(
            //    https.get({ url: UNZIP_LIB_URL }).body + ';({ unzip })'
            //);
            log.audit('Unzipping file in memory');
            const { entries } = extractZip(zipArrayBuffer);
            log.debug('Unzipped entries', entries);
            const xmlEntries = Object.values(entries).filter(e => e.name.endsWith('.xml'));

            const xmlText = xmlEntries[0] ? xmlEntries[0].text() : '';
            if (!xmlText) throw 'No XML file found in ZIP archive.';

            const xmlDoc = xml.Parser.fromString({ text: xmlText });
            const productNodes = xml.XPath.select({ node: xmlDoc, xpath: '//product_specs' });
            const totalProducts = productNodes.length;

            log.audit('Found products', totalProducts);

            let chunkList = [];
            for (let i = 0; i < totalProducts; i += chunkSize) {
                const chunkNodes = productNodes.slice(i, i + chunkSize);
                const chunkXml = `<product_data>${chunkNodes.map(n => xml.Serializer.toString({ node: n })).join('')}</product_data>`;

                const chunkFile = file.create({
                    name: `product_chunk_${Math.ceil(i / chunkSize) + 1}.xml`,
                    fileType: file.Type.XMLDOC,
                    contents: chunkXml,
                    folder: folderId
                });
                const fileId = chunkFile.save();
                chunkList.push({ fileId, count: chunkNodes.length });
            }

            log.audit('Chunked files created', chunkList.length);
            return chunkList;

        } catch (e) {
            log.error('getInputData error', e);
            throw e;
        }
    };

      async function extractZip(fileContent) {
        const { unzip } = unzipit;
        const result = await unzip(fileContent);
        return result;
    }
        /**
     * Reduce stage: logs each file id created
     */
    const reduce = (context) => {
        const entry = JSON.parse(context.key || '{}');
        log.audit('Reduce Stage', `File ID: ${entry.fileId}`);
    };

    /**
     * Summary stage: log completion
     */
    const summarize = (summary) => {
        log.audit('Process Complete', `Total keys processed: ${summary.inputSummary}`);
    };

    return { getInputData, reduce, summarize };
});
