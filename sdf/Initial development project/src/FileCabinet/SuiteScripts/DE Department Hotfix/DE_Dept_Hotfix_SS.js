/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record'],

function(search, record) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(context) {
    	var searchObject = search.load({
    	    id: 'customsearch808'
    	});
		
    	var step  = 0;
        var index = 0;
        
        do {
        	
            var resultObject = searchObject.run().getRange({
                start : step,
                end   : step + 1000
            });
            
            for(var i=0; i<resultObject.length; i++) {
                var recordID = resultObject[i].id;
                
                var recordObj = record.load({
                	type      : record.Type.ITEM_FULFILLMENT, 
                    id        : recordID
                });
                
                var numLines = recordObj.getLineCount({
                    sublistId : 'item'
                });
                
                for(var j=0; j<numLines; j++) {
                	var currentDept = recordObj.getSublistValue({
                	    sublistId : 'item',
                	    fieldId   : 'department',
                	    line      : j
                	});
                	
                	
                	if(currentDept=='') {
                    	recordObj.setSublistValue({
                    	    sublistId : 'item',
                    	    fieldId   : 'department',
                    	    line      : j,
                    	    value     : 1
                    	});
                	}
                }
            	
            	recordObj.save();
            }
            
            step = step + 1000;
        } while(resultObject.length > 0);
    	
    }

    return {
        execute: execute
    };
    
});
