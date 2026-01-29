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
*  1.00            2025-09-21          riccardi             initial build
*
*/

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/llm'], function (llm) {
    'use strict';
  
    /** @constant {boolean} true = always 200 with {ok:false,...}; false = 500 on JSON failure */
    const FAIL_SOFT = true;
    const LPFX = 'SU:EVPR'; // log prefix
    const MAX_PREVIEW = 900;
  
    /**
     * Suitelet entrypoint
     * @param {SuiteletContext} ctx
     */
    function onRequest(ctx) {
      log.debug({ title: `${LPFX} onRequest`, details: `method=${ctx.request && ctx.request.method}` });
  
      try {
        const isPost = (ctx.request && ctx.request.method) === 'POST';
        const input = isPost ? safeParseJson(ctx.request.body) : readFromParams(ctx.request && ctx.request.parameters);
  
        if (!input || !input.id) {
          return send(ctx, 400, { ok: false, error: 'Missing required property: id' });
        }
  
        // Normalize variables
        const variables = normalizeVariables(input.variables);
        log.debug({ title: `${LPFX} input`, details: { id: input.id, variablesPreview: preview(JSON.stringify(variables)) } });
  
        // Evaluate the Prompt Studio prompt
        let resp;
        try {
          resp = llm.evaluatePrompt({ id: String(input.id), variables: variables || {} });
        } catch (e) {
          // Surface known N/llm errors clearly; fall back to generic if unknown
          const errName = (e && e.name) || 'LLM_ERROR';
          const errMsg = (e && e.message) || String(e);
          const details = {
            ok: false,
            error: `llm.evaluatePrompt failed: ${errName}`,
            message: errMsg
          };
          // Template issues are user-fixable; return 200 in fail-soft mode
          return send(ctx, FAIL_SOFT ? 200 : 500, details);
        }
  
        // Prefer Response.text, but fall back to last chatHistory message if needed
        const rawText = coalesceText(resp);
        if (!rawText) {
          return send(ctx, 200, { ok: false, error: 'Empty LLM response' });
        }
  
        // Try to coerce to valid JSON
        log.debug({ title: `${LPFX} raw response`, details: preview(rawText) });
        const jsonText = sanitizeToJson(rawText);
  
        try {
          const parsed = JSON.parse(jsonText);
          // If the LLM already returned a top-level ok field, honor it; otherwise assume success
          return send(ctx, 200, typeof parsed === 'object' ? parsed : { ok: true, data: parsed });
        } catch (e) {
          const details = {
            ok: false,
            error: 'Invalid JSON from LLM',
            rawPreview: preview(jsonText)
          };
          return send(ctx, FAIL_SOFT ? 200 : 500, details);
        }
      } catch (err) {
        log.error({ title: `${LPFX} unexpected error`, details: err });
        return send(ctx, 500, { ok: false, error: (err && err.message) || String(err) });
      }
    }
  
    // ----------------- Helpers -----------------
  
    /**
     * Parse JSON safely
     * @param {string} text
     * @returns {any|null}
     */
    function safeParseJson(text) {
      try {
        // Accept empty/whitespace POST body as {}
        const t = (text || '').trim();
        return t ? JSON.parse(t) : {};
      } catch (_e) {
        return null;
      }
    }
  
    /**
     * Read id/variables from query params (GET)
     * Supports variables as JSON string.
     * @param {Object<string,string>} p
     * @returns {{id:string, variables:Object}|{id:string}}
     */
    function readFromParams(p) {
      const id = p && p.id ? String(p.id) : '';
      let variables = {};
      if (p && p.variables) {
        try { variables = JSON.parse(String(p.variables)); } catch (_e) { variables = {}; }
      }
      return { id, variables };
    }
  
    /**
     * Normalize variables that may be stringified, null, or object
     * @param {any} v
     * @returns {Object}
     */
    function normalizeVariables(v) {
      if (!v) return {};
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch (_e) { return {}; }
      }
      return (typeof v === 'object') ? v : {};
    }
  
    /**
     * Prefer Response.text; fallback to last chatHistory text
     * @param {any} resp
     * @returns {string}
     */
    function coalesceText(resp) {
      if (!resp) return '';
      if (resp.text) return String(resp.text);
      if (Array.isArray(resp.chatHistory) && resp.chatHistory.length) {
        const last = resp.chatHistory[resp.chatHistory.length - 1];
        if (last && last.text) return String(last.text);
      }
      return '';
    }
  
    /**
     * Attempt to sanitize an LLM response into valid JSON text
     * - strips code fences
     * - normalizes smart quotes
     * - removes BOM
     * - fixes trailing commas
     * - extracts first {...} or [...] block from surrounding prose
     * @param {string} text
     * @returns {string}
     */
    function sanitizeToJson(text) {
      let t = String(text || '').trim();
  
      // Strip code fences anywhere (start/end)
      if (/```/m.test(t)) {
        // remove starting fence
        t = t.replace(/^\s*```(?:json|javascript|js)?\s*/i, '');
        // remove trailing fence (last occurrence)
        t = t.replace(/```[\s\S]*?$/m, '').trim();
      }
  
      // Normalize smart quotes
      t = t.replace(/[\u201C-\u201F]/g, '"').replace(/[\u2018\u2019]/g, "'");
  
      // Remove BOM
      t = t.replace(/^\uFEFF/, '');
  
      // Fix trailing commas
      t = t.replace(/,\s*([}\]])/g, '$1');
  
      // Extract first JSON object or array if wrapped in prose
      const m = t.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (m) t = m[1];
  
      return t;
    }
  
    /**
     * Preview for logs
     * @param {string} s
     * @returns {string}
     */
    function preview(s) {
      const t = String(s || '');
      return t.length > MAX_PREVIEW ? (t.slice(0, MAX_PREVIEW) + '…') : t;
    }
  
    /**
     * Unified JSON sender
     * @param {SuiteletContext} ctx
     * @param {number} status
     * @param {object|string} data
     */
    function send(ctx, status, data) {
      try {
        log.audit({
          title: `${LPFX} response`,
          details: { status, dataPreview: preview(typeof data === 'string' ? data : JSON.stringify(data)) }
        });
        ctx.response.status = status;
        ctx.response.setHeader({ name: 'Content-Type', value: 'application/json; charset=utf-8' });
        ctx.response.write(typeof data === 'string' ? data : JSON.stringify(data));
      } catch (e) {
        // Last-ditch fallback to avoid hiding the original result
        log.error({ title: `${LPFX} send error`, details: e });
        try {
          ctx.response.write(typeof data === 'string' ? data : JSON.stringify({ ok: false, error: 'Response write failure' }));
        } catch (_ignore) { /* noop */ }
      }
    }
  
    return { onRequest };
  });
  