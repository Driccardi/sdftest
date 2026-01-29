/**
 * Copyright (c) 1998-2025 Oracle NetSuite, Inc.
 *  500 Oracle Parkway Redwood Shores, CA 94065 USA
 *  All Rights Reserved.
 *
 *  Version     Date          Author      Remarks
 *  1.00        2025-07-16    riccardi    Ephemeral agent-to-agent processor
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define([
    'N/runtime',
    'N/log',
    './ns_li_llm_agent',
    './ns_li_llm_message',
    './ns_li_wfll_utils',
    'N/llm',
  ], (runtime, log, agentLib, msgLib, wfUtil,llm) => {
    'use strict';
  
    /* ------------------------------------------------------------------ *
     *  Constants
     * ------------------------------------------------------------------ */
    const PARAM_JSON = 'custscript_ns_llm_queuemsg';       // queued by queueEphemeral()
    const DATA_TYPE_TEXT = msgLib.DataType.TEXT || 1;  // fallback to ID 1 if enum absent
  
    /* ===================================================================
     *  Entry
     * =================================================================== */
    function execute(context) {
        log.audit('Live Agent Action', 'Start Agent-to-Agent conversation');
        const usage = llm.getRemainingFreeUsage();
        if (usage < wfUtil.LOW_USAGE_THRESHOLD) {
            log.error('Live Agent Action', `Low free usage: ${usage} tokens remaining. Override required to continue.`);
            return _fail(`Low free usage: ${usage} tokens remaining. Override required to continue.`);
        }
        log.audit('Live Agent Action', `Free usage: ${usage} tokens remaining.`);

      wfUtil.DEFAULT_JSON_FORMAT = wfUtil.DEFAULT_AGENT_FORMAT;
  
      const raw = runtime.getCurrentScript().getParameter({ name: PARAM_JSON }) || '';
      log.debug('Live Agent Action', `Raw payload: ${raw}`);
      if (!raw) return _fail('No payload parameter found');
  
      let pay;
      try { pay = JSON.parse(raw); }
      catch (e) { return _fail(`Malformed JSON payload: ${raw}`); }
  
      /* ---------- validate ---------- */
      
      let toId   = pay.toAgentId;
      const from = pay.fromAgentId || null;
      const msgText = pay.body || pay.messageText || '';
      const convoSession = pay.session|| wfUtil.generateSessionId();
      const agentSession = convoSession + '_' + toId; 
      const retentionPolicy = pay.retentionPolicy || agentLib.load(from).retentionPolicy;
      const history = pay.history || wfUtil.getHistory(agentSession,retentionPolicy) || [];
      const isRetry = pay.isRetry || false;
  
      if (!toId || !msgText) return _fail('Missing toAgentId or messageText');
  
      /* numeric-or-name resolution */
      if (isNaN(toId)) toId = agentLib.getAgentByName(toId);
      if (!toId) return _fail(`Recipient agent not found: ${pay.toAgentId}`);
  
      const agent = agentLib.load(toId);
  
      /* ---------- run agent prompt ---------- */
      let response = {};
      try {
        let prompt = agent.promptRec;
        const promptId = agent.promptRec.id;

        /**************** BAIL OUT BAIL OUT  - RUNAWAY TRAIN  *******************/
        if(history.length > msgLib.MAX_CONVERSATION_LENGTH){
          log.error('Live Agent Action', `History too long (${history.length} messages), aborting action.`);
          return _fail(`History too long (${history.length} messages), aborting action.`);
        }
        /**************** BAIL OUT BAIL OUT  - RUNAWAY TRAIN  *******************/


        if (!history.length) { // we're starting a new conversation
          log.debug('Live Agent Action', `Starting new conversation with agent ${toId}`);
        //   response = wfUtil.runPromptWithRAG(
        //     agent.prompt,
        //     agent.documents,
        //     { messagetext: msgText },
        //     null,
        //     wfUtil.Format.JSON, agent.id
        //   );
            //get the prompt by ID to ensure it exists
            if (!prompt) {
                log.error('runPromptWithRag', 'No prompt found for ID: ' + promptId);
                return { text: '[ERROR: No prompt found for ID: ' + promptId + ']' };
            }
            //log.debug('Prompt Details', prompt);
            let strPrompt =  prompt.template;
            strPrompt = wfUtil.mergeVars(strPrompt, { messagetext: msgText },);
        
            let options = {
                prompt: strPrompt,
                preamble: prompt.preamble,
                documents: agent.documents,
                modelFamily: llm.ModelFamily[prompt.modelfamily],
                structure    : wfUtil.Format.JSON,
                sessionId    : agentSession,
                chatHistory  : history,
                agent        : agent.id,
                memory       : retentionPolicy,
                modelParameters: {
                    temperature: Number(prompt.temperature),
                    maxTokens: Number(prompt.maxtokens),
                    topP: Number(prompt.topp),
                    topK: Number(prompt.topk),
                    frequencyPenalty: Number(prompt.frequencypenalty),
                    presencePenalty: Number(prompt.presencePenalty)
                },
                ociConfig:  null
            };
           // log.debug('runPromptWithRag', 'Running prompt with options: ' + JSON.stringify(options));
            response = wfUtil.generate(options);
        } else {
            log.debug('Live Agent Action', `History: ${history.length} messages, continuing conversation with agent ${toId}`);
          response = wfUtil.generate({
            prompt       : msgText,
            preamble     : prompt.preamble,
            modelFamily  : llm.ModelFamily[prompt.modelfamily],
            ociConfig    : null,
            structure    : wfUtil.Format.JSON,
            sessionId    : agentSession,
            memory       : retentionPolicy,
            chatHistory  : history,
            agent        : agent.id,
            modelParameters: {
                temperature: Number(prompt.temperature),
                maxTokens: Number(prompt.maxtokens),
                topP: Number(prompt.topp),
                topK: Number(prompt.topk),
                frequencyPenalty: Number(prompt.frequencypenalty),
                presencePenalty: Number(prompt.presencePenalty)
            }
          });
        }
      } catch (e) {
        return _fail(`LLM execution error: ${e.message}`);
      }
  
      /* ---------- parse agent response ---------- */
      let respObj;
      log.debug('Live Agent Action', `Response from Agent ${toId}: ${JSON.stringify(response)}`);
      try { respObj = JSON.parse(response.text.trim()); }
      catch (e) {
            var errAgent = agentLib.load(agentLib.getAgentByName('Error Handling Agent'));
            log.error('Malformed JSON Response from Agent', `Payload: ${response.text}`);
            if(!isRetry){
                log.error('Live Agent Action', `Retrying with Error Handling Agent ${errAgent.id}`);
            const msg = msgLib.newMessage({
                to            : agent.id,
                from          : errAgent.id,
                dataTypeId    : DATA_TYPE_TEXT,
                messageText   : `Your response was malformed JSON:  ${response.text}    Please fix your response and try again. Please do not add any new information. Only reformat the text string to valid JSON and output only the JSON.`,
                session       : convoSession,
                replyRequired : true,
                isRetry       : true
            });
             msg.send(msgLib.DELIVERY.EPHEMERAL);   // Send the same way it was received
             return; 
            }else {
                return _fail(`Malformed JSON response after retry: ${response.text}`);
            } 
        } 

      /* --------------- Are we done? --------------- */
      if (agentLib.isConversationOver(respObj.messageText)  || (respObj.end) || respObj.ReplyRequired === false) {
        log.debug('Live Agent Action', `Conversation ended by agent ${toId}`);
        return _fail(`Conversation ended by agent ${toId}`);
      }  
  
      /* ---------- create follow-up message ---------- */
      try {
            log.debug('Live Agent Action', `Response to send: ${JSON.stringify(respObj)}`);
            const msg = msgLib.newMessage({
            to            : respObj.toAgentId || null,
            from          : agent.id,
            dataTypeId    : DATA_TYPE_TEXT,
            messageText   : respObj.messageText || '',
            session       : convoSession,
            replyRequired : respObj.replyRequired || false,
            isRetry       : false
            });
            msg.send(msgLib.DELIVERY.EPHEMERAL);   // Send the same way it was received
            log.debug('Live Agent Action', `Follow-up message sent: ${msg.messageText}`);


      } catch (e) {
        return _fail(`Failed to create/send follow-up message: ${e.message}`);
      }
  
      log.audit('Ephemeral Live-Agent run', {
        convoSession,
        fromAgent : toId,
        toAgent   : from,
        nextAgent : respObj.toAgentId || null,
        textSent  : respObj.messageText || ''
      });
    }
  
    /* ------------------------------------------------------------------ */
    function _fail(msg) {
      log.error('Ephemeral Live-Agent error', msg);
    }
  
    /* ------------------------------------------------------------------ */
    return { execute };
  });
  