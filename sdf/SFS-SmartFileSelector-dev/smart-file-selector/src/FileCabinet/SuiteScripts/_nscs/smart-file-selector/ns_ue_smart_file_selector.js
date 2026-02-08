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
 *  Version         Date           Author               Remarks
 *  1.00            5 May 2025    mgutierrez           Initial release
 *
 * This process adds a button onto the page for message records.  When that button is clicked, the files tied to the transaction show up to select.  
 * Selecting those files and clicking attach will add them to the email.  This makes it simpler and faster to add files.
 * 
 *
 */

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @ModuleScope Public
 */

define(['N/ui/serverWidget', 'N/search', 'N/file'], (ui, search, file) => {

  const FIELD_ID = 'custpage_ns_atch_msg_button';
  const MAX_TOTAL_MB = 15.0;
  const MAX_SINGLE_MB = 10.0;

  function beforeLoad(context) {

      let strTitle = 'beforeLoad';
      try {
          addFileButton(context);
      } catch (ex) {
          log.error(strTitle, ex)
      }


  }

  function addFileButton(context) {
      if (![context.UserEventType.VIEW, context.UserEventType.EDIT, context.UserEventType.CREATE].includes(context.type)) return;

      const form = context.form;
      const currentRecord = context.newRecord;

      // Step 1: Retrieve parent record attachments
      const parentId = currentRecord.getValue({
          fieldId: 'record'
      });
      const parentType = currentRecord.getValue({
          fieldId: 'recordtype'
      });
      const transaction = currentRecord.getValue({
          fieldId: 'transaction'
      });
      const entity = currentRecord.getValue({
          fieldId: 'entity'
      });

      log.debug('Parent Record Info', `ID: ${parentId}, Type: ${parentType} Entity: ${entity} Transaction: ${transaction}`);
      let attachments = [];

      if (transaction) {
          log.debug('Transaction ID', transaction);
          attachments = getTxAttachments(transaction);
      }

      // Step 2: Render the HTML interface
      const fileRows = attachments.map(file => `
      <tr>
        <td><input type="checkbox" class="fileCheckbox" data-size="${file.size}" data-id="${file.id}" /></td>
        <td><a href="${file.url}" target="_blank">${file.name}</a></td>
        <td>${file.size.toFixed(3)}</td>
        <td>${file.date}</td>
      </tr>`).join('');

      form.addField({
          id: FIELD_ID,
          type: ui.FieldType.INLINEHTML,
          label: 'Select Record Attachments',
          container: 'attachments'
      }).defaultValue = `
    <style>
      #nsAttachFilePicker,
      #attachFiles,
      #cancelAttach {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
      }
      #nsAttachFilePicker {
        background-color: #406f86;
        color: white;
      }
      #attachFiles {
        background-color: #5390a5;
        color: white;
      }
      #cancelAttach {
        background-color: #e0e0e0;
        color: #333;
        margin-left: 8px;
      }
      #filePickerModal {
        margin-top: 12px;
        background: white;
        border: 1px solid #ccc;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      #filePickerModal table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        text-align: left;
      }
      #filePickerModal th,
      #filePickerModal td {
        padding: 6px 8px;
        vertical-align: middle;
      }
      #filePickerModal tr.even {
        background-color: #f9f9f9;
      }
      #filePickerModal tr.odd {
        background-color: #ffffff;
      }
      #filePickerModal th {
        background-color: #eeeeee;
        font-weight: bold;
      }
      #sizeWarning {
        color: #B22222;
        font-weight: bold;
      }
    </style>
    <div style="margin: 8px 0;">
      <div id="nsAttachFilePicker">Select Record Attachments</div>
      <div id="filePickerModal" style="display:none;">
        <h3 style="margin-top:0; font-size:16px;">Select Files to Attach</h3>
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAll" checked /></th>
              <th>File Name</th>
              <th>Size (MB)</th>
              <th>Upload Date</th>
            </tr>
          </thead>
          <tbody>${fileRows}</tbody>
        </table>
        <div style="margin-top:8px; display:flex; justify-content:space-between;">
          <span id="totalSize">Total: 0.0 MB</span>
          <span id="sizeWarning" style="display:none;">⚠️ Limit exceeded (Max 15MB total / 10MB per file)</span>
        </div>
        <div style="margin-top:10px; text-align:right;">
        <div id="attachFiles" onclick="window.attachMedia()">Attach</div>
          <div id="cancelAttach">Cancel</div>
        </div>
      </div>
      <script>
        var bFileSizeError = false;
        (function(){
          function updateSize() {
            const boxes = document.querySelectorAll('.fileCheckbox');
            let total = 0, error = false;
            boxes.forEach(cb => {
              if (cb.checked) {
                const size = parseFloat(cb.dataset.size);
                total += size;
                if (size > ${MAX_SINGLE_MB}) error = true;
              }
            });
            document.getElementById('totalSize').innerText = "Total: " + total.toFixed(1) + " MB";
            bFileSizeError = (total > ${MAX_TOTAL_MB} || error);
            document.getElementById('sizeWarning').style.display = bFileSizeError ? 'inline' : 'none';
            document.getElementById("attachFiles").style.display = bFileSizeError ? 'none': 'inline-block';
            
          }
          function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
          }
          window.attachMedia = async function() {
            
            if(!bFileSizeError){
            const checkboxes = Array.from(document.getElementsByClassName('fileCheckbox')).filter(cb => cb.checked);
            for (let i = 0; i < checkboxes.length; i++) {
              const fileId = checkboxes[i].dataset.id;
              nlapiSelectNewLineItem('mediaitem');
              nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', fileId,true,true);
             // await delay(2000); // Introduce delay before committing
              nlapiCommitLineItem('mediaitem');
            }
            document.getElementById('filePickerModal').style.display = 'none';
          }
          };
          document.addEventListener('DOMContentLoaded', function(){
            document.getElementById('nsAttachFilePicker').onclick = function(e) {
              e.preventDefault();
              document.getElementById('filePickerModal').style.display = 'block';
            };
            document.getElementById('cancelAttach').onclick = function(e) {
              e.preventDefault();
              document.getElementById('filePickerModal').style.display = 'none';
            };
            document.getElementById('attachFiles').onclick = function(e) {
              e.preventDefault();
              attachMedia();
            };
            document.getElementById('selectAll').onchange = function() {
              document.querySelectorAll('.fileCheckbox').forEach(cb => cb.checked = this.checked);
              updateSize();
            };
            document.querySelectorAll('.fileCheckbox').forEach(cb => cb.onchange = updateSize);
            updateSize();
          });
        })();
      </script>
    </div>
  `;
  }

  function getTxAttachments(transaction) {
      var transactionSearchObj = search.create({
          type: 'transaction',
          settings: [{
              'name': 'consolidationtype',
              'value': 'ACCTTYPE'
          }],
          filters: [
              ['internalidnumber', 'equalto', transaction],
              'AND',
              ['mainline', 'is', 'T']
          ],
          columns: [
              search.createColumn({
                  name: 'transactionname',
                  label: 'Transaction Name'
              }),
              search.createColumn({
                  name: 'created',
                  join: 'file',
                  label: 'Date Created'
              }),
              search.createColumn({
                  name: 'description',
                  join: 'file',
                  label: 'Description'
              }),
              search.createColumn({
                  name: 'name',
                  join: 'file',
                  label: 'Name'
              }),
              search.createColumn({
                  name: 'filetype',
                  join: 'file',
                  label: 'Type'
              }),
              search.createColumn({
                  name: 'url',
                  join: 'file',
                  label: 'URL'
              }),
              search.createColumn({
                  name: 'internalid',
                  join: 'file',
                  label: 'Internal ID'
              })
          ]
      });
      var arrResult = [];
      var searchResultCount = transactionSearchObj.runPaged().count;
      log.debug('transactionSearchObj result count', searchResultCount);
      transactionSearchObj.run().each(function(result) {
          log.debug('transactionSearchObj result', result);
          // .run().each has a limit of 4,000 results

          var fileName = result.getValue({
              name: 'name',
              join: 'file'
          });
          var fileId = result.getValue({
              name: 'internalid',
              join: 'file'
          });
          var fileUrl = result.getValue({
              name: 'url',
              join: 'file'
          });
          var fileDate = result.getValue({
              name: 'created',
              join: 'file'
          });
          var fileType = result.getValue({
              name: 'filetype',
              join: 'file'
          });
          var fileDesc = result.getValue({
              name: 'description',
              join: 'file'
          });
          if (!fileId) {
              return;
          }
          const objFile = file.load({
              id: fileId
          });
          const fileSizeInBytes = objFile.size;
          const fileSizeInMB = fileSizeInBytes / (1024 * 1024); // Convert bytes to MB
          var fileObj = {
              id: fileId,
              name: fileName,
              size: parseFloat(fileSizeInMB),
              date: fileDate,
              url: fileUrl,
              type: fileType,
              desc: fileDesc
          };
          log.debug('fileObj', fileObj);
          arrResult.push(fileObj);
          return true;
      });
      return arrResult;

  }

  return {
      beforeLoad
  };

});