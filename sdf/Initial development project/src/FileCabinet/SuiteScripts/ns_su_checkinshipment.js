/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */


// TODO -  extend the functioanlity to handle receiving inbound shipments, when an IBS is indicated as the transaction type.
define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/ui/serverWidget','N/render','N/file','N/url'],
    /**
     * @param{log} log
     * @param{query} query
     * @param{record} record
     * @param{runtime} runtime
     * @param{serverWidget} serverWidget
     */
    (log, query, record, runtime, serverWidget,render,file, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const strLogPrefix = 'Customer Consignment Check In:';
        const toreceivableStatus = ['F','E']; // valid status for transfer order to be received
        const poreceivableStatus = ['D','B']; // valid status for purchase order to be received
        const onRequest = (scriptContext) => {
            const objScript     = runtime.getCurrentScript();
            const SETUP         = objScript.getParameter({name: 'custscript_ns_csgn_setup'}); // setup record to use for the page
            const cookies        = scriptContext.request.headers['Cookie'];
            const GUID          = getCookie(cookies,'session_cs_guid'); // get the GUID from the cookie
            const intTransId    = scriptContext.request.parameters.transid; // incoming order for receiving


            log.debug(strLogPrefix + 'cookie', cookies);
            const objSetup = getSetup(SETUP);
            log.debug(strLogPrefix + 'Setup Record', objSetup);
            log.debug(strLogPrefix + 'GUID', GUID);
            if(!objSetup){
                log.error(strLogPrefix, 'Setup record not found');
                scriptContext.response.write("Incomplete Setup Record. Please contact your administrator.");
                return;
            }
            try{
                // check to make sure the user has the proper permissions to run this script
                if(!objSetup.custrecord_cs_csgn_debug && !checkCredentials(GUID,intTransId)){
                    log.error(strLogPrefix, 'Invalid GUID: ' + GUID);
                    log.error(strLogPrefix, 'Invalid credentials');
                    scriptContext.response.write(objSetup.custrecord_ns_csgn_loginerror);
                    return;
                }
            }catch(e){
                log.error(strLogPrefix + 'error', e);
                if(objSetup.custrecord_cs_csgn_debug){
                    scriptContext.response.write('<pre>' + JSON.stringify(e) + '</pre>');
                    return;
                }
                scriptContext.response.write(objSetup.custrecord_ns_csgn_loginerror);
                return;
            }
            /// ******************************* START GENERATING STEP 2 HTML *************************************
            if(scriptContext.request.method === 'GET'){
                try{
                    const objOrder = getOrder(intTransId);
                    if(!objOrder){
                        log.error(strLogPrefix, 'Transfer  or Purchase Order not found');
                        scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                        return;
                    }
                    if(!checkStatus(objOrder)){
                        log.error(strLogPrefix, 'Order is not in a valid status: ' + objOrder.status);
                        scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                        return;
                    }
                    var strStep2HTML = loadFileAsString(objSetup.custrecord_ns_csgn_htmltemplate).replace(/\${css}/g, '<style>' + loadFileAsString(objSetup.custrecord_ns_csgn_csstemplate) + '</style>');
                    strStep2HTML = strStep2HTML.replace(/\${transactionId}/g, intTransId);
                    strStep2HTML = strStep2HTML.replace(/\${packinglisthtml}/g, formHTML(objOrder,objSetup));
                    scriptContext.response.write(strStep2HTML);
                }catch(e){
                    log.error(strLogPrefix + 'error', e);
                    if(objSetup.custrecord_cs_csgn_debug){
                        scriptContext.response.write('<pre>' + JSON.stringify(e) + '</pre>');
                        return;
                    }
                    scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                    return;
                }
            }

            // *********************************************** STEP 3 - PROCESS THE RECEIPT *************************************

            if(scriptContext.request.method === 'POST'){
                log.debug(strLogPrefix + 'POST', 'Processing the receipt');
                log.debug(strLogPrefix + 'POST', 'Request Parameters: ' + JSON.stringify(scriptContext.request.parameters));
                const action = scriptContext.request.parameters.action; // get the action from the request
                var intOrderId = scriptContext.request.parameters.transactionId; // get the order id from the request



                // check to make sure we have a valid order, in a valid status, with a valid consignment customer id; if not, return an error
                var objOrder = getOrder(intTransId);
                log.debug(strLogPrefix + 'Order Object', objOrder);
                if(!objOrder){
                    log.error(strLogPrefix, 'Transfer or Purchase Order not found');
                    scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                    return;
                }
                if(!checkStatus(objOrder)){
                    log.error(strLogPrefix, 'Order is not in a valid status: ' + objOrder.status);
                    scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                    return;
                }

                // All checks are passed. transform the Order to receipt
                try{
                    var ifArray = []; // array of items to be received from the item fulfillment, if that's the order type we're using
                    switch(objOrder.type){
                        case 'TrnfrOrd':
                            var strType = 'transferorder';
                            break;
                        case 'PurchOrd':
                            var strType = 'purchaseorder';
                            break;
                        case 'ItemShip':
                            var strType = 'transferorder';
                            var intOrderId = getTransferOrderId(intOrderId);
                            var ifArray = getIFLineItems(objOrder.id); // get the item fulfillment array to be used for receiving
                            log.debug(strLogPrefix + 'ifArray', ifArray);
                            break;
                    }
                    log.debug(strLogPrefix + 'strType', strType);
                    log.debug(strLogPrefix + 'intOrderId', intOrderId);
                    if(action == 'complete'){ // a post with a complete action will create the item receipt
                        var intItemReceipt = receiveOrder(intOrderId,strType,ifArray);
                        log.audit(strLogPrefix + 'completed', 'Item Receipt created: ' + intItemReceipt);
                        var successHTML = (objSetup.custrecord_ns_csgn_acceptmsg).replace(/\${id}/g, intItemReceipt);
                        scriptContext.response.write(successHTML);
                    }else if(action == 'reject'){ // a post with a reject action will not create the item receipt
                        var strRejectMsg = scriptContext.request.parameters.rejectnote; // get the reject message from the request
                        if(strRejectMsg.length > 0){
                            writeRejectMsg(intOrderId, strType, strRejectMsg); // write the reject message to the order
                            var cancelHTML = (objSetup.custrecord_ns_csgn_rejectmsg).replace(/\${id}/g, intOrderId);
                            scriptContext.response.write(cancelHTML);
                        }
                    }


                } catch (e) {
                    log.error(strLogPrefix + 'error', e);
                    log.debug(strLogPrefix + 'Debug Setting', objSetup.custrecord_cs_csgn_debug);
                    if(objSetup.custrecord_cs_csgn_debug){
                        scriptContext.response.write('<pre>' + JSON.stringify(e) + '</pre>');
                        return;
                    }
                    scriptContext.response.write(objSetup.custrecord_ns_csgn_erromsg);
                    return;
                }
            }
        }
// *********************************************** End main request/respone *************************************

        function formHTML(objOrder,objSetup){
            log.debug(strLogPrefix + 'objOrder', objOrder);
            switch(objOrder.type){
                case 'TrnfrOrd':
                    // var transHTMLFile = render.pickingTicket({
                    //     entityId: parseInt(objOrder.id),
                    //     printMode: render.PrintMode.HTML,
                    //     inCustLocale: true,
                    //     //formId: parseInt(objSetup.custrecord_ns_csgn_toformid)
                    //     });
                    //     break;

                    var ifList = getShippedFulfillments(objOrder.id); // get the item fulfillment array to be used for receiving
                    var formattedHTML = formatIFList(ifList,objOrder.id); // format the item fulfillment list for display
                    log.debug(strLogPrefix + 'formattedHTML', formattedHTML);
                    return formattedHTML;
                    break;
                case 'PurchOrd':
                    var transHTMLFile = render.transaction({
                        entityId: parseInt(objOrder.id),
                        printMode: render.PrintMode.HTML,
                        inCustLocale: true,
                        formId: parseInt(objSetup.custrecord_ns_csgn_poformid)
                    });
                    break;
                case 'ItemShip':
                    var transHTMLFile = render.packingSlip({
                        entityId: parseInt(objOrder.id),
                        printMode: render.PrintMode.HTML,
                        inCustLocale: true,
                        formId: parseInt(objSetup.custrecord_ns_csgn_ifformid)
                    });
                    break;
            }
            if(transHTMLFile){
                var transHTML = transHTMLFile.getContents();
                return transHTML;
            }else{
                return 'Error: Could not generate order contents';
            }
        }

        function checkStatus(objOrder){
            switch(objOrder.type){
                case 'TrnfrOrd':
                    if(toreceivableStatus.indexOf(objOrder.status) == -1){  // check if the order is in a valid status to be received
                        return false;
                    }
                    return true;
                case 'PurchOrd':
                    if(poreceivableStatus.indexOf(objOrder.status) == -1){  // check if the order is in a valid status to be received
                        return false;
                    }
                    return true;
                case 'ItemShip':
                    if(objOrder.status != 'C'){  // check if the order is in a valid status to be received
                        log.error(strLogPrefix, 'Item Fulfillment is not in a valid status to be received: ' + objOrder.status);
                        return false;
                    }
                    return true;
                default:
                    log.error(strLogPrefix, 'Order Type is not valid: ' + objOrder.type);
                    return false;
            }
        }

        function receiveOrder(id,strType,ifArray){
            var recTransform = record.transform({
                fromType: strType,
                fromId: id,
                toType: 'itemreceipt'
            });
            // mark all available lines as received
            var intLineCount = recTransform.getLineCount({sublistId: 'item'});
            for(var i = 0; i < intLineCount; i++){
                // check if the line item is in the current itemFulfillment
                if(ifArray && ifArray.length > 0){
                    var intItem = recTransform.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
                    log.debug(strLogPrefix + 'Item', intItem);
                    log.debug(strLogPrefix + 'Item Fulfillment Array', ifArray);
                    for(var j = 0; j < ifArray.length; j++){
                        if(ifArray[j].item == intItem){
                            log.debug(strLogPrefix + 'Receiving Item ' + intItem, 'Quantity: ' + ifArray[j].quantity);
                            recTransform.setSublistValue({sublistId: 'item', fieldId: 'itemreceive', line: i, value: true});
                            recTransform.setSublistValue({sublistId: 'item', fieldId: 'quantity', line: i, value: ifArray[j].quantity});
                        }else{
                            recTransform.setSublistValue({sublistId: 'item', fieldId: 'itemreceive', line: i, value: false});
                        }
                    }

                }else{
                    // if no itemFulfillment array is passed, mark all lines as received
                    recTransform.setSublistValue({sublistId: 'item', fieldId: 'itemreceive', line: i, value: true});
                }
            }
            var recItemReceipt = recTransform.save();
            log.audit(strLogPrefix + 'completed', 'Item Receipt created: ' + recItemReceipt);
            return recItemReceipt;
        }

        function writeRejectMsg(intOrderId, strType, strRejectMsg){
            var recOrder = record.load({
                type: strType,
                id: intOrderId,
                isDynamic: true
            });
            if(!recOrder){
                log.error(strLogPrefix, 'Order not found: ' + intOrderId);
                return;
            }
            recOrder.setValue({fieldId: 'custbody_ns_csgn_rejectreason', value: strRejectMsg});
            recOrder.save();
            log.audit(strLogPrefix + 'completed', 'Order rejected: ' + intOrderId);
            return true;
        }

        // check the credentials of the user by checking the GUID and transaction id
        function checkCredentials(GUID,intChkTransId){
            var objOTURecord = getOtuByGUID(GUID);
            if(!objOTURecord){
                log.error(strLogPrefix, 'Invalid GUID: ' + GUID);
                return false;
            }
            var intTransId = objOTURecord.custrecord_ns_otu_trx;
            if(!intTransId){
                log.error(strLogPrefix, 'Missing transaction id: ');
                return false;
            }
            if(intTransId != intChkTransId){
                log.error(strLogPrefix, 'Invalid transaction id: ' + intTransId + ' does not match the incoming transaction id: ' + intChkTransId);
                return false;
            }
            return true;
        }
        // function getCookie(name,cookie) {
        //     const value = `; ${cookie}`;
        //     const parts = value.split(`; ${name}=`);
        //     if (parts.length === 2) return parts.pop().split(';').shift();
        //   }

        function getCookie(cookieString, name) {
            const cookies = cookieString.split(';');
            for (let cookie of cookies) {
                const [key, value] = cookie.trim().split('=');
                if (key === name) {

                    // Decode the value to handle URL-encoded characters
                    // and return it as a string
                    log.debug('GUID cookie',    decodeURIComponent(value));
                    return decodeURIComponent(value);
                }
            }
            log.error('Cookie not found', 'Cookie with name ' + name + ' not found in the request.');
            return null;
        }

        function formatIFList(arrIfList,thisTransId){
            var backURL = getThisURL(thisTransId);
            var strHTML = `    <div class="breadcrumb">
                                <a href="${backURL}">← Back to Transfer Order</a>
                                <span>/</span>
                                <span>Fulfillment Selector</span>
                                </div>
                                <h1>Select Fulfillment</h1>
                                <div class="instructions">
                                Please select the fulfillment transaction you are checking-in. Click on a fulfillment record below to continue.
                                </div>
                                <script>
                                // Hide the controls div when the page loads
                                // This is to prevent the user from clicking the buttons when we want them to select a fulfillment record first
                                    document.addEventListener('DOMContentLoaded', function () {
                                    var controls = document.querySelector('.controls');
                                    if (controls) {
                                        controls.style.display = 'none';
                                    }
                                    });
                                </script>`;
            if(arrIfList.length >0){
                strHTML += '<ul class="fulfillment-list">';
                for(var i = 0; i < arrIfList.length; i++){
                    const ifUrl = getThisURL(arrIfList[i].createdfrom);
                    strHTML += `<li><a href="${ifUrl}">${arrIfList[i].ifname} – ${arrIfList[i].toname}</a></li>`;
                }
                strHTML += '</ul>';
                return strHTML;
            }else{
                return '<div class="error">No fulfillment records found for this transfer order.</div>';
            }
        }
// *********************************************** Data Getters *********************************************
        // run a suiteQL query and return the results as an array of objects
        function runSql(sql,params){
            log.debug('sql',sql);
            log.debug('params',params);
            var sqlresults = query.runSuiteQL({
                query: sql,
                params: params
            });
            if(sqlresults){
                log.debug('Sql Return Object', sqlresults);
                return sqlresults.asMappedResults();
            }else{
                log.error('SQL Search Error', 'No results found: ' + JSON.stringify(sqlresults));
                return null;
            }
        }

        function getThisURL(tranId){

            const objScript     = runtime.getCurrentScript();
            const strUrl = url.resolveScript({
                scriptId: objScript.id,
                deploymentId: objScript.deploymentId,
                returnExternalUrl: true
            });
            return strUrl + '&transid=' + tranId;
        }

        function getShippedFulfillments(toid){
            var sql = "Select DISTINCT nexttype, nextdoc createdfrom, BUILTIN.DF(nextdoc) ifname, BUILTIN.DF(previousdoc) toname FROM NextTransactionLineLink WHERE previousdoc = ? ORDER BY createdfrom desc";

            var res = runSql(sql,[toid]);
            if(res.length > 0){return res;}else{return null;}
        }


        function getOrder(id){
            var sql = "Select id,type,status,custbody_ns_CSGN_customer FROM transaction t WHERE t.id = ?";
            var res = runSql(sql,[id]);
            if(res.length > 0){return res[0];}else{return null;}
        }
        function getLineItems(id){
            var sql = "Select item,quantity,transactionLinetype FROM transactionline tl WHERE tl.transaction = ? and tl.mainline = 'F'";

            var res = runSql(sql,[id]);
            if(res.length > 0){return res;}else{return null;}
        }

        function getTOLineItems(id){
            const sql = "Select BUILTIN.DF(tl.item) itemname, tl.item, tl.quantityshiprecv qtyshipped, tl.itemtype, tl.transactionlinetype FROM transactionline tl WHERE tl.transaction = ? and tl.mainline = 'F' and tl.quantityshiprecv > 0";
            var res = runSql(sql,[id]);
            if(res.length > 0){return res;}else{return null;}
        }

        function getIFLineItems(id){
            const sql = "Select BUILTIN.DF(tl.item) itemname, tl.item, tl.quantityshiprecv qtyshipped,  tl.itemtype, tl.transactionlinetype, tl.quantity FROM transactionline tl WHERE tl.transaction =  ? and tl.mainline = 'F'  and tl.quantity > 0";
            var res = runSql(sql,[id]);
            if(res.length > 0){return res;}else{return null;}
        }


        function getOtuByGUID(guid){
            var sql = "Select * FROM customrecord_ns_one_time_url WHERE custrecord_ns_otu_guid = ?";
            var res = runSql(sql,[guid]);
            if(res.length > 0){return res[0];}else{return null;}
        }
        function getTransferOrderId(id){
            var sql = "Select previoustype, previousdoc createdfrom FROM PreviousTransactionLineLink WHERE nextdoc = ?";
            var res = runSql(sql,[id]);
            if(res.length > 0 && res[0].previoustype == 'TrnfrOrd'){return res[0].createdfrom;}else{return null;}
        }

        function getSetup(SETUP){
            var sql = "Select * FROM customrecord_ns_csgn_setup WHERE id = ?";
            var res = runSql(sql,[SETUP]);
            if(res.length > 0){return res[0];}else{return null;}
        }
        function loadFileAsString(id){
            var objFile = file.load({id: id});
            var strHtml = objFile.getContents();
            return strHtml;
        }
        return {onRequest}

    });
