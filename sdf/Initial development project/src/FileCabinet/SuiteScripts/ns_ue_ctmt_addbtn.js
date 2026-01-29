/*
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
*  1.00            08/11/2025          riccardi             initial build
*
*/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * File: ns_UE_CTMT_addbtn.js
 * Purpose: Adds a "Generate CSV Template" button and injects a Redwood-themed progress bar
 *          to the top of the form for Catalog Template Factory (CTF).
 */

define(['N/ui/serverWidget', 'N/runtime'], (serverWidget, runtime) => {

    const LOG_PREFIX = 'CTMT-UE';
  
    /**
     * beforeLoad - Add button and progress bar
     * - Adds client script module path (ns_CS_CTMT_builder.js).
     * - Adds a Redwood-styled progress bar (INLINEHTML) at the top of the form.
     * - Adds "Generate CSV Template" button wired to client function CTMT_generateTemplate().
     *
     * @param {UserEventContext.beforeLoad} context
     */
    const beforeLoad = (context) => {
      try {
        const { type, form } = context;
  
        // Skip non-UI contexts
        if (type === context.UserEventType.PRINT || type === context.UserEventType.EMAIL) {
          log.debug({ title: `${LOG_PREFIX} skip`, details: `context ${type}` });
          return;
        }
  
        // Attach client script (adjust path as deployed)
        // Example: SuiteScripts/ctf/ns_CS_CTMT_builder.js
        form.clientScriptModulePath = 'SuiteScripts/ns_cs_ctmt_builder.js';
  
        // Add Redwood-themed progress bar at top of form
        const barField = form.addField({
          id: 'custpage_ctmt_progressbar',
          type: serverWidget.FieldType.INLINEHTML,
          label: '🏭 Data Template Factory 🏭'
        });
  
        // Place above the form content
        if (barField.updateLayoutType) {
          barField.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDE
          });
        }
  
        barField.defaultValue = buildProgressBarHtml();
  
        // Add the Generate button
        form.addButton({
          id: 'custpage_ctmt_generate_btn',
          label: 'Generate CSV Template',
          functionName: 'CTMT_generateTemplate' // Implemented in ns_CS_CTMT_builder.js
        });
  
        log.debug({ title: `${LOG_PREFIX} ready`, details: 'Button and progress bar added.' });
      } catch (e) {
        log.error({ title: `${LOG_PREFIX} beforeLoad error`, details: e });
      }
    };
  
    /**
     * Builds Redwood-inspired progress bar HTML with minimal scoped CSS.
     * Steps: Collecting Schema Data → Analyzing Schema → Creating Template → Saving Template
     * Client script should toggle state classes: .is-active, .is-complete, .is-error
     *
     * IDs (for client updates):
     *  - ctf-step-collect, ctf-step-analyze, ctf-step-create, ctf-step-save
     *
     * @returns {string} HTML
     */
    function buildProgressBarHtml() {
      // Note: Colors align with your Redwood palette notes:
      // Teal 140 #375E62, Ocean 90 #5390a5, Pine 120 #426d4d, Lilac 140 #434d69, Rose 90 #b07283, Sienna 90 #b47749
      const css = `
        <style>
          /* Scoped to avoid collisions */
          .ctf-wrap { margin: 12px 0 16px 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
          .ctf-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; align-items: center; }
          .ctf-step {
            position: relative; padding: 10px 12px; border-radius: 12px;
            background: #f5f7f8; color: #334155; border: 1px solid #e2e8f0; 
            font-size: 12px; line-height: 1.2; text-transform: none; letter-spacing: .2px;
          }
          .ctf-step .ctf-label { font-weight: 600; display: block; margin-bottom: 4px; }
          .ctf-step .ctf-sub { font-size: 11px; opacity: .85; }
          .ctf-step.is-active { border-color: #5390a5; box-shadow: 0 0 0 2px rgba(83,144,165,.15) inset; }
          .ctf-step.is-complete { background: #e6f3f1; border-color: #426d4d; color: #1f3b2b; }
          .ctf-step.is-error { background: #fff1f2; border-color: #b07283; color: #7a2b3a; }
          .ctf-kicker { font-size: 11px; color: #375E62; margin-bottom: 6px; font-weight: 600; letter-spacing: .3px; }
          .ctf-hint { font-size: 11px; color: #64748b; margin-top: 6px; }
        </style>
      `;
  
      const html = `
        <div class="ctf-wrap">
          <div class="ctf-kicker">Catalog Template Factory</div>
          <div class="ctf-bar">
            <div id="ctf-step-collect" class="ctf-step is-active">
              <span class="ctf-label">Collecting Schema Data</span>
              <span class="ctf-sub">Fetching record metadata…</span>
            </div>
            <div id="ctf-step-analyze" class="ctf-step">
              <span class="ctf-label">Analyzing Schema</span>
              <span class="ctf-sub">Normalizing fields…</span>
            </div>
            <div id="ctf-step-create" class="ctf-step">
              <span class="ctf-label">Creating Template</span>
              <span class="ctf-sub">Composing CSV columns…</span>
            </div>
            <div id="ctf-step-save" class="ctf-step">
              <span class="ctf-label">Saving Template</span>
              <span class="ctf-sub">File Cabinet & download…</span>
            </div>
          </div>
          <div class="ctf-hint">Progress updates will appear as steps complete.</div>
        </div>
      `;
  
      return css + html;
    }
  
    return { beforeLoad };
  });
  