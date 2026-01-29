/**
* Copyright (c) 1998-2023 Oracle NetSuite, Inc.
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
*  1.00            2025-09-17          riccardi             refactor to read CABO cfg record
*
*/
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Custom Tool script for MCP: File Cabinet create/update/read with
 * per-role config sourced from customrecord_ns_cabo_cfg
 *
 * IMPORTANT:
 * - N/search is not available in Custom Tool scripts; use N/query + SuiteQL.
 * - All outputs are JSON-serializable primitives/objects.
 */
define(['N/file', 'N/query', 'N/runtime', 'N/log','N/url','N/search','N/record'], (file, query, runtime, log,url,search,record) => {
    const LOG_PREFIX = 'CABO_FILETOOL';
  
    // ---- Public tool methods --------------------------------------------------
  
    /**
     * Create a new file. Expects a payload similar to N/file.create options:
     * { name, fileType, contents, folder?, isOnline?, description? }
     */
    function createFile(args) {
        try{
            const cfg = loadConfigForCurrentRole();
            const targetFolder = normalizeFolder(args.folder, cfg);
        
            enforceFolderPolicy(targetFolder, cfg);
        
            const f = file.create({
                name: String(args.name),
                fileType: args.fileType,      // expect caller to pass N/file.Type.* value or its string
                contents: String(args.contents ?? ''),
                description: args.description || '',
                folder: targetFolder,
                isOnline: args.isOnline || false
            });
        
            const id = f.save();
            log.audit(`${LOG_PREFIX}:createFile`, { id, folder: targetFolder, name: f.name });
            return { success: true, id: id, folder: targetFolder, name: f.name };
        }catch(e){
            log.error(`${LOG_PREFIX}:createFile:Error`, e.message);
            return { success: false, error: e.message };
        }
}
  
    /**
     * Update (overwrite) an existing file. Payload should mirror N/file.load + set props:
     * { id? , name? , fileType? , contents? , folder? , isOnline? , description? }
     * - If id not provided but name provided, resolves by name within allowed folders.
     */
    function updateFile(args) {
        try{
      const cfg = loadConfigForCurrentRole();
      const resolvedId = resolveFileId(args, cfg);
      const f = file.load({ id: resolvedId });
  
      const targetFolder = normalizeFolder(args.folder ?? f.folder, cfg);
      enforceFolderPolicy(targetFolder, cfg);
  
      if (args.name) f.name = String(args.name);
      if (args.fileType) f.fileType = args.fileType;
      if (typeof args.contents === 'string') f.contents = args.contents;
      if (typeof args.description === 'string') f.description = args.description;
      if (typeof args.isOnline === 'boolean') f.isOnline = args.isOnline;
      f.folder = targetFolder;
  
      const id = f.save();
      log.audit(`${LOG_PREFIX}:updateFile`, { id, folder: targetFolder, name: f.name });
      return { success: true, id, folder: targetFolder, name: f.name };
        }catch(e){
            log.error(`${LOG_PREFIX}:updateFile:Error`, e.message);
            return { success: false, error: e.message };
        }   
    }
  
    /**
     * Read file contents by { id } or { name } (scoped to allowed folders).
     * Returns { id, name, folder, contents, size }.
     */
    function readFile(args) {
        try{
        const cfg = loadConfigForCurrentRole();
        const resolvedId = resolveFileId(args, cfg);
        const f = file.load({ id: resolvedId });
    
        // policy check (don’t leak files outside allowed scope)
        enforceFolderPolicy(f.folder, cfg);
    
        return {
                success: true,
                id: resolvedId,
                name: f.name,
                folder: f.folder,
                size: f.size,
                contents: f.getContents(),
                url: f.url
            };
        }catch(e){
            log.error(`${LOG_PREFIX}:readFile:Error`, e.message);
            return { success: false, error: e.message };
        }
    }
  
    // ---- Config loader --------------------------------------------------------
  
    /**
     * Loads the CABO configuration row that applies to the current user's role.
     * Fields (from customrecord_ns_cabo_cfg):
     *  - custrecord_cabo_cfg_role (MultiSelect <Role>)
     *  - custrecord_cabo_cfg_allowedfolders (Text CSV of folder IDs)
     *  - custrecord_cabo_cfg (Checkbox: allow SuiteScripts folder)
     *  - custrecord_cabo_cfg_defaultfld (Integer: default folder)
     */
    function loadConfigForCurrentRole() {
            try{
                const roleId = Number(runtime.getCurrentUser().role);
                const sql = `
                    SELECT
                    id,
                    custrecord_cabo_cfg_role      AS roles,
                    custrecord_cabo_cfg_allowedfolders AS allowed_folders,
                    custrecord_cabo_cfg           AS allow_suite,
                    custrecord_cabo_cfg_defaultfld AS default_folder
                    FROM customrecord_ns_cabo_cfg
                    WHERE isinactive = 'F'
                `;
                const res = query.runSuiteQL({ query: sql }).asMappedResults();

                log.debug(`${LOG_PREFIX}:loadConfigForCurrentRole`, { roleId, configsFound: res });
            
                if (!res || res.length === 0) {
                    throw policyError('No CABO configuration rows found.');
                }
            
                // choose first row where MultiSelect contains current role
                const match = res.find(r => {
                    const ids = parseMultiSelect(r.roles);
                    return ids.includes(roleId);
                });
            
                if (!match) {
                    throw policyError(`No CABO config grants access for role ${roleId}.`);
                }
            
                const allowed = parseFolderCsv(match.allowed_folders);
                const allowSuite = asBoolean(match.allow_suite);
                const defaultFolder = Number(match.default_folder || 0);
            
                if (!allowed.length) {
                    throw policyError('CABO config has empty allowed folder list.');
                }
                if (!defaultFolder) {
                    throw policyError('CABO config missing default folder.');
                }
            
                return {
                    success: true,
                    allowedFolders: new Set(allowed),
                    allowSuiteScripts: allowSuite,
                    defaultFolder
                };
        }catch(e){
            log.error(`${LOG_PREFIX}:loadConfigForCurrentRole:Error`, e.message);
            throw e;
            return { success: false, error: e.message };
        }
    }

    function getFolderByName(args) {
        try{
            const folderName = args.name;
            if(!folderName) throw badRequest('Folder name is required.');
            const sql = `
            SELECT id,
                   name,
                   parent,
                   BUILTIN.DF(parent) AS parentname,
                   foldersize
            FROM mediaitemfolder
            WHERE name = ?  
            AND isinactive = 'F'
            `;
            const params = [String(folderName)];
            const res = query.runSuiteQL({ query: sql, params }).asMappedResults(); 
            if (!res.length) {
                throw notFound(`Folder named "${folderName}" was not found.`);
            }
            return { 
                    success: true, 
                    id: Number(res[0].id), 
                    name: res[0].name,
                    parentId: res[0].parent ? Number(res[0].parent) : null,
                    parentName: res[0].parentname ? String(res[0].parentname) : null,
                    folderSize: res[0].foldersize ? Number(res[0].foldersize) : 0
                };
        }catch(e){
            log.error(`${LOG_PREFIX}:getFolderByName:Error`, e.message);
            return { success: false, error: e.message };
        }   
    }
  

  function listFilesInFolder(args) {
    // local fallbacks so this function is drop-in
    const LP = (typeof LOG_PREFIX === 'string' && LOG_PREFIX) ? LOG_PREFIX : 'CABO_FILETOOL';
    const raiseBadRequest = (msg) => {
      if (typeof badRequest === 'function') return badRequest(msg);
      const e = new Error(msg); e.name = 'BAD_REQUEST'; throw e;
    };
    const asBool = (v) => (v === true || String(v).toUpperCase() === 'T' || String(v) === '1');

    try {
      const { folderId, folderName } = args || {};
      if (!folderId && !folderName) raiseBadRequest('Provide either folderId or folderName.');

      // Build WHERE by id or by display name via BUILTIN.DF(folder)
      const where = folderId ? 'folder = ?' : 'BUILTIN.DF(folder) = ?';
      const params = [ folderId ? Number(folderId) : String(folderName) ];

      const sql = `
        SELECT
          id,
          name,
          filetype,
          createddate,
          lastmodifieddate,
          isonline,
          description,
          url,
          filesize
        FROM file
        WHERE ${where}
      `;

      const rows = query.runSuiteQL({ query: sql, params }).asMappedResults() || [];

      const files = rows.map(r => ({
        id: Number(r.id),
        name: String(r.name || ''),
        filetype: String(r.filetype || ''),
        createddate: String(r.createddate || ''),
        lastmodifieddate: String(r.lastmodifieddate || ''),
        isonline: asBool(r.isonline),
        description: r.description ? String(r.description) : '',
        url: r.url ? String(r.url) : '',
        filesize: Number(r.filesize || 0)
      }));

      return {
        success: true,
        folderRef: folderId ? { by: 'id', value: Number(folderId) } : { by: 'name', value: String(folderName) },
        count: files.length,
        files
      };
    } catch (e) {
      log.error(`${LP}:listFilesInFolder`, e.message || e);
      return { success: false, error: e.message || String(e) };
    }
  }
      /**
     * Attach a file to a record. Checks for existing attachment to avoid duplicates.
     * @param {Object} args - { fileId: number, recordId: number, recordType: string }
     * @returns {Object} { success: boolean, fileId?: number, recordId?: number, recordType?: string, error?: string }
     */
    function attachFile(args) {
        try {
            const fileId = Number(args.fileId);
            const recordId = Number(args.recordId);
            const recordType = String(args.recordType || '').toLowerCase();

            if (!fileId || isNaN(fileId)) {
                return { success: false, error: 'Invalid or missing fileId parameter' };
            }
            if (!recordId || isNaN(recordId)) {
                return { success: false, error: 'Invalid or missing recordId parameter' };
            }
            if (!recordType) {
                return { success: false, error: 'Missing recordType parameter' };
            }

            // Check if file exists
            const fileSearch = search.create({
                type: 'file',
                filters: [['internalid', 'is', fileId]],
                columns: ['name']
            });
            const fileResults = fileSearch.run().getRange({ start: 0, end: 1 });
            if (!fileResults || fileResults.length === 0) {
                return { success: false, error: `File with id ${fileId} does not exist` };
            }

            // Check if record exists
            try {
                record.load({ type: recordType, id: recordId, isDynamic: false });
            } catch (e) {
                return { success: false, error: `Record ${recordType}:${recordId} does not exist or cannot be loaded` };
            }

            // Check if already attached
            const attachmentSearch = search.create({
                type: 'file',
                filters: [
                    ['internalid', 'is', fileId],
                    'AND',
                    ['transaction', 'is', recordId]
                ],
                columns: ['internalid']
            });
            const attachmentResults = attachmentSearch.run().getRange({ start: 0, end: 1 });
            if (attachmentResults && attachmentResults.length > 0) {
                return { 
                    success: true, 
                    fileId: fileId,
                    recordId: recordId,
                    recordType: recordType,
                    alreadyAttached: true,
                    message: 'File is already attached to this record'
                };
            }

            // Perform attachment
            record.attach({
                record: {
                    type: 'file',
                    id: fileId
                },
                to: {
                    type: recordType,
                    id: recordId
                }
            });

            return {
                success: true,
                fileId: fileId,
                recordId: recordId,
                recordType: recordType,
                alreadyAttached: false
            };

        } catch (e) {
            return { success: false, error: e.message || String(e) };
        }
    }

    /**
     * List all file attachments for a given record.
     * @param {Object} args - { recordId: number, recordType: string }
     * @returns {Object} { success: boolean, attachments?: Array, count?: number, error?: string }
     */
    function listAttachments(args) {
        try {
            const recordId = Number(args.recordId);
            const recordType = String(args.recordType || '').toLowerCase();

            if (!recordId || isNaN(recordId)) {
                return { success: false, error: 'Invalid or missing recordId parameter' };
            }
            if (!recordType) {
                return { success: false, error: 'Missing recordType parameter' };
            }

            // Verify record exists
            try {
                record.load({ type: recordType, id: recordId, isDynamic: false });
            } catch (e) {
                return { success: false, error: `Record ${recordType}:${recordId} does not exist or cannot be loaded` };
            }

            // Search for attached files
            const fileSearch = search.create({
                type: 'file',
                filters: [
                    ['transaction', 'is', recordId]
                ],
                columns: [
                    'internalid',
                    'name',
                    'filetype',
                    'url',
                    'folder',
                    'created',
                    'modified',
                    'filesize'
                ]
            });

            const results = fileSearch.run().getRange({ start: 0, end: 1000 });
            const attachments = results.map(result => ({
                fileId: Number(result.id),
                name: result.getValue('name'),
                fileType: result.getValue('filetype'),
                url: result.getValue('url'),
                folder: result.getValue('folder'),
                created: result.getValue('created'),
                modified: result.getValue('modified'),
                fileSize: Number(result.getValue('filesize') || 0)
            }));

            return {
                success: true,
                recordId: recordId,
                recordType: recordType,
                count: attachments.length,
                attachments: attachments
            };

        } catch (e) {
            return { success: false, error: e.message || String(e) };
        }
    }


    // ---- Helpers --------------------------------------------------------------
  
    function resolveFileId(args, cfg) {
      if (args.id) return Number(args.id);
  
      if (!args.name) {
        throw badRequest('Provide either id or name to locate the file.');
      }
      // Look up by name within allowed folders using SuiteQL (no N/search)
      const folderIds = [...cfg.allowedFolders];
      const placeholders = folderIds.map(() => '?').join(', ');
      const sql = `
        SELECT id
        FROM file
        WHERE name = ?
        AND folder IN (${placeholders})
        ORDER BY id DESC
      `;
      const params = [String(args.name), ...folderIds];
      const res = query.runSuiteQL({ query: sql, params }).asMappedResults();
      if (!res.length) {
        throw notFound(`File named "${args.name}" was not found in allowed folders.`);
      }
      return Number(res[0].id);
    }
  
    function normalizeFolder(folderFromArgs, cfg) {
      const f = Number(folderFromArgs || cfg.defaultFolder || 0);
      if (!f) throw badRequest('Target folder not provided and no default found.');
      return f;
    }
  
    function enforceFolderPolicy(folderId, cfg) {
      if (cfg.allowedFolders.has(folderId)) return;
  
      // If not explicitly allowed, only permit if it’s the SuiteScripts folder (and policy says ok)
      if (cfg.allowSuiteScripts && isSuiteScriptsFolder(folderId)) return;
  
      throw policyError(
        `Folder ${folderId} is not permitted by CABO policy (allowed: ${[...cfg.allowedFolders].join(',')})`
      );
    }
  
    // Walk up the folder chain and see if any ancestor (or self) is named 'SuiteScripts'
    function isSuiteScriptsFolder(folderId) {
      let current = Number(folderId);
      for (let hop = 0; hop < 15 && current; hop++) {
        const row = query.runSuiteQL({
          query: `SELECT id, name, parent FROM mediaitemfolder WHERE id = ?`,
          params: [current]
        }).asMappedResults()[0];
  
        if (!row) break;
        const name = String(row.name || '').toLowerCase();
        if (name === 'Suitescripts' || id === '-15') return true;
        current = Number(row.parent || 0);
      }
      return false;
    }
  
    // Robust parsing for NetSuite multi-select returns (stringified list, csv, or plain)
    function parseMultiSelect(val) {
      if (Array.isArray(val)) return val.map(Number).filter(n => !Number.isNaN(n));
      const s = (val == null) ? '' : String(val);
      // Try JSON first
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          return arr.map(v => Number(v?.value ?? v)).filter(n => !Number.isNaN(n));
        }
      } catch (_e) { /* not JSON */ }
      // Fallback: extract all integers appearing in the string
      return (s.match(/\d+/g) || []).map(n => Number(n));
    }
  
    function parseFolderCsv(s) {
      const txt = String(s || '');
      return txt.split(/[,\s;|]+/).map(v => Number(v)).filter(n => !Number.isNaN(n));
    }
  
    const asBoolean = v => (v === true || String(v).toUpperCase() === 'T' || String(v) === '1');
  
    const badRequest = msg => createError('BAD_REQUEST', msg, 400);
    const notFound  = msg => createError('NOT_FOUND', msg, 404);
    const policyError = msg => createError('POLICY_VIOLATION', msg, 403);
  
    function createError(code, message, httpStatus) {
      const err = new Error(message);
      err.name = code;
      err.httpStatus = httpStatus;
      log.error(`${LOG_PREFIX}:${code}`, message);
      throw err;
    }
  
    // Export tool methods (names must match your tool schema)
    return {
      createFile,
      updateFile,
      readFile,
      getFolderByName,
      getPolicyForRole : loadConfigForCurrentRole,
      listFilesInFolder,
      attachFile,
      listAttachments
    };
  });
  