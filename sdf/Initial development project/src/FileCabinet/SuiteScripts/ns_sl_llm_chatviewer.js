/**
 * ns_sl_llm_chatviewer.js
 * --------------------------------------------------------------
 * Suitelet: Real-time Agent-Chat Viewer
 * GET /?sessionId=abc-123  → returns Redwood-styled HTML that can
 * drop into a <div> or iframe and refresh every few minutes.
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/query', 'N/log'], (query, log) => {
    'use strict';
    
    /* ------------------------------------------------------------------ */
    const SQL = `
      SELECT
        custrecord_wfll_logresponse AS responsejson,
        BUILTIN.DF(custrecord_wfll_logagent) AS agent,
        custrecord_wfll_logduration AS duration,
        custrecord_wfll_logerror AS error
      FROM customrecord_wfll_prompt_log
      WHERE custrecord_wfll_logsession LIKE ?
      ORDER BY id ASC`;
  
    /* ================================================================== */
    function onRequest(ctx) {
      const sessionId = ctx.request.parameters.sessionId || '';
      if (!sessionId) return _fail(ctx, 'Missing sessionId parameter');
  
      const rows = query.runSuiteQL({ query: SQL, params: [sessionId + '%'] })
                        .asMappedResults();
  
      const bubblesHtml = rows.map(_rowToBubble).join('');
      ctx.response.setHeader({ name: 'Content-Type', value: 'text/html; charset=utf-8' });
      ctx.response.write(_wrapHtml(sessionId, bubblesHtml || '<em>No messages yet.</em>'));
    }
  
    /* ------------------------------------------------------------------ */
    function _rowToBubble(r) {
      let msgText = r.responsejson || '';

  
      
      const safeAgent = htmlEscape(r.agent || 'Unknown');
      const safeDur   = htmlEscape(r.duration || '');
      let errorHtml = r.error.length > 3 ? `<div class="err">${htmlEscape(r.error)}</div>` : '';

      try {
        const p = JSON.parse(msgText);
         msgText = (p && p.messageText) ?  p.messageText : '';
        }catch (_) {
         errorHtml = `<div class="err">Malformed JSON: ${htmlEscape(msgText)}</div>` + errorHtml;
         msgText = '';
        }
      const safeMsg   = htmlEscape(msgText);
  
      const bubbleCls = errorHtml.length > 3 ? 'bubble errBubble' : 'bubble';
  
      return `
        <div class="${bubbleCls}">
          <div class="agent">${safeAgent}</div>
          <div class="msg">${safeMsg}</div>
          ${errorHtml}
          <div class="dur">${safeDur}</div>
        </div>`;
    }
  
    /* ------------------------------------------------------------------ */
    function _wrapHtml(sessionId, bubbles) {
      return /* html */`
\ <div>
  <title>Chat – ${sessionId}</title>
  <style>
    /* Redwood subset & chat bubble styles */
    :root{
      --rw-font:'Oracle Sans','Helvetica Neue',sans-serif;
      --rw-body:16px; --rw-head:22px;
      --rw-neutral-0:#fff;   --rw-neutral-50:#f4f5f6;
      --rw-brand:#227e9e;    --rw-text:#161513;
      --rw-info:#00688c;
      --rw-error-bg:#ffe8e8; --rw-error-border:#f5c6cb;
      --rw-radius:8px;       --rw-pad:12px;
      --rw-border:1px solid #d7d9dc;
      --rw-shadow:0 1px 3px rgba(0,0,0,.05);
    }
    *{box-sizing:border-box;font-family:var(--rw-font)}
    body{margin:0;background:var(--rw-neutral-50);padding:var(--rw-pad);color:var(--rw-text)}
    h2{font-size:var(--rw-head);margin:0 0 var(--rw-pad)}
    .chat{display:flex;flex-direction:column;gap:var(--rw-pad)}
    .bubble{
      background:var(--rw-neutral-0);
      border:var(--rw-border);
      border-radius:var(--rw-radius);
      box-shadow:var(--rw-shadow);
      padding:var(--rw-pad) calc(var(--rw-pad)*1.5);
      position:relative;
    }
    .errBubble{
      background:var(--rw-error-bg);
      border-color:var(--rw-error-border);
    }
    .agent{font-weight:bold;font-size:14px;margin-bottom:4px;color:var(--rw-brand)}
    .msg{font-size:16px;white-space:pre-wrap;word-wrap:break-word}
    .dur{font-size:12px;font-style:italic;position:absolute;bottom:4px;right:10px;color:var(--rw-info)}
    .err{margin-top:6px;font-size:14px;color:#b00020}
  </style>

    <h2>Session: ${sessionId}</h2>
    <div class="chat">
      ${bubbles}
    </div>
  </div>`;
    }
  
    function htmlEscape(str) {
        if (!str || str.length == 0 || str == '""') return '';
      return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
    }
  
    function _fail(ctx, msg) {
      ctx.response.writeHead(400, { 'Content-Type': 'text/plain' });
      ctx.response.write(msg);
    }
  
    /* ------------------------------------------------------------------ */
    return { onRequest };
  });
  