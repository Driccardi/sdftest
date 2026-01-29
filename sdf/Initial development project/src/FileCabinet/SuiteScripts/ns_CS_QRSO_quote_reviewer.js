/* 
* Copyright (c) 1998-2023 Oracle NetSuite, Inc.
* 500 Oracle Parkway Redwood Shores, CA 94065 United States 650-627-1000
* All Rights Reserved.
* This software is the confidential and proprietary information of
* NetSuite, Inc. ('Confidential Information'). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Oracle NetSuite.
*
* Version Date Author Remarks
* 1.00 [Today's date] riccardi initial build
*/
 
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(['N/url', 'N/currentRecord', 'N/runtime', 'N/https'], function (url, currentRecord, runtime, https) {
    'use strict';

    const LOG_PREFIX = 'QRSO-CS';

    /**
     * Redwood style helpers (lightweight CSS-in-JS injected once)
     */
    function injectStylesOnce() {
        if (document.getElementById('qrso-redwood-styles')) return;
        const style = document.createElement('style');
        style.id = 'qrso-redwood-styles';
        style.textContent = `
        :root{
          --rw-bg:#ffffff; --rw-surface:#f8f9fb; --rw-brand:#3f51b5; --rw-text:#1f2937;
          --rw-muted:#6b7280; --rw-border:#e5e7eb; --rw-danger:#b00020; --rw-success:#0f9d58;
        }
        .qrso-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.32);display:flex;align-items:center;justify-content:center;z-index:9999;}
        .qrso-modal{background:var(--rw-bg);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2);width:720px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--rw-border);}
        .qrso-modal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--rw-surface);border-bottom:1px solid var(--rw-border);}
        .qrso-title{font-weight:600;color:var(--rw-text);font-size:16px;}
        .qrso-close{border:0;background:transparent;font-size:18px;cursor:pointer;color:var(--rw-muted);}
        .qrso-body{padding:12px 0;overflow:auto;}
        .qrso-list{margin:0;padding:0;list-style:none;}
        .qrso-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 0.6fr;gap:8px;padding:10px 16px;border-bottom:1px solid var(--rw-border);align-items:center;}
        .qrso-row.header{font-weight:600;color:var(--rw-muted);background:var(--rw-surface);position:sticky;top:0;z-index:1;}
        .qrso-link{color:var(--rw-brand);text-decoration:none}
        .qrso-link:hover{text-decoration:underline}
        .qrso-footer{padding:10px 16px;display:flex;justify-content:flex-end;gap:8px;background:var(--rw-surface);border-top:1px solid var(--rw-border);}
        .qrso-btn{border:1px solid var(--rw-border);background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer}
        .qrso-btn.primary{background:var(--rw-brand);color:#fff;border-color:var(--rw-brand)}
        .qrso-toast{position:fixed;bottom:16px;right:16px;background:#111827;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.2);z-index:10000;opacity:0;transform:translateY(10px);transition:all .2s}
        .qrso-toast.show{opacity:1;transform:translateY(0)}
        .qrso-spinner{width:24px;height:24px;border-radius:50%;border:3px solid var(--rw-border);border-top-color:var(--rw-brand);animation:qrso-spin 1s linear infinite;margin-right:8px}
        .qrso-loading{display:flex;align-items:center;gap:10px;padding:12px 16px;color:var(--rw-muted)}
        @keyframes qrso-spin{to{transform:rotate(360deg)}}
        `;
        document.head.appendChild(style);
    }

    function showToast(message, isError) {
        injectStylesOnce();
        const toast = document.createElement('div');
        toast.className = 'qrso-toast';
        toast.textContent = message;
        if (isError) toast.style.background = 'var(--rw-danger)';
        document.body.appendChild(toast);
        // micro-interaction
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    }

    function closeExistingModal() {
        const existing = document.querySelector('.qrso-modal-backdrop');
        if (existing) existing.remove();
    }

    function renderModal(customerName, quotes) {
        injectStylesOnce();
        closeExistingModal();

        const backdrop = document.createElement('div');
        backdrop.className = 'qrso-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'qrso-modal';

        const header = document.createElement('div');
        header.className = 'qrso-modal-header';
        const title = document.createElement('div');
        title.className = 'qrso-title';
        title.textContent = `Open Quotes for ${customerName}`;
        const close = document.createElement('button');
        close.className = 'qrso-close';
        close.setAttribute('aria-label', 'Close');
        close.innerHTML = '✕';
        close.onclick = () => backdrop.remove();
        header.appendChild(title);
        header.appendChild(close);

        const body = document.createElement('div');
        body.className = 'qrso-body';
        const list = document.createElement('ul');
        list.className = 'qrso-list';

        // Header row
        const headerRow = document.createElement('li');
        headerRow.className = 'qrso-row header';
        ['Quote #', 'Date', 'Currency', 'Amount', 'Open'].forEach(h => {
            const div = document.createElement('div');
            div.textContent = h;
            headerRow.appendChild(div);
        });
        list.appendChild(headerRow);

        quotes.forEach(q => {
            const li = document.createElement('li');
            li.className = 'qrso-row';
            const a = document.createElement('a');
            a.className = 'qrso-link';
            a.href = q.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = q.tranid;

            const d = document.createElement('div'); d.textContent = q.trandate;
            const c = document.createElement('div'); c.textContent = q.currency;
            const t = document.createElement('div'); t.textContent = q.totalFormatted;
            const open = document.createElement('div'); open.textContent = 'Yes';

            li.appendChild(a);
            li.appendChild(d);
            li.appendChild(c);
            li.appendChild(t);
            li.appendChild(open);
            list.appendChild(li);
        });

        body.appendChild(list);

        const footer = document.createElement('div');
        footer.className = 'qrso-footer';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'qrso-btn';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => backdrop.remove();
        footer.appendChild(closeBtn);

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
    }

    function renderLoading() {
        injectStylesOnce();
        closeExistingModal();
        const backdrop = document.createElement('div');
        backdrop.className = 'qrso-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'qrso-modal';
        const header = document.createElement('div');
        header.className = 'qrso-modal-header';
        const title = document.createElement('div');
        title.className = 'qrso-title';
        title.textContent = 'Fetching open quotes…';
        const close = document.createElement('button');
        close.className = 'qrso-close';
        close.innerHTML = '✕';
        close.onclick = () => backdrop.remove();
        header.appendChild(title);
        header.appendChild(close);

        const body = document.createElement('div');
        body.className = 'qrso-body';
        const loading = document.createElement('div');
        loading.className = 'qrso-loading';
        const spinner = document.createElement('div');
        spinner.className = 'qrso-spinner';
        const txt = document.createElement('div');
        txt.textContent = 'Please wait…';
        loading.appendChild(spinner);
        loading.appendChild(txt);
        body.appendChild(loading);

        modal.appendChild(header);
        modal.appendChild(body);
        document.body.appendChild(backdrop);
        backdrop.appendChild(modal);
    }

    // Debounce helper
    let debounceTimer = null;
    function debounce(fn, delay) {
        return function () {
            const ctx = this; const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fn.apply(ctx, args), delay);
        };
    }

    function getSuiteletUrl() {
        // Resolve internal URL for Suitelet deployment
        try {
            return url.resolveScript({
                scriptId: 'customscript_ns_su_qrso_quote_api',
                deploymentId: 'customdeploy_ns_su_qrso_quote_api',
                returnExternalUrl: false
            });
        } catch (e) {
            console.log(`${LOG_PREFIX} resolveScript failed`, e);
            return null;
        }
    }

    async function fetchOpenQuotes(intCustomerId) {
        const strUrl = getSuiteletUrl();
        if (!strUrl) throw new Error('Unable to resolve Suitelet URL');
        const qs = `${strUrl}&customerId=${encodeURIComponent(intCustomerId)}`;
        const resp = await https.get({ url: qs });
        if (resp.code !== 200) {
            throw new Error(`Suitelet returned ${resp.code} ${resp.body}`);
        }
        return JSON.parse(resp.body);
    }

    async function tryShowQuotes() {
        try {
            const rec = currentRecord.get();
            const intCustomerId = rec.getValue({ fieldId: 'entity' });
            const strCustomerText = rec.getText({ fieldId: 'entity' });
            if (!intCustomerId) {
                closeExistingModal();
                return;
            }
            renderLoading();
            const data = await fetchOpenQuotes(intCustomerId);
            closeExistingModal();
            if (data && Array.isArray(data.quotes) && data.quotes.length > 0) {
                renderModal(strCustomerText || 'Customer', data.quotes);
            } else {
                // No quotes: do nothing, optional toast
                // showToast('No open quotes for this customer.', false);
            }
        } catch (e) {
            console.log(`${LOG_PREFIX} error`, e);
            closeExistingModal();
            showToast('Unable to retrieve open quotes. Please try again or contact admin.', true);
        }
    }

    const debouncedTryShow = debounce(tryShowQuotes, 350);

    /**
     * pageInit
     */
    function pageInit(context) {
        log.debug({ title: `${LOG_PREFIX} pageInit`, details: `Mode: ${context.mode}` });
        try {
            if (context.mode === 'create' || context.mode === 'copy' || context.mode === 'edit') {
                const rec = currentRecord.get();
                const intCustomerId = rec.getValue({ fieldId: 'entity' });
                if (intCustomerId) {
                    debouncedTryShow();
                }
            }
        } catch (e) {
            console.log(`${LOG_PREFIX} pageInit error`, e);
        }
    }

    /**
     * fieldChanged
     */
    function fieldChanged(context) {
        try {
            if (context.fieldId === 'entity') {
                debouncedTryShow();
            }
        } catch (e) {
            console.log(`${LOG_PREFIX} fieldChanged error`, e);
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});