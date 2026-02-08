/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
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
*  Version          Date          Author               Remarks
*  1.00            17 Nov 2022    riccardi             initial build
*/
 define(['N/error','N/query','N/record','N/search','N/url','N/runtime'],
 function(error,query,record,search,url,runtime) {
    window.poppedLines = [];  // global scope to hold for this pageload
    window.addqty = {}; // global scope to hold the expected quantity of the add-on items.

     function validateLine(context) {
         var currentRecord = context.currentRecord;
         var sublistName = context.sublistId;
         const thisScript = runtime.getCurrentScript();
         var popOnce  = thisScript.getParameter({ name: 'custscript_nscs_poponce'});
         log.debug('Pop Once',popOnce);
         if (sublistName === 'item'){
             var item       = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'item'                      });
             var rate       = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'rate'                      });
             var linekey    = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'custcol_ns_lineparentkey'  });
             var childkey   = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'custcol_ns_linechildkey'   });
             var parentitem = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'custcol_ns_addonparent'    });
            console.log('Old Line Key: ' + linekey);
            console.log('Child Key: ' + childkey);
            console.log('Parent Item: ' + parentitem);

             if(!linekey){
               linekey = Date.now(); // this is now the key for this line in all subsquent transactions
               currentRecord.setCurrentSublistValue({
                   sublistId: 'item',
                   fieldId: 'custcol_ns_lineparentkey',
                   value: linekey,
                   ignoreFieldChange: true,
                   forceSyncSourcing: false
               });
             }
             if(!childkey && parentitem){ // we need to associate the parent with a potential childkey
                var lineNumber = currentRecord.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: parentitem
                });
                console.log('Line Number '+ lineNumber);
                if(lineNumber >= 0){
                    var parentKey = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_lineparentkey',
                        line: lineNumber
                    });
                    if(parentKey){
                        console.log('Located Parent - ' + parentKey);
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ns_linechildkey',
                            value: parentKey,
                            ignoreFieldChange: true,
                            forceSyncSourcing: false
                        });
                    }
                }else{
                    // Use Case - I first select a parent that's on the transaction, then I reset the field with a parent that isn't on the transaction.
                    console.log('unsetting parent key');
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_linechildkey',
                        value: null,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                }
             }else if(!parentitem && childkey){
                // use case - user has manually unset the parent link.
                console.log('unsetting parent key');
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_linechildkey',
                    value: null,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
             }

             // bail out here if we've popped already and the preference is set.
             if(popOnce && window.poppedLines.includes(parseInt(linekey))){return true;}

             if(item){
                 /// handle the pop-up of any accessories
                 itemData = getItemData(item);
                 if(itemData != null){
                     console.log(itemData);
                     var accessoryPop = itemData.custitem_ns_accessorypopup;
                     if(accessoryPop){
                       console.log('Popping');
                       openAccessoryWindow(item,linekey,rate);
                       if(!window.poppedLines.includes(parseInt(linekey))){window.poppedLines.push(parseInt(linekey))};
                       return true;
                     }
                 }
             }
         }
       console.log('made it to the end');
         return true;
     } // end validateLine

     function openAccessoryWindow(item,linekey,rate){
         var accWindow;
         const accessoryURL = url.resolveScript({scriptId: 'customscript_ns_su_accessories',deploymentId: 'customdeploy_ns_su_accessories_1'});
         const accessoryWindowOptions = "left=200,top=200,width=1000,height=500,menubar=0,";
         if(!item){
               if(!context){var context = window.accessoryContext};
             if (context.currentRecord.sublistId === 'item'){ // default to current sublist item
              var item = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'item'});
              var rate = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'rate'});
             }else{return;}
         }
         accWindow = window.open(accessoryURL + '&item=' + item + '&ifrmcntnr=T&linekey='+linekey + '&price=' + rate,'ns_accessories_' + item,accessoryWindowOptions);
     }

     function closeAccessoryWindow(){
             accWindow.close();
     }

       function pageInit(context){
       window.accessoryContext = context;
       const currentRecord = context.currentRecord;
       window.addLine = function(item,quantity,price){
                             addLine(item,quantity,price);
                             //window.accessoryContext.currentRecord.commitLine('item');
                           };
       // Commented this line out on 1/29/24 not sure if it's used.
       //window.openAccessoryWindow = function(item){openAccessoryWindow(item)};
       // retrieve the stashed popped lines
       var poppedLines = currentRecord.getValue('custbody_ns_acc_poppedlines');
       if(poppedLines){window.poppedLines = JSON.parse(poppedLines)};
       console.log('Popped Lines: ' + window.poppedLines);
     }

     function addLine(item,key2,parent){
        var quantity = window.addqty[item] || 1;
         var currentRecord = window.accessoryContext.currentRecord;
         console.log('parentLine' + parent + ' linekey ' + key2, 'quantity ' + quantity);
         if(item){
             currentRecord.selectNewLine({sublistId: 'item'});
             currentRecord.setCurrentSublistValue({
                 sublistId: 'item',
                 fieldId: 'item',
                 value: item,
                   forceSyncSourcing: true
             }).setCurrentSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ns_addonparent',
                 value: parent,
                 forceSyncSourcing: false
             }).setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                value: quantity || 1,
                forceSyncSourcing: false
            }).setCurrentSublistValue({
                 sublistId: 'item',
                 fieldId: 'custcol_ns_linechildkey',
                 value: key2,
                 forceSyncSourcing: false
             }).commitLine({sublistId: 'item'});
               return true;
         }
     }
     function getItemData(item){
         var fieldLookUp = search.lookupFields({
             type: search.Type.ITEM,
             id: item,
             columns: ['internalid','custitem_ns_accessorypopup']
         });
         return fieldLookUp;
     } //end getItemData
     function validateDelete(context) {
         var currentRecord = context.currentRecord;
         var sublistName = context.sublistId;
         if (sublistName === 'item'){ // DPR 7-25-23 - added this to allow for a clear all lines action.
            var delItem = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'item'});
            if(delItem){
                if(currentRecord.findSublistLineWithValue({sublistId: 'item',fieldId: 'custcol_ns_addonparent',value: delItem}) > -1){
                    alert('Remove all associated add-ons first');
                    return false;
                }
           }
         }
         return true;
     }
     function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var fieldName = context.fieldId;
        console.log('Field Change Event: ' + fieldName);
        if (sublistName === 'item' && fieldName === 'item'){
            var editItem = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'custcol_ns_lineparentkey'});
            if(editItem){
                var addOnLine = currentRecord.findSublistLineWithValue({sublistId: 'item',fieldId: 'custcol_ns_linechildkey',value: editItem});
                if(addOnLine > -1){
                    alert('You may not change the item on this line without first removing all associated add-ons');
                    var previousItem = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ns_addonparent',
                        line: addOnLine
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: previousItem,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    return true;
                }
           }
        }else if(sublistName === 'item' && fieldName === 'custcol_ns_addonparent'){
            // manually updating the parent item
            var currentItem = currentRecord.getCurrentSublistValue({sublistId: sublistName,fieldId: 'custcol_ns_addonparent'});
            var newParentLineId = currentRecord.findSublistLineWithValue({sublistId: 'item',fieldId: 'item',value: currentItem});
            if(newParentLineId > -1){
                var newParentKey = currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_lineparentkey',
                    line: newParentLineId
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_linechildkey',
                    value: newParentKey,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
            }else{
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_linechildkey',
                    value: null,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_ns_addonparent',
                    value: null,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
                alert('No matching Parent Item on this transaction. You must add the parent item to the transaction first');
            }
            return true;
        }
    }

     function beforeSubmit(scriptContext) {
        const currentRecord = scriptContext.currentRecord;
        if (window.poppedLines.length > 0){
            console.log(window.poppedLines);
            // stash the current popped lines in a field on the record
            currentRecord.setValue({fieldId: 'custbody_ns_acc_poppedlines',value: JSON.stringify(window.poppedLines)});
            return true;
        }else{
            console.log('No Popped Lines');
            return true;
        }
    }
     return {
         pageInit: pageInit,
         fieldChanged: fieldChanged,
         validateLine: validateLine,
         validateDelete: validateDelete,
         openAccessoryWindow: openAccessoryWindow,
         closeAccessoryWindow: closeAccessoryWindow,
         addLine: addLine,
         saveRecord: beforeSubmit
     };
 });