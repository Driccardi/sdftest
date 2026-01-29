/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/query', 'N/url', 'N/redirect', 'N/record'], function (ui, query, url, redirect, record) {

    // Fields from redirect
    const REDIRECT_FIELDS = ['id', 'type'];
  
    function onRequest(context) {
      const request = context.request;
      const response = context.response;
  
      if (request.method === 'GET') {
        try {
          // Create the form
          const form = ui.createForm({ title: 'Transaction Lookup by Amount' });
  
          // Add filter group to form
          form.addFieldGroup({ id: 'filters', label: 'Search Filters' });
  
          // Add mandatory Amount filter field
          const amountField = form.addField({
            id: 'amount_filter',
            type: ui.FieldType.CURRENCY,
            label: 'Amount',
            container: 'filters'
          });
          amountField.isMandatory = true;
  
          // Add Transaction Type dropdown field
          const typeField = form.addField({
            id: 'type_filter',
            type: ui.FieldType.SELECT,
            label: 'Transaction Type',
            container: 'filters'
          });
  
          // Add empty option
          typeField.addSelectOption({
            value: '',
            text: '',
            isSelected: true
          });
  
          // Populate dropdown with transaction types
          const arrOptions = getTranRefTable();
          if (!arrOptions || arrOptions.length === 0) throw 'No transaction types found.';
  
          arrOptions.forEach(entry => {
            typeField.addSelectOption({
              value: entry.custrecord_ns_tx_xref_suiteql,
              text: entry.name
            });
          });
          log.debug("arr options",arrOptions);
  
          // Add submit button
          form.addSubmitButton({ label: 'Search' });
  
          // Render the form
          response.writePage(form);
  
        } catch (error) {
          log.error({ title: 'Error in GET Suitelet', details: error });
          const errorForm = ui.createForm({ title: 'Error' });
          errorForm.addField({
            id: 'error_message',
            type: ui.FieldType.INLINEHTML,
            label: 'Error'
          }).defaultValue = `<div style="color:red;">${error}</div>`;
          errorForm.addButton({ id: 'back', label: 'Back', functionName: "history.back()" });
          response.writePage(errorForm);
        }
      }
  
      if (request.method === 'POST') {
        try {
          // Extract search params
          let flAmount = parseFloat(request.parameters.amount_filter);
          let strTranType;

          log.debug("entered amount",flAmount);

          if( request.parameters.type_filter === "PurchOrd"){
            strTranType = "purchaseorder";
          }
          else{
            strTranType = request.parameters.type_filter;
          }

          log.debug("tran type",strTranType);

          log.debug('POST parameters', request.parameters);
  
          flAmount = isNaN(flAmount) ? null : flAmount;
          if (!flAmount) throw 'Amount is required.';
  
          // Run transaction query
          const arrResults = getTransaction(flAmount, strTranType);
          log.debug('Transaction Results', arrResults);
  
          // No matching transactions
          if (arrResults.length === 0) {
            log.audit('TRAM Lookup', 'No transactions found for the given amount and type.');
            const noResultForm = ui.createForm({ title: 'No Results Found' });
            noResultForm.addField({
              id: 'no_results',
              type: ui.FieldType.INLINEHTML,
              label: 'No Results'
            }).defaultValue = '<div style="color:red;">No transactions found for the given amount and type.</div>';

            noResultForm.clientScriptModulePath = './ns_cs_tram.js'; // We'll define this shortly
            noResultForm.addButton({ id: 'back', label: 'New Search', functionName: "history.back()" });
            response.writePage(noResultForm);


            return;
          }
  
          // Only one result: redirect directly
          if (arrResults.length === 1) {
            const rec = arrResults[0];
            redirect.toRecord({
              type: record.Type[rec.ssenum],
              id: rec.id,
              isEditMode: false
            });
            return;
          }
  
          // Multiple results: show sublist
          const resultForm = ui.createForm({ title: 'Matching Transactions' });
  
          const sublist = resultForm.addSublist({
            id: 'results',
            type: ui.SublistType.LIST,
            label: 'Transactions'
          });
  
          sublist.addField({ id: 'link', label: 'Transaction', type: ui.FieldType.TEXT });
          sublist.addField({ id: 'status', label: 'Status', type: ui.FieldType.TEXT });
          sublist.addField({ id: 'entity', label: 'Customer/Vendor', type: ui.FieldType.TEXT });
          sublist.addField({ id: 'amount', label: 'Amount', type: ui.FieldType.CURRENCY });
          sublist.addField({ id: 'trandate', label: 'Transaction Date', type: ui.FieldType.DATE });
          sublist.addField({ id: 'createddate', label: 'Created Date', type: ui.FieldType.DATE });
  
          // Populate results
          arrResults.forEach((rec, i) => {
            const recUrl = url.resolveRecord({
              recordType: record.Type[rec.ssenum],
              recordId: rec.id,
              isEditMode: false
            });

            sublist.setSublistValue({ id: 'link', line: i, value: `<a class="dottedlink" target="_blank" href="${recUrl}">${rec.tranid || ''}</a>` });
            sublist.setSublistValue({ id: 'status', line: i, value: rec.status || '' });
            sublist.setSublistValue({ id: 'entity', line: i, value: rec.customer || "1233" });
            sublist.setSublistValue({ id: 'amount', line: i, value: rec.amount != null ? rec.amount.toString() : '0.00' });
            sublist.setSublistValue({ id: 'trandate', line: i, value: rec.trandate || '' });
            sublist.setSublistValue({ id: 'createddate', line: i, value: rec.createddate || '' });

          });

          resultForm.clientScriptModulePath = './ns_cs_tram.js'; // We'll define this shortly
          resultForm.addButton({ id: 'back', label: 'New Search', functionName: "redirectToSuitelet" });
          response.writePage(resultForm);
  
        } catch (error) {
          log.error({ title: 'Error in POST Suitelet', details: error });
          const errorForm = ui.createForm({ title: 'Error' });
          errorForm.addField({
            id: 'error_message',
            type: ui.FieldType.INLINEHTML,
            label: 'Error'
          }).defaultValue = `<div style="color:red;">${error}</div>`;
          errorForm.addButton({ id: 'back', label: 'Back', functionName: "history.back()" });
          response.writePage(errorForm);
        }
      }
    }
  
    // --- Helpers ---
  
    /**
     * Looks up a specific transaction by type and tranid.
     */
    function getTranReference(tranType, tranId) {
      const sql = `
        SELECT id, type, tranid
        FROM transaction
        WHERE type = ?
        AND tranid = ?
      `;
      const results = query.runSuiteQL({ query: sql, params: [tranType, tranId] }).asMappedResults();
      return results.length === 1 ? results[0] : null;
    }
  
    /**
     * Loads custom transaction type reference list
     */
    function getTranRefTable() {
      const sql = `SELECT * FROM customrecord_ns_txref`;
      return query.runSuiteQL({ query: sql, params: [] }).asMappedResults();
    }
  
    /**
     * Searches for transactions matching amount and (optionally) type
     */
    function getTransaction(flAmount, strTranType) {
      let sql = `
        SELECT DISTINCT t.id, BUILTIN.DF(t.status) status, t.type, t.tranid, BUILTIN.DF(t.entity) customer, 
               tl.foreignAmount amount, t.trandate, t.createddate, tr.custrecord_ns_tx_xref_ssenum ssenum
        FROM transaction t, transactionline tl, customrecord_ns_txref tr
        WHERE t.id = tl.transaction
          AND tl.foreignAmount = ?
          AND tl.mainline = 'T'
          AND t.type = tr.custrecord_ns_tx_xref_suiteql
      `;
      if (strTranType && strTranType !== '') {
        sql += ` AND t.type = ?`;
      }
      sql += ` ORDER BY t.trandate DESC`;
  
      const params = strTranType ? [flAmount, strTranType] : [flAmount];
      return query.runSuiteQL({ query: sql, params }).asMappedResults();
    }
  
    return { onRequest };
  });
  