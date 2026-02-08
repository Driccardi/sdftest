/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
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

define(['N/ui/serverWidget','N/query'], function(serverWidget,query) {
    function onRequest(context){
        if(context.request.method === 'GET'){
            var item = context.request.parameters.item;
            var linekey = context.request.parameters.linekey;
            var floPrice = context.request.parameters.price || null;

            log.debug('Keys', 'Line Key: ' + linekey + ' Item: ' + item + ' Price: ' + floPrice);

            // page rewrite
            var itemData = getItemData(item,floPrice);
            var classData = getClass(item);
            var iclass = classData[0].class;
            var itemid = classData[0].itemid;
            if(iclass){
                var classData = getClassData(iclass,floPrice);
                itemData = itemData.concat(classData);
            }
            //log.debug("item ID", itemData[0].itemid)
            var form = serverWidget.createForm({
                title : 'Add Ons'
            });
            var title = form.addField({
                id: 'custpage_title',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Title'
            });
            title.defaultValue = "<div style='font-size: 18px;margin-left: 20px;position: absolute;top: 5px;'>Item: "+ itemid + "</div>";
            var css = form.addField({
                id: 'custpage_css',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'css'
            });
            css.defaultValue = "<style> .n_adb{height:28px;width:50px;} .n_ib{border-radius: 3px;font-size: 15px;width: 50px;margin-left: 10px;padding: 3px;text-align: center;} </style>";
            var closeWindow = form.addField({
                id: 'custpage_closeit',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Close'
            });
            closeWindow.defaultValue = "<button style='margin-top:35px !important;height: 30px;color: inherit ! important;font-size: 14px ! important;font-weight: 600 !important;display: block;width: 60%;border: solid 1px;cursor: pointer;border-radius: 7px;margin: auto;' onclick='window.close();'>Done</button>";
            var sublist = form.addSublist({
                id : 'custpage_accessory_list',
                type : serverWidget.SublistType.LIST,
                label : 'Add Ons'
            });
            sublist.addField({
                id: 'checkbox_val',
                type: serverWidget.FieldType.TEXT,
                label: 'Select',
                align: serverWidget.LayoutJustification.RIGHT
            });
            sublist.addField({
                id: 'itemid',
                type: serverWidget.FieldType.TEXT,
                label: 'Item',
                align: serverWidget.LayoutJustification.RIGHT
            });
            sublist.addField({
                id: 'displayname',
                type: serverWidget.FieldType.TEXT,
                label: 'Product',
                align: serverWidget.LayoutJustification.RIGHT
            });

            sublist.addField({
                id: 'unitprice',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Price Each',
                align: serverWidget.LayoutJustification.RIGHT
            });
            if(itemData.length >= 1 ){
                // iterate through item data
                for (let i = 0; i < itemData.length; i++) {
                    if(itemData[i].quantity == 1){
                        sublist.setSublistValue({
                            id: 'checkbox_val',
                            line: i,
                            value:  checkbox(itemData[i].internalid,item,linekey)
                        });
                        sublist.setSublistValue({
                            id: 'itemid',
                            line: i,
                            value:  itemData[i].itemid
                        });
                        var desc = (itemData[i].displayname == null ? itemData[i].description : itemData[i].displayname);
                        sublist.setSublistValue({
                            id: 'displayname',
                            line: i,
                            value:  desc
                        });
                        sublist.setSublistValue({
                            id: 'unitprice',
                            line: i,
                            value:  itemData[i].unitprice
                        });
                    }
                }
            }
            //context.response.writePage(list);
            if(itemData.length >= 1){
                context.response.writePage(form);
            }else{
                // don't run if there's nothing to display

                context.response.write('<script>window.close();</script>');
            }

        } else{

        }
    }



    function getItemData(item,price){
        /*
        *
        * var sql =  'SELECT a.custrecord_drss_accessoryitem internalid, c.name pricelevel, b.itemid, b.displayname, b.description, d.unitprice, d.quantity, e.itemid parent_item FROM CUSTOMRECORD_DRSS_ACCESSORIES a, ITEM b, PRICELEVEL c, PRICING d, ITEM e WHERE e.id = ? AND a.custrecord_drss_parentitem = e.id AND a.custrecord_drss_accessoryitem = b.id AND a.custrecord_drss_accessoryprice = c.id AND a.custrecord_drss_accessoryitem = d.item and d.pricelevel = a.custrecord_drss_accessoryprice';
        * */
        //var sql = 'SELECT * FROM CUSTOMRECORD_DRSS_ACCESSORIES';
        var sql =  'SELECT a.custrecord_drss_accessoryitem AS internalid, c.name AS pricelevel, b.itemid, b.displayname, b.description, d.unitprice, d.quantity, e.itemid AS parent_item FROM CUSTOMRECORD_DRSS_ACCESSORIES a, ITEM b, PRICELEVEL c, PRICING d, ITEM e WHERE e.id = ? AND a.custrecord_drss_parentitem = e.id AND a.custrecord_drss_accessoryitem = b.id AND a.custrecord_drss_accessoryprice = c.id AND a.custrecord_drss_accessoryitem = d.item and d.pricelevel = a.custrecord_drss_accessoryprice AND a.custrecord_drss_minprice < ? AND a.custrecord_drss_maxprice > ?';
        log.debug('sql',sql);
        var sqlresults = query.runSuiteQL({query: sql, params: [item, price, price]});
        if(sqlresults){
            log.debug('Sql Return Object', sqlresults);
            return sqlresults.asMappedResults();
        }else{
            log.error('Item Search Error', 'No results found: ');
            return null;
        }
    } //end getItemData

    function getClass(item){
        var sql = "Select class, itemid from ITEM WHERE id = ?";
        log.debug('sql',sql);
        var sqlresults = query.runSuiteQL({query: sql, params: [item]});
        if(sqlresults){
            log.debug('Sql Return Object', sqlresults);
            return sqlresults.asMappedResults();
        }else{
            log.error('Item Search Error', 'No results found: ');
            return null;
        }
    }


    function getClassData(iclass,floPrice){
        // check for pricing. If there's no pricing, don't bother with the min/max
        if(floPrice == null){
            var sql =  'SELECT a.custrecord_drss_accessoryitem internalid, c.name pricelevel, b.itemid, b.displayname, b.description, d.unitprice, d.quantity FROM CUSTOMRECORD_DRSS_ACCESSORIES a, ITEM b, PRICELEVEL c, PRICING d, MAP_customrecord_drss_accessories_custrecord_drss_parentclass e WHERE a.id = e.mapone  AND e.maptwo = ?  AND a.custrecord_drss_accessoryitem = b.id AND a.custrecord_drss_accessoryprice = c.id AND a.custrecord_drss_accessoryitem = d.item and d.pricelevel = a.custrecord_drss_accessoryprice';
            var sqlresults = query.runSuiteQL({query: sql, params: [iclass]});
        }else{
            var sql =  'SELECT a.custrecord_drss_accessoryitem internalid, c.name pricelevel, b.itemid, b.displayname, b.description, d.unitprice, d.quantity FROM CUSTOMRECORD_DRSS_ACCESSORIES a, ITEM b, PRICELEVEL c, PRICING d, MAP_customrecord_drss_accessories_custrecord_drss_parentclass e WHERE a.id = e.mapone  AND e.maptwo = ?  AND a.custrecord_drss_accessoryitem = b.id AND a.custrecord_drss_accessoryprice = c.id AND a.custrecord_drss_accessoryitem = d.item and d.pricelevel = a.custrecord_drss_accessoryprice AND ( a.custrecord_drss_minprice IS NULL OR a.custrecord_drss_minprice <= ?) AND (a.custrecord_drss_maxprice IS NULL OR a.custrecord_drss_maxprice > ?)';
            var sqlresults = query.runSuiteQL({query: sql, params: [iclass,floPrice,floPrice]});
        }
        log.debug('sql',sql);
        log.debug('Param', iclass);

        if(sqlresults){
            log.debug('Sql Return Object', sqlresults);
            return sqlresults.asMappedResults();
        }else{
            log.error('Item Search Error', 'No results found: ');
            return null;
        }
    }

    function checkbox(i,parent,linekey){
        return '<button type="button" class="n_adb" id="acc_'+i+'" name="accessories" onclick="opener.addLine('+i+','+linekey+','+parent+');return false;">Add</button><input type="number" step="1" id="integerInput_'+i+'" value="1" oninput="opener.addqty['+i+'] = this.value;" class="n_ib" />';
    }







    return {
        onRequest: onRequest
    }
});