/**
 * LLM “Live” Exchange Suitelet
 * Receives a JSON payload, coordinates Agent-to-Agent conversation,
 * logs each hop as a STATEFUL message record via msgLib.newMessage().
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define([
    'N/runtime',
    'N/https',
    'N/log',
    'N/error',
    './ns_li_llm_agent',
    './ns_li_llm_message',
    './ns_li_wfll_utils'          // for runPrompt / RAG helpers
  ], (runtime, https, log, error, agentLib, msgLib, wfUtil) => {

  
    /* ------------------------------ TODO LIST ------------------------------- */
    // 1. Add error handling for malformed JSON payloads
    // 2. Implement Agent A's error handler to reform malformed JSON responses
    // 3. Consider adding a retry mechanism for failed message sends
    // 4. Implement a more robust session management system
    // 5. Handle history retrival using agent.retentionPolicy  From agent is always the primary policy
  
    /* ================================================================== */
    function onRequest(ctx) {
        wfUtil.DEFAULT_JSON_FORMAT = wfUtil.DEFAULT_AGENT_FORMAT; // set default JSON format for agent messages
        log.audit('Live Agent Action', 'Start Agent-to-Agent conversation');
      if (ctx.request.method !== 'POST') {
        log.error('Invalid Request Method', `Expected POST, got ${ctx.request.method}`);
        ctx.response.write('POST expected');
        return;
      }
  
      _fail(ctx, 'This script is not intended to be called directly. Use the Live Agent Suitelet instead.');

      const raw = ctx.request.parameters.payload || '';
      let pay;
      try { pay = JSON.parse(raw); }
      catch (e) { 
        //TODO: Build an agent to reform malformed JSON payloads
        log.error('Malformed JSON', `Payload: ${raw}`);
        return _fail(ctx, 'Malformed payload'); 
        }
  
      /* ---------- validate base fields ---------- */
      const toId   = pay.toAgentId;
      const fromId = pay.fromAgentId || null;
      const messageText = pay.messageText || '';
      const session = pay.session || wfUtil.generateSessionId();
      const history = pay.history || wfUtil.getHistory(session) || [];

      log.debug('Live Agent Action', `Session: ${session}, From: ${fromId}, To: ${toId}, Message: ${messageText}`);
  
      /* ---------- Agent objects ---------- */
      if(isNaN(toId)){
        toId = agentLib.getAgentByName(toId);
      }
      if(!toId){
        log.error('Invalid Agent ID', `Recipient agent ID: ${toId}`);
        return _fail(ctx, 'Invalid recipient agent ID');
      }
      const agent  = agentLib.load(toId); // recipient
      let response= {};
      if(history.length == 0) {
        log.debug('No History', `Session ${session} has no history, starting fresh.`);
         response = wfUtil.runPromptWithRAG(agent.prompt, agent.documents, variables = {messagetext:messageText},null, wfUtil.Format.JSON);
      } else {
        log.debug('Continuing Conversation', `Session ${session} has ${history.length} messages.`);
        if(history.length > msgLib.MAX_CONVERSATION_LENGTH) {
          log.error('Conversation Too Long', `Session ${session} has too many messages (${history.length}).`);
          return _fail(ctx, 'Reach maximum conversation length');
        }
        response = wfUtil.generate({
            prompt: messageText,
            modelFamily: agent.prompRec.modelfamily,
            ociConfig: null, // TODO: Add OCI config if needed
            structure: wfUtil.Format.JSON,
            sessionId: session,
            chatHistory: history
        })
    }
    log.debug('Agent Response', `Response from Agent ${toId}: ${JSON.stringify(response)}`);
    // let's try and parse Agent A's response
    let responseObj;
    try { responseObj = JSON.parse(response.text); }
    catch (e) { 
      //TODO: Build an agent to reform malformed JSON payloads
      log.error('Malformed JSON Response from Agent', `Payload: ${response.text}`);
      return _fail(ctx, 'Malformed JSON Response from Agent'); 
      }


  
      /* ---------- message 1: A -> B ---------- */
      const m1 = msgLib.newMessage({
        to            : responseObj.toAgentId || null, // TODO: Fallback to Agent A's Error handler if no recipient
        from          : agent.id,
        dataTypeId    : msgLib.DataType.TEXT,
        messageText   : responseObj.messageText || "",
        session       : session,
        replyRequired : responseObj.replyRequired || false
      });
      const m1Id = m1.send(msgLib.DELIVERY.LIVE);
  
  
      /* ---------- respond to caller ---------- */
      ctx.response.setHeader({ name: 'Content-Type', value: 'application/json' });
      ctx.response.write(JSON.stringify({
        session      :session,
        status       : 'OK',
        history      : wfUtil.getHistory(session),
        finalReply   : responseObj.messageText || '',
      }));
    }
  

  
    function _fail(ctx, msg) {
      ctx.response.setHeader({ name: 'Content-Type', value: 'application/json' });
      ctx.response.write(JSON.stringify({ status: 'ERROR', message: msg }));
    }
  
    /* ------------------------------------------------------------------ */
    return { onRequest };
  });
  