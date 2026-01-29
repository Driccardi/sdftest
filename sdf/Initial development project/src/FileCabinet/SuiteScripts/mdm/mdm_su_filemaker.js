/**
 * Copyright (c) 1998-2025 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 *
 *  Version          Date                Author               Remarks
 *  1.00            2025-10-22          riccardi             initial build
 *
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/file','N/log'], (file, log) => {

  const RESP_JSON = 'application/json; charset=utf-8';

  /**
   * Map common string values to file.Type enum.
   * Accepts either a direct enum name (e.g., "XMLDOC") or friendlier aliases (e.g., "xml").
   */
  function resolveFileType(input) {
    if (!input) return null;
    const t = String(input).trim().toUpperCase();

    // Direct enum pass-through
    if (file.Type[t]) return file.Type[t];

    // Friendly aliases
    const map = {
      'TXT': 'PLAINTEXT',
      'TEXT': 'PLAINTEXT',
      'CSV': 'CSV',
      'XML': 'XMLDOC',
      'JSON': 'PLAINTEXT',
      'HTML': 'HTMLDOC',
      'PDF': 'PDF',
      'JS': 'JAVASCRIPT',
      'JPG': 'JPGIMAGE',
      'JPEG': 'JPGIMAGE',
      'PNG': 'PNGIMAGE',
      'GIF': 'GIFIMAGE',
      'SVG': 'SVG',
      'ZIP': 'ZIP',
      'GZ': 'GZIP',
      'MARKDOWN': 'MARKDOWN',
      'MD': 'MARKDOWN'
    };
    const enumKey = map[t];
    return enumKey && file.Type[enumKey] ? file.Type[enumKey] : null;
  }

  function badRequest(response, msg) {
    response.setHeader({ name: 'Content-Type', value: RESP_JSON });
    response.write(JSON.stringify({ success: false, error: msg }));
  }

  function onRequest(context) {
    const { request, response } = context;

    if (request.method === 'GET') {
      response.setHeader({ name: 'Content-Type', value: RESP_JSON });
      response.write(JSON.stringify({ ok: true, message: 'File creation Suitelet ready.' }));
      return;
    }

    // POST
    try {
      let payload = {};
      try {
        payload = JSON.parse(request.body || '{}');
      } catch (e) {
        return badRequest(response, 'Invalid JSON body.');
      }

      const fileName  = (payload.fileName || '').trim();
      const folderId  = Number(payload.folderId);
      const contents  = payload.contents ?? '';
      const fileType  = resolveFileType(payload.fileType);

      if (!fileName) return badRequest(response, 'Missing fileName.');
      if (!fileType) return badRequest(response, 'Missing/unsupported fileType.');
      if (!folderId || Number.isNaN(folderId)) return badRequest(response, 'Missing/invalid folderId.');

      // Create & save
      const f = file.create({
        name: fileName,
        fileType: fileType,
        contents: String(contents),
        folder: folderId
      });

      const fileId = f.save();

      // Load to get URL/size
      const saved = file.load({ id: fileId });

      response.setHeader({ name: 'Content-Type', value: RESP_JSON });
      response.write(JSON.stringify({
        success: true,
        fileId: fileId,
        fileName: saved.name,
        fileUrl: saved.url,
        fileSize: saved.size
      }));
    } catch (err) {
      log.error({ title: 'File create error', details: err });
      badRequest(response, String(err && err.message || err));
    }
  }

  return { onRequest };
});
