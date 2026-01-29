/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/log", "N/runtime", "N/task", "N/redirect", "N/record", "N/search", "N/url", "N/cache", "./ns_class_bin_paginator.js"], /**
 * @param{log} log
 */ (serverWidget, log, runtime, task, redirect, record, search, nurl, cache, BinPaginator) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        const objScript = runtime.getCurrentScript();
        const strCSFileName = objScript.getParameter({
            name: "custscript_ns_cs_script_file",
        });

        try {
            if (scriptContext.request.method == "GET") {
                const objParam = scriptContext.request.parameters;
                //-------------------------------------GET METHOD-------------------------------------
                let objForm = null;

                objForm = createForm(objParam);
                if (objParam.preview == undefined || objParam.preview == null || objParam.preview == "") {
                } else {
                    createPreview(objParam, objForm);
                } //end if

                //render the form
                objForm.clientScriptModulePath = strCSFileName;
                scriptContext.response.writePage(objForm);

                //-------------------------------------GET METHOD-------------------------------------
            } else {
                //-------------------------------------POST METHOD-------------------------------------
                let form = serverWidget.createForm({
                    title: "RESULT",
                });
                let strLayout = "";
                try {
                    const objRecord = getGeneratedBin(scriptContext);
                    let strMessage = JSON.stringify(objRecord);
                    strLayout = showSuccess(strMessage);
                } catch (e) {
                    const strResultText = e.message;
                    strLayout = showError(strResultText);
                } //end try

                //Response
                let field = form.addField({
                    id: "custpage_response",
                    type: serverWidget.FieldType.INLINEHTML,
                    label: "Response",
                });

                field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.NORMAL });
                field.defaultValue = strLayout;
                //End Response
                //----------------create work order completion----------------

                scriptContext.response.writePage(form);
                //-------------------------------------POST METHOD-------------------------------------
            } //end if
        } catch (e) {
            log.debug("Error", JSON.stringify(e));
        } //end try
    };

    const getGeneratedBin = (scriptContext) => {
        let objParam = scriptContext.request.parameters;
        const intLines = scriptContext.request.getLineCount({ group: "custpage_sublist_generated_bin" });

        //create object
        let objRecord = new Array();

        for (let x = 0; x < intLines; x++) {
            const isChecked = scriptContext.request.getSublistValue({ group: "custpage_sublist_generated_bin", name: "custpage_action", line: x });
            const strBin = scriptContext.request.getSublistValue({ group: "custpage_sublist_generated_bin", name: "custpage_bin", line: x });
            if (isChecked == "T") {
                objRecord.push({
                    bin: strBin,
                });
            }
        } //end for

        return objRecord;
        //end create object
    };

    const createForm = (objParam) => {
        let objForm = serverWidget.createForm({
            title: "Auto Bin Creation",
        });

        objForm.addFieldGroup({
            id: "primary",
            label: "Primary Information",
        });

        objForm.addFieldGroup({
            id: "bin_settings",
            label: "Bin Settings",
        });

        objForm.addFieldGroup({
            id: "result",
            label: "Result",
        });

        //-----------------------------------Name-----------------------------------
        let field = objForm.addField({
            id: "custpage_auto_bin_name",
            type: serverWidget.FieldType.TEXT,
            label: "Auto Bin Name",
            container: "primary",
        });

        if (objParam.custpage_auto_bin_name !== undefined && objParam.custpage_auto_bin_name !== null && objParam.custpage_auto_bin_name !== "") {
            field.defaultValue = objParam.custpage_auto_bin_name;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Name-----------------------------------

        //-----------------------------------Bin Name Syntax-----------------------------------
        field = objForm.addField({
            id: "custpage_bin_naming_syntax",
            type: serverWidget.FieldType.SELECT,
            label: "Bin Naming Syntax",
            container: "primary",
        });

        field.addSelectOption({ value: "loc-zone-aisle-rack-level-position", text: "LOC-ZONE-AISLE-RACK-LEVEL-POSITION" });

        if (objParam.custpage_bin_naming_syntax !== undefined && objParam.custpage_bin_naming_syntax !== null && objParam.custpage_bin_naming_syntax !== "") {
            field.defaultValue = objParam.custpage_bin_naming_syntax;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTROW });
        //-----------------------------------Bin Name Syntax-----------------------------------

        //-----------------------------------Location-----------------------------------
        field = objForm.addField({
            id: "custpage_location",
            type: serverWidget.FieldType.SELECT,
            label: "Location",
            container: "primary",
        });

        loadLocation(field);
        //set default value for location
        if (objParam.location !== undefined && objParam.location !== null && objParam.location !== "") {
            field.defaultValue = objParam.location;
        } //end if

        if (objParam.custpage_location !== undefined && objParam.custpage_location !== null && objParam.custpage_location !== "") {
            field.defaultValue = objParam.custpage_location;

            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        //-----------------------------------Location-----------------------------------

        //-----------------------------------Zone-----------------------------------
        field = objForm.addField({
            id: "custpage_zone",
            type: serverWidget.FieldType.SELECT,
            label: "Zone",
            container: "primary",
        });

        //set list for zone
        if ((objParam.location !== undefined && objParam.location !== null && objParam.location !== "") || (objParam.custpage_zone !== undefined && objParam.custpage_zone !== null && objParam.custpage_zone !== "")) {
            loadZone(field, objParam);
        } //end if

        if (objParam.custpage_zone !== undefined && objParam.custpage_zone !== null && objParam.custpage_zone !== "") {
            field.defaultValue = objParam.custpage_zone;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        //-----------------------------------Zone-----------------------------------

        //-----------------------------------Type-----------------------------------
        field = objForm.addField({
            id: "custpage_type",
            type: serverWidget.FieldType.SELECT,
            label: "Type",
            source: "customlist_ns_auto_bin_type",
            container: "primary",
        });
        //field.addSelectOption({ value: "storage", text: "Storage" });
        //field.addSelectOption({ value: "picking", text: "Picking" });

        if (objParam.custpage_type !== undefined && objParam.custpage_type !== null && objParam.custpage_type !== "") {
            field.defaultValue = objParam.custpage_type;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if
        field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
        //-----------------------------------Type-----------------------------------

        //-----------------------------------Aisle-----------------------------------
        field = objForm.addField({
            id: "custpage_aisle_row",
            type: serverWidget.FieldType.SELECT,
            label: "# of Aisle Row",
            container: "bin_settings",
        });

        for (let i = 0; i <= 1000; i++) {
            field.addSelectOption({ value: i, text: i });
        } //end for

        if (objParam.custpage_aisle_row !== undefined && objParam.custpage_aisle_row !== null && objParam.custpage_aisle_row !== "") {
            field.defaultValue = objParam.custpage_aisle_row;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });
        field.updateDisplaySize({
            height: 60,
            width: 120,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Aisle-----------------------------------

        //-----------------------------------Aisle Row-----------------------------------
        field = objForm.addField({
            id: "custpage_aisle_row_type",
            type: serverWidget.FieldType.SELECT,
            label: "Format of Aisle Row",
            container: "bin_settings",
        });

        field.addSelectOption({ value: "numeric", text: "Numeric" });
        field.addSelectOption({ value: "alpha", text: "Alpha" });

        if (objParam.custpage_aisle_row_type !== undefined && objParam.custpage_aisle_row_type !== null && objParam.custpage_aisle_row_type !== "") {
            field.defaultValue = objParam.custpage_aisle_row_type;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if
        field.updateDisplaySize({
            height: 60,
            width: 150,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //-----------------------------------Aisle Row-----------------------------------

        //-----------------------------------Rack Bay-----------------------------------
        field = objForm.addField({
            id: "custpage_rack_bays",
            type: serverWidget.FieldType.SELECT,
            label: "# of Rack Bays",
            container: "bin_settings",
        });

        for (let i = 0; i <= 1000; i++) {
            field.addSelectOption({ value: i, text: i });
        } //end for

        if (objParam.custpage_rack_bays !== undefined && objParam.custpage_rack_bays !== null && objParam.custpage_rack_bays !== "") {
            field.defaultValue = objParam.custpage_rack_bays;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 120,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Rack Bay-----------------------------------

        //-----------------------------------Rack Bay Type-----------------------------------
        field = objForm.addField({
            id: "custpage_rack_bays_type",
            type: serverWidget.FieldType.SELECT,
            label: "Format of Rack Bays",
            container: "bin_settings",
        });

        field.addSelectOption({ value: "numeric", text: "Numeric" });
        field.addSelectOption({ value: "alpha", text: "Alpha" });

        if (objParam.custpage_rack_bays_type !== undefined && objParam.custpage_rack_bays_type !== null && objParam.custpage_rack_bays_type !== "") {
            field.defaultValue = objParam.custpage_rack_bays_type;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 150,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //-----------------------------------Rack Bay Type-----------------------------------

        //-----------------------------------Level of Shelves-----------------------------------
        field = objForm.addField({
            id: "custpage_level_shelves",
            type: serverWidget.FieldType.SELECT,
            label: "# of LevelShelves",
            container: "bin_settings",
        });

        for (let i = 0; i <= 1000; i++) {
            field.addSelectOption({ value: i, text: i });
        } //end for

        if (objParam.custpage_level_shelves !== undefined && objParam.custpage_level_shelves !== null && objParam.custpage_level_shelves !== "") {
            field.defaultValue = objParam.custpage_level_shelves;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 120,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Level of Shelves-----------------------------------

        //-----------------------------------Shelves Format-----------------------------------
        field = objForm.addField({
            id: "custpage_level_shelves_type",
            type: serverWidget.FieldType.SELECT,
            label: "Format of Shelves",
            container: "bin_settings",
        });

        field.addSelectOption({ value: "numeric", text: "Numeric" });
        field.addSelectOption({ value: "alpha", text: "Alpha" });

        if (objParam.custpage_level_shelves_type !== undefined && objParam.custpage_level_shelves_type !== null && objParam.custpage_level_shelves_type !== "") {
            field.defaultValue = objParam.custpage_level_shelves_type;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 150,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //-----------------------------------Shelves Format-----------------------------------

        //-----------------------------------Shelves Position-----------------------------------
        field = objForm.addField({
            id: "custpage_shelves_position",
            type: serverWidget.FieldType.SELECT,
            label: "# of Positions",
            container: "bin_settings",
        });

        for (let i = 0; i <= 1000; i++) {
            field.addSelectOption({ value: i, text: i });
        } //end for

        if (objParam.custpage_shelves_position !== undefined && objParam.custpage_shelves_position !== null && objParam.custpage_shelves_position !== "") {
            field.defaultValue = objParam.custpage_shelves_position;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 120,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Shelves Position-----------------------------------

        //-----------------------------------Format of Positions-----------------------------------
        field = objForm.addField({
            id: "custpage_shelves_position_type",
            type: serverWidget.FieldType.SELECT,
            label: "Format of Positions",
            container: "bin_settings",
        });

        field.addSelectOption({ value: "numeric", text: "Numeric" });
        field.addSelectOption({ value: "alpha", text: "Alpha" });

        if (objParam.custpage_shelves_position_type !== undefined && objParam.custpage_shelves_position_type !== null && objParam.custpage_shelves_position_type !== "") {
            field.defaultValue = objParam.custpage_shelves_position_type;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplaySize({
            height: 60,
            width: 150,
        });
        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //-----------------------------------Format of Positions-----------------------------------

        //-----------------------------------Sequence Start-----------------------------------
        field = objForm.addField({
            id: "custpage_seq_start",
            type: serverWidget.FieldType.INTEGER,
            label: "Sequence Start",
            container: "bin_settings",
        });

        if (objParam.custpage_seq_start !== undefined && objParam.custpage_seq_start !== null && objParam.custpage_seq_start !== "") {
            field.defaultValue = objParam.custpage_seq_start;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        //-----------------------------------Sequence Start-----------------------------------

        //-----------------------------------Sequence Gap-----------------------------------

        field = objForm.addField({
            id: "custpage_seq_gap",
            type: serverWidget.FieldType.INTEGER,
            label: "Sequence Gap",
            container: "bin_settings",
        });

        if (objParam.custpage_seq_gap !== undefined && objParam.custpage_seq_gap !== null && objParam.custpage_seq_gap !== "") {
            field.defaultValue = objParam.custpage_seq_gap;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        //-----------------------------------Sequence Gap-----------------------------------

        //-----------------------------------Aisle Array Sorting for Bin Sequencing-----------------------------------
        field = objForm.addField({
            id: "custpage_aisle_array_sorting",
            type: serverWidget.FieldType.SELECT,
            label: "Aisle Array Sorting for Bin Sequencing",
            container: "bin_settings",
        });

        field.addSelectOption({ value: "serpentine", text: "Serpentine" });
        field.addSelectOption({ value: "uniform", text: "Uniform" });

        if (objParam.custpage_aisle_array_sorting !== undefined && objParam.custpage_aisle_array_sorting !== null && objParam.custpage_aisle_array_sorting !== "") {
            field.defaultValue = objParam.custpage_aisle_array_sorting;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                //field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        //-----------------------------------Aisle Array Sorting for Bin Sequencing-----------------------------------

        field = objForm.addField({
            id: "custpage_length",
            type: serverWidget.FieldType.FLOAT,
            label: "Length",
            container: "bin_settings",
        });

        if (objParam.custpage_length !== undefined && objParam.custpage_length !== null && objParam.custpage_length !== "") {
            field.defaultValue = objParam.custpage_length;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });

        field = objForm.addField({
            id: "custpage_width",
            type: serverWidget.FieldType.FLOAT,
            label: "Width",
            container: "bin_settings",
        });

        if (objParam.custpage_width !== undefined && objParam.custpage_width !== null && objParam.custpage_width !== "") {
            field.defaultValue = objParam.custpage_width;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.MIDROW });

        field = objForm.addField({
            id: "custpage_height",
            type: serverWidget.FieldType.FLOAT,
            label: "Height",
            container: "bin_settings",
        });

        if (objParam.custpage_height !== undefined && objParam.custpage_height !== null && objParam.custpage_height !== "") {
            field.defaultValue = objParam.custpage_height;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });

        field = objForm.addField({
            id: "custpage_cube",
            type: serverWidget.FieldType.FLOAT,
            label: "Cube Value",
            container: "bin_settings",
        });

        //field.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTROW });

        if (objParam.custpage_cube !== undefined && objParam.custpage_cube !== null && objParam.custpage_cube !== "") {
            field.defaultValue = objParam.custpage_cube;
            if (objParam.preview !== undefined && objParam.preview !== null && objParam.preview !== "") {
                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            } //end if
        } //end if

        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        objForm.addButton({
            id: "custpage_btn_simulate",
            label: "Simulate",
            functionName: "simulate",
        });

        return objForm;
    };

    const createPreview = (objParam, objForm) => {
        let rows_per_page = 100;
        /*let myCache = cache.getCache({
            name: "GeneratedBin",
            scope: cache.Scope.PROTECTED,
        });*/

        //const aisleNumber = generateNumbering(objParam.custpage_aisle_row_type, objParam.custpage_aisle_row);
        //---------------------------------------create sublist---------------------------------------

        const paginator = new BinPaginator({ rows: objParam.custpage_aisle_row, type: objParam.custpage_aisle_row_type }, { rows: objParam.custpage_rack_bays, type: objParam.custpage_rack_bays_type }, { rows: objParam.custpage_level_shelves, type: objParam.custpage_level_shelves_type }, { rows: objParam.custpage_shelves_position, type: objParam.custpage_shelves_position_type }, rows_per_page, objParam.custpage_aisle_array_sorting);
        //-------------------------------------------Page-------------------------------------------
        let f = objForm.addField({
            id: "custpage_page",
            type: serverWidget.FieldType.SELECT,
            label: "Page",
            container: "result",
        });

        for (let i = 1; i <= paginator.totalPages; i++) {
            if (i > 50000) {
                f.addSelectOption({ value: "", text: "..." });
                break;
            } //end if
            f.addSelectOption({ value: i, text: i });
        } //end for

        if (objParam.custpage_page !== undefined && objParam.custpage_page !== null && objParam.custpage_page !== "") {
            f.defaultValue = objParam.custpage_page;
        } //end if
        //-------------------------------------------Page-------------------------------------------

        //-------------------------------------------Total Pages-------------------------------------------
        f = objForm.addField({
            id: "custpage_total_page",
            type: serverWidget.FieldType.INTEGER,
            label: "Total Result",
            container: "result",
        });
        f.defaultValue = paginator.getTotalBinNumbers();
        f.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        f = objForm.addField({
            id: "custpage_auto_bin_record",
            type: serverWidget.FieldType.TEXT,
            label: "Auto Bin Record",
            container: "result",
        });
        if (objParam.custpage_auto_bin_record !== undefined && objParam.custpage_auto_bin_record !== null && objParam.custpage_auto_bin_record !== "") {
            f.defaultValue = objParam.custpage_auto_bin_record;
        } //end if
        f.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        //-------------------------------------------Total Pages-------------------------------------------

        //-------------------------------------------Submit-------------------------------------------
        if (paginator.totalPages > 0) {
            //objForm.addSubmitButton("Save");
            objForm.addButton({
                id: "custpage_btn_save",
                label: "Save",
                functionName: "save",
            });
        } //end if

        //-------------------------------------------Submit-------------------------------------------

        const objSubtab = objForm.addTab({
            id: "custpage_tab_generated_bin",
            label: "Generated Bin",
        });
        let objSublist = objForm.addSublist({
            id: "custpage_sublist_generated_bin",
            type: serverWidget.SublistType.LIST,
            label: "Generated Bin",
            tab: "custpage_tab_generated_bin",
        });
        objSublist.addMarkAllButtons();

        let field = objSublist.addField({ id: "custpage_action", label: "Action", type: serverWidget.FieldType.CHECKBOX });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

        field = objSublist.addField({ id: "custpage_row", label: "Row #", type: serverWidget.FieldType.INTEGER });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

        field = objSublist.addField({ id: "custpage_bin", label: "Bin", type: serverWidget.FieldType.TEXT });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        field = objSublist.addField({ id: "custpage_location", label: "Location", type: serverWidget.FieldType.SELECT, source: record.Type.LOCATION });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        field = objSublist.addField({ id: "custpage_zone", label: "Zone", type: serverWidget.FieldType.SELECT, source: record.Type.ZONE });
        field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

        //---------------------------------------create sublist---------------------------------------

        const objPage = paginator.getPage(objParam.custpage_page);
        let currentPage = 0;
        log.debug("objPage", objPage);

        if (objParam.custpage_page !== undefined && objParam.custpage_page !== null && objParam.custpage_page !== "") {
            currentPage = parseInt(objParam.custpage_page);
            //rows_per_page = objPage.length;
        } //end if

        for (const k in objPage) {
            const objMapData = objPage[k];

            /*objSublist.setSublistValue({
                id: "custpage_aisle",
                line: parseInt(k),
                value: objMapData["aisle"],
            });

            objSublist.setSublistValue({
                id: "custpage_rack",
                line: parseInt(k),
                value: objMapData["bay"],
            });

            objSublist.setSublistValue({
                id: "custpage_level",
                line: parseInt(k),
                value: objMapData["shelf"],
            });

            objSublist.setSublistValue({
                id: "custpage_positions",
                line: parseInt(k),
                value: objMapData["position"],
            });
            */

            objSublist.setSublistValue({
                id: "custpage_row",
                line: parseInt(k),
                value: rows_per_page * (currentPage - 1) + (parseInt(k) + 1),
            });

            objSublist.setSublistValue({
                id: "custpage_bin",
                line: parseInt(k),
                value: objMapData,
            });

            if (objParam["custpage_location"] !== undefined && objParam["custpage_location"] !== null && objParam["custpage_location"] !== "") {
                objSublist.setSublistValue({
                    id: "custpage_location",
                    line: parseInt(k),
                    value: objParam.custpage_location,
                });
            }
            if (objParam["custpage_zone"] !== undefined && objParam["custpage_zone"] !== null && objParam["custpage_zone"] !== "") {
                objSublist.setSublistValue({
                    id: "custpage_zone",
                    line: parseInt(k),
                    value: objParam.custpage_zone,
                });
            }
        }
        /*
        let objConsolidated = new Array();
        const arrAisleNumber = generateColumnSeries(objParam.custpage_aisle_row_type, objParam.custpage_aisle_row);
        const arrRack = generateColumnSeries(objParam.custpage_rack_bays_type, objParam.custpage_rack_bays);
        const arrShelves = generateColumnSeries(objParam.custpage_level_shelves_type, objParam.custpage_level_shelves);
        const arrPosition = generateColumnSeries(objParam.custpage_shelves_position_type, objParam.custpage_shelves_position);

        let intCtr = 0;
        for (const k in arrAisleNumber) {
            let strKey = arrAisleNumber[k];

            for (const x in arrRack) {
                let strKey2 = strKey + "-" + arrRack[x];

                for (const y in arrShelves) {
                    let strKey3 = strKey2 + "-" + arrShelves[y];

                    for (const z in arrPosition) {
                        let strKey4 = strKey3 + "-" + arrPosition[z];

                        objSublist.setSublistValue({
                            id: "custpage_aisle",
                            line: intCtr,
                            value: arrAisleNumber[k],
                        });

                        objSublist.setSublistValue({
                            id: "custpage_rack",
                            line: intCtr,
                            value: arrRack[x],
                        });

                        objSublist.setSublistValue({
                            id: "custpage_level",
                            line: intCtr,
                            value: arrShelves[y],
                        });

                        objSublist.setSublistValue({
                            id: "custpage_positions",
                            line: intCtr,
                            value: arrPosition[z],
                        });

                        objSublist.setSublistValue({
                            id: "custpage_bin",
                            line: intCtr,
                            value: strKey4,
                        });

                        intCtr += 1;

                        //comment this
                        objConsolidated.push({
                            aisle: arrAisleNumber[k],
                            rack: arrRack[x],
                            shelves: arrShelves[y],
                            positions: arrPosition[z],
                            bin: strKey4,
                        });
                    } //end for
                } //end for
            } //end for
        } //end for
        */

        //log.debug("objConsolidated");

        //log.debug("objConsolidated", objConsolidated);

        /*for (const k in objConsolidated) {
            intCtr += 1;
        } //end for
         */

        /*let objForm = serverWidget.createForm({
            title: "Auto Bin Creation Preview",
        });

        return objForm;
        */
    };

    const generateNumbering = (strFormat, intNoOfRows) => {
        const alphaFormat = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        let arrGeneratedNumbers = new Array();
        if (strFormat == "alpha") {
            let generatedLetter = "";
            let generatedCounter = 0;
            let currentLetter = "";
            let currentCounter = 0;

            //numeric
            for (let x = 0; x <= intNoOfRows - 1; x++) {
                currentLetter = generatedLetter + alphaFormat[currentCounter];

                arrGeneratedNumbers.push(currentLetter);
                if (currentCounter + 1 == alphaFormat.length) {
                    generatedLetter = alphaFormat[generatedCounter];
                    if (generatedCounter + 1 == alphaFormat.length) {
                        generatedCounter = 0;
                        generatedLetter += alphaFormat[generatedCounter];
                        continue;
                    } // end if
                    generatedCounter += 1;

                    currentCounter = 0;
                    continue;
                } //end if

                currentCounter += 1;
            } //end for
        } else {
            //numeric
        } //end if

        return arrGeneratedNumbers;
    };

    const generateColumnSeries = (strFormat, intNoOfRows) => {
        const result = [];

        if (strFormat == "alpha") {
            let start = "";
            while (result.length < intNoOfRows) {
                if (!start) {
                    start = "A";
                } else {
                    let carry = true;

                    let tempStart = start.split("");

                    for (let i = tempStart.length - 1; i >= 0 && carry; i--) {
                        if (tempStart[i] !== "Z") {
                            tempStart[i] = String.fromCharCode(tempStart[i].charCodeAt(0) + 1);
                            carry = false;
                        } else {
                            tempStart[i] = "A";
                        }
                    }

                    if (carry) {
                        tempStart.unshift("A");
                    }

                    start = tempStart.join("");
                }

                result.push(start);
            } //end while
        } else {
            for (let x = 1; x <= intNoOfRows; x++) {
                result.push(x);
            } //end for
        } //end if

        return result;
    };

    const generateColumnSeries2 = (format, rows) => {
        const result = [];

        if (format === "alpha") {
            let start = "";

            while (result.length < rows) {
                if (!start) {
                    start = "A";
                } else {
                    start = incrementAlpha(start);
                }

                result.push(start);
            }
        } else {
            for (let i = 1; i <= rows; i++) {
                result.push(i);
            }
        }

        return result;
    };

    const incrementAlpha = (str) => {
        const arr = str.split("");

        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] === "Z") {
                arr[i] = "A";
            } else {
                arr[i] = String.fromCharCode(arr[i].charCodeAt(0) + 1);
                return arr.join("");
            }
        }

        return "A" + arr.join("");
    };

    function* generateBinNumbers(aisleRows, bayRows, shelfRows, binRows) {
        const aisles = generateColumnSeries2("alpha", aisleRows);
        const bays = generateColumnSeries2("alpha", bayRows);
        const shelves = generateColumnSeries2("numeric", shelfRows);
        const bin = generateColumnSeries2("numeric", binRows);

        for (let i = 0; i < aisles.length; i++) {
            for (let j = 0; j < bays.length; j++) {
                for (let k = 0; k < shelves.length; k++) {
                    for (let l = 0; l < bin.length; l++) {
                        yield `${aisles[i]}-${bays[j]}-${shelves[k]}-${bin[l]}`;
                    }
                }
            }
        }
    }

    const loadLocation = (field) => {
        const objScript = runtime.getCurrentScript();
        const intLocationSearch = objScript.getParameter({
            name: "custscript_ns_location_search",
        });
        const objSearch = search.load({
            id: intLocationSearch,
        });

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);
        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];
                const strName = objSR.getValue({
                    name: "name",
                    label: "Name",
                });

                field.addSelectOption({ value: objSR.id, text: strName });

                // finally:
                i++;
                j++;
                if (j == 1000) {
                    // check if it reaches 1000
                    j = 0; // reset j an reload the next portion
                    objSearchResult = objRs.getRange({
                        start: i,
                        end: i + 1000,
                    });
                } //end if
            } //end while
        } //end if

        return field;
    };

    const loadZone = (field, objParam) => {
        const objScript = runtime.getCurrentScript();
        const intZoneSearch = objScript.getParameter({
            name: "custscript_ns_zone_search",
        });
        const objSearch = search.load({
            id: intZoneSearch,
        });

        let locationParam = 0;
        if (objParam.location !== undefined) {
            locationParam = objParam.location;
        }

        if (objParam.custpage_location !== undefined) {
            locationParam = objParam.custpage_location;
        } //end if

        let arrFilters = objSearch.filters;
        arrFilters.push({
            name: "location",
            operator: "anyof",
            values: [locationParam],
        });
        objSearch.filters = arrFilters;

        const intResultCount = objSearch.runPaged().count;
        const objRs = objSearch.run();
        let objSearchResult = objRs.getRange(0, 1000);
        //remove limiter of 1000 and fetch all result

        let i = 0; // iterator for all search results
        let j = 0; // iterator for current result range 0..999
        if (intResultCount > 0) {
            while (j < objSearchResult.length) {
                const objSR = objSearchResult[j];
                const strName = objSR.getValue({
                    name: "name",
                    label: "Name",
                });

                field.addSelectOption({ value: objSR.id, text: strName });

                // finally:
                i++;
                j++;
                if (j == 1000) {
                    // check if it reaches 1000
                    j = 0; // reset j an reload the next portion
                    objSearchResult = objRs.getRange({
                        start: i,
                        end: i + 1000,
                    });
                } //end if
            } //end while
        } //end if

        return field;
    };

    const showError = (param) => {
        var html =
            '<div id="div__alert">\
                              <div class="uir-alert-box error session_error_alert" width="100%" role="status">\
                               <div class="icon error">\
                                <img src="/images/icons/messagebox/icon_msgbox_error.png" alt="">\
                                 </div>\
                                 <div class="content">\
                                 <div class="title">Error</div>\
                                  <div class="descr">' +
            param +
            "</div>\
                              </div>\
                            </div>\
                           </div>";

        return html;
    };

    const showSuccess = (param) => {
        var html =
            '<div id="div__alert">\
                              <div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status">\
                               <div class="icon confirmation">\
                                <img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt="">\
                                 </div>\
                                 <div class="content">\
                                 <div class="title">Success</div>\
                                  <div class="descr">' +
            param +
            "</div>\
                              </div>\
                            </div>\
                           </div>";

        return html;
    };

    return { onRequest };
});
