/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @ModuleScope Public
 */

define(['N/currentRecord'], (currentRecord) => {

    function pageInit(context) {
      const attachButton = document.getElementById('attachFiles');
      if (!attachButton) return;
  
      attachButton.addEventListener('click', function (e) {
        e.preventDefault();
  
        const currRec = currentRecord.get();
        const fileCheckboxes = document.querySelectorAll('.fileCheckbox:checked');
  
        fileCheckboxes.forEach(cb => {
          const fileId = cb.dataset.id;
          if (!fileId) return;
  
          const lineCount = currRec.getLineCount({ sublistId: 'mediaitem' });
          let alreadyAttached = false;
  
          for (let i = 0; i < lineCount; i++) {
            const existingId = currRec.getSublistValue({
              sublistId: 'mediaitem',
              fieldId: 'mediaitem',
              line: i
            });
            if (parseInt(existingId, 10) === parseInt(fileId, 10)) {
              alreadyAttached = true;
              break;
            }
          }
  
          if (!alreadyAttached) {
            currRec.selectNewLine({ sublistId: 'mediaitem' });
            currRec.setCurrentSublistValue({ sublistId: 'mediaitem', fieldId: 'mediaitem', value: fileId });
            currRec.commitLine({ sublistId: 'mediaitem' });
          }
        });
  
        // Close modal
        document.getElementById('filePickerModal').style.display = 'none';
      });
    }
  
    return { pageInit };
  });
  