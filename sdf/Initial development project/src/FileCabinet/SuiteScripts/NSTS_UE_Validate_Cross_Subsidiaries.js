/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime'], function (record, runtime) {
    function beforeSubmit(context) {
        try{
            if (context.type === "create") {
                var isCrossSubsidiary = runtime.getCurrentScript().getParameter('custscript_is_cross_sub');

                if(isCrossSubsidiary === true || isCrossSubsidiary === "T") {
                    var recObj = context.newRecord;
                    var sub1 = recObj.getValue('subsidiary');
                    var sub2 = recObj.getValue('tosubsidiary');
                    if(sub1 !== sub2){
                        throw "From Subsidiary and To Subsidiary must be same";
                    }
                }
            }
        }catch (err){
            throw err;
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});