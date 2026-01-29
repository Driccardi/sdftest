/**
 * Copyright (c) 2023 Oracle NetSuite, Inc.
 *
 *  This software is the confidential and proprietary information of
 *  NetSuite, Inc. ('Confidential Information'). You shall not
 *  disclose such Confidential Information and shall use it only in
 *  accordance with the terms of the license agreement you entered into
 *  with Oracle NetSuite.
 *
 *  Version         Date           Author               Remarks
 *  2.x          27Nov2023    jdispirito             inital release
 * *
 * After Submit, this automation links the item fulfillment and invoices from a specific sales order
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/ui/message'], function(record, search, task, serverWidget, mess) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.EDIT) {
             
             try {
                     var objCase = context.newRecord;
 
                     var boolActionSteps = objCase.getValue({
                         fieldId: 'custevent_cshub_act_stps_ctrd'
                     })
                     log.debug("this is the action steps created:", boolActionSteps)

                     var intStatus = objCase.getValue({
                        fieldId: 'status'
                    })
                    log.debug("this is the status:", intStatus)
               
                     
                     if (boolActionSteps && (intStatus != 5)) {
                        log.debug("in if statement")

                        var strAutomations = objCase.getValue({
                          fieldId: 'custevent_cshub_casestep_array_ids'
                        })
                        log.debug("this is the automation list:", strAutomations)
                     if(strAutomations){

                        var arrayAutomations = strAutomations.split(',');
                        log.debug("this is the automation list:", arrayAutomations)

                        var objCustomrecord_cshcd_caseactions_step = search.create({
                           type: "customrecord_cshub_caseactionstep",
                           filters:
                           [
                             ["custrecord_cshub_csactnstep_crntstp_id","is",arrayAutomations[0]], 
                             "AND", 
                             ["custrecord_cshub_actnstep_type","anyof","1"]
                           ],
                           columns:
                           [
                             search.createColumn({name: "custrecord_cshub_automation_to_trigger", label: "Automation to trigger"}),
                             search.createColumn({name: "custrecord_cshub_trigger_script_dep_id", label: "Triggered Script Deployment ID"})
                           ]
                        });
                        var intSearchResultCount = objCustomrecord_cshcd_caseactions_step.runPaged().count;
                        log.debug("search result count:", intSearchResultCount)

                        if(intSearchResultCount == 1){
                          log.debug("in search result == 1 if")
                          objCustomrecord_cshcd_caseactions_step.run().each(function(result){
                             var strAutomationToTrigger = result.getValue("custrecord_cshub_automation_to_trigger");
                             log.debug("strAutomationToTrigger", strAutomationToTrigger)
                             var strAutomationDeployment = result.getValue("custrecord_cshub_trigger_script_dep_id");
                             log.debug("strAutomationDeployment", strAutomationDeployment)

                            if(strAutomationToTrigger && strAutomationDeployment){
                               var objTask = task.create({
			                     taskType: task.TaskType.MAP_REDUCE,
			                     scriptId: strAutomationToTrigger,
                                 deploymentId: strAutomationDeployment
			                  });
                              var intTaskId = objTask.submit();
			
			                  log.debug('intTaskId',intTaskId)
                              
                              var objCase = record.load({
                                type: record.Type.SUPPORT_CASE,
                                id: context.newRecord.id
                              });
                              objCase.setValue({
                                fieldId: 'custevent_nsts_error_message',
                                value: "",
                                ignoreFieldChange: true
                              });
                              objCase.save();
                            }
                            return true;
                          });
                          
                        }
                        else{
                          //error case
                          //set message on custom field
                          var objCase = record.load({
                            type: record.Type.SUPPORT_CASE,
                            id: context.newRecord.id
                          });
                          objCase.setValue({
                            fieldId: 'custevent_nsts_error_message',
                            value: "Automation Search did not provide a unique result, please review the information in the field CASE STEP ARRAY IDS.",
                            ignoreFieldChange: true
                          });
                          objCase.save();
                        }
                     }
                  }
             } catch (error) {
                     log.debug('Error', error);
 
             }
        }
     }

  function beforeLoad(context) {

          var rec = context.newRecord;
          var strErrorMessage = rec.getValue('custevent_nsts_error_message');
          if (strErrorMessage) {
           var myMsg = mess.create({
                title: "SCRIPT ERROR",
                message: strErrorMessage,
                type: mess.Type.ERROR,
                duration: 500000
           });
           context.form.addPageInitMessage({message: myMsg});
        }
  }
    return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
    };

});