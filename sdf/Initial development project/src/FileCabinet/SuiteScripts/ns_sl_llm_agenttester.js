/**
 * ns_sl_llm_agenttester.js  (update v2)
 * --------------------------------------------------------------
 * • Left card: Agent-to-Agent test form (unchanged inputs)
 * • Right card: Live chat viewer that polls customscript_ns_llm_chatviewer
 *   every 10 s and replaces only the div content (spinner while loading)
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define([
    'N/url',
    'N/query',
    'N/runtime',
    'N/log',
    './ns_li_llm_agent',
    './ns_li_llm_message',
    './ns_li_wfll_utils'
  ], (urlMod, query, runtime, log, agentLib, msgLib,llmUtil) => {
    'use strict';
  
    /* ───────────────────────────────────────────────────────────────── */
    const DATA_TYPE_TEXT = 1;                                 // example
  
    function onRequest(ctx) {
      if (ctx.request.method === 'POST') return _handlePost(ctx);
      return _renderForm(ctx);
    }
  
    /* ───────────── GET ───────────── */
    function _renderForm(ctx, opts = {}) {
      const agents = agentLib.list();
      const optHtml = agents.map(a => `<option value="${a.id}">${html(a.name)}</option>`).join('');
      const preSel  = id => (id ? ` value="${id}"` : '');
      const convo  = opts.conversationJSON || '';  // placeholder
  
      const chatUrlJS = opts.chatUrl ? `<script>const CHAT_URL="${opts.chatUrl}";</script>` : '';
  
      ctx.response.write(`
  <!DOCTYPE html><html><head>
  <meta charset="utf-8"/><title>LLM Agent Tester</title>
  <style>
    /* Redwood subset, page layout & spinner */
    :root{--rw-font:'Oracle Sans','Helvetica Neue',sans-serif;--rw-body:16px;
          --rw-brand:#227e9e;--rw-neutral-0:#fff;--rw-neutral-50:#f4f5f6;
          --rw-border:1px solid #d7d9dc;--rw-radius:8px;--rw-pad:14px;}
    *{box-sizing:border-box;font-family:var(--rw-font)}
    body{margin:0;background:var(--rw-neutral-50);padding:var(--rw-pad)}
    h1{margin:0 0 var(--rw-pad)}
    .grid{display:grid;grid-template-columns:360px 1fr;gap:var(--rw-pad)}
    .card{background:var(--rw-neutral-0);border:var(--rw-border);
          border-radius:var(--rw-radius);padding:var(--rw-pad);height:100%}
    label{display:block;margin:8px 0 4px}
    select,textarea{width:100%;padding:8px;border:var(--rw-border);
                    border-radius:var(--rw-radius)}
    textarea{resize:vertical}
    button{margin-top:12px;padding:8px 20px;background:var(--rw-brand);
           color:#fff;border:none;border-radius:var(--rw-radius);cursor:pointer}
    .viewer.loading::after{content:'';display:block;width:28px;height:28px;
          margin:20px auto;border:4px solid var(--rw-brand);border-radius:50%;
          border-top-color:transparent;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .viewer{
      overflow-y:scroll;
      max-height:800px;
      height:600px;
      }
        .info{
      color:var(--rw-color-text-info);
      white-space:pre-wrap;
      word-wrap:break-word;
      max-height:800px;
      overflow:scroll;
      height:600px;
      width:100%;
    }
    .info_card{
      background:var(--rw-neutral-0);
      border:var(--rw-border);
      border-radius:var(--rw-radius);
      padding:var(--rw-pad);
      width: 800px;;
    }
  </style>
  ${chatUrlJS}
  </head><body>
  <h1>LLM Agent Tester</h1>
  <div class="grid">
  
    <!-- Form card -->
    <div class="card">
      <form method="POST">
        <label>Deliver-To Agent:</label>
        <select name="agentId" required>
          <option value="">— Choose —</option>${optHtml}
        </select>
  
        <label style="margin-top:10px">From Agent:</label>
        <select name="fromAgent" required>
          <option value="">— Choose —</option>${optHtml}
        </select>
  
        <label style="margin-top:10px">Delivery Method:</label>
        <select name="deliverymethod" required>
          <option value="">— Choose —</option>
          <option value="LIVE">LIVE</option>
          <option value="EPHEMERAL">EPHEMERAL</option>
          <option value="STATEFUL">STATEFUL</option>
        </select>
  
        <label style="margin-top:10px">Initial Memory:</label>
        <select name="memory" required>
          <option value="">— Choose —</option>
          <option value="NONE">NONE</option>
          <option value="EPHEMERAL">EPHEMERAL</option>
          <option value="RECORD">RECORD</option>
          <option value="VECTORSTORE">VECTOR (todo)</option>
        </select>
  
        <label style="margin-top:10px">Message:</label>
        <textarea name="msgText" rows="4" required></textarea>
  
        <button type="submit">Send</button>
      </form>
    </div>

  
    <!-- Live chat viewer card -->
    <div class="card viewer" id="chatViewer">${opts.initialHtml || '<em>Submit to start…</em>'}</div>
            <!-- Conversation card -->
    <div class="card info_card">
      <div id="conversation" class="info">
        ${convo ? `<pre>${escapeHtml(convo)}</pre>` : ''}
      </div>
    </div>
  
  </div>
  
  ${opts.chatUrl ? _autoRefreshJS() : ''}
  
  </body></html>`);

    }  

    /* -------------------------------------------------------------- *
     *  Helpers
     * -------------------------------------------------------------- */
    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#039;');
    }

  
    /* ───────────── Helpers ───────────── */
    function _autoRefreshJS() {
      return `<script>
        const viewer = document.getElementById('chatViewer');
        async function reload() {
          viewer.classList.add('loading');
          try {
            const res = await fetch(CHAT_URL, { cache:'no-store' });
            viewer.innerHTML = await res.text();
          } catch(e){
            console.error('Chat refresh error', e);
          } finally {
            viewer.classList.remove('loading');
          }
        }
        reload();
        setInterval(reload, 10000);
      </script>`;
    }
    function html(str){
      return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                            .replace(/>/g,'&gt;').replace(/\"/g,'&quot;')
                            .replace(/'/g,'&#039;');
    }
            /* -------------------------------------------------------------- *
     *  Handle POST
     * -------------------------------------------------------------- */
            function _handlePost(ctx) {
                const request = ctx.request;
                const agentId = Number(request.parameters.agentId || 0);
                const msgTxt  = (request.parameters.msgText || '').trim();
                const deliveryMethod = request.parameters.deliverymethod || 'EPHEMERAL';
                const fromAgent = Number(request.parameters.fromAgent || 0);
                const memory = request.parameters.memory || 'EPHEMERAL';
        
                if (!agentId || !msgTxt) {
                    log.error('Validation', { agentId, msgTxt });
                    return _renderForm(ctx, { selectedId: agentId });
                }
        
                /* Generate a throw-away session GUID for this test */
                const session = llmUtil.generateSessionId();
                log.debug('Test Agent Session ID', session);
                      /* build chat-viewer URL */
                const chatUrl = urlMod.resolveScript({
                    scriptId         : 'customscript_ns_llm_chatview',
                    deploymentId     : 'customdeploy_ns_llm_chatviewer',
                    returnExternalUrl: false,
                    params           : { sessionId: session }
                });
      
                /* initial HTML to avoid empty panel before first AJAX pull */
                const initHtml = '<em>Loading chat…</em>';
        
                const m1 = msgLib.newMessage({
                    to            : agentId || null,
                    from          : fromAgent || null,
                   dataTypeId    : msgLib.DataType.TEXT,
                    messageText   : msgTxt|| "",
                    session       : session,
                    replyRequired : true,
                    retentionPolicy: memory // use ephemeral memory for test
                  });
                  m1.response = m1.send(deliveryMethod);
        
                /* Pass reply JSON back to form for display */
                _renderForm(ctx, {
                    selectedId       : agentId,
                    conversationJSON : JSON.stringify(m1, null, 2),
                    chatUrl,
                    initialHtml: initHtml,
                });
            }
  
    /* ─────────────────────────────────────────────────────────────── */
    return { onRequest };
  });
  