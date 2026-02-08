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
 *  1.00            15 Sep 2025    aanchaud             Initial release
 *
 * Validate less than minimum quantity on order to force/warn user to enter required quantity.
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define((require) => {

    const FIELDS = {
        "FLD_LTM_QTY": "custcol_ns_ppai_ltm_qty",
        "FLD_PARENT_ITEM": "custcol_ns_ppai_parentitem",
        "FLD_LTM_RATE": "custcol_ns_ppai_ltm_rate",
        "FLD_LTM_PERCENTAGE": "custcol_ns_ppai_ltm_percentage",
        "FLD_LTM_ITEM": "custcol_ns_ppai_ltm_item",
        "FLD_LTM_CONFIG": "custbody_ns_ppai_ltm_config",
        "FLD_LTM_DEF_ITEM": "custbody_ns_ppai_ltm_config_item",
        "FLD_LTM_OPTION": "custbody_ns_ppai_ltm_config_option",
        "FLD_LTM_CONSOLIDATE": "custbody_ns_ppai_ltm_config_consolidat",
    }

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    const pageInit = (scriptContext) => {
        try {
            getLTMConfiguration(scriptContext);
        } catch (e) {
            log.error({title: "Error pageInit", details: e.toString()})
        }
    }


    let isAuto = false;
    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    const sublistChanged = (scriptContext) => {
        try {
            if (scriptContext.sublistId === "item") {
                if (scriptContext.operation !== "commit") {
                    return true;
                }
                if (isAuto) {
                    isAuto = false;
                    return true;
                }
                const recCurrentRecord = scriptContext.currentRecord;
                let intIndex = recCurrentRecord.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                const intLineCount = recCurrentRecord.getLineCount({sublistId: "item"});
                if (intIndex === intLineCount) {
                    intIndex -= 1;
                }
                if (intIndex >= intLineCount) {
                    return true;
                }
                const intItemParent = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_PARENT_ITEM,
                    line: intIndex
                });
                const intLTMItem = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_ITEM,
                    line: intIndex
                });
                const intItemId = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: intIndex
                });
                const objConfig = getLTMConfiguration(scriptContext);
                const bLTMItem = !isEmpty(intLTMItem) ? true : false;
                //if matrix consolidate,
                let bConsolidationRequired = false;
                if (objConfig.matrixOption) {
                    bConsolidationRequired = true;
                }

                let intItemToCheck = "";
                let strItemToCheckField = "";
                if (bConsolidationRequired && !isEmpty(intItemParent)) {
                    strItemToCheckField = FIELDS.FLD_PARENT_ITEM;
                    intItemToCheck = intItemParent;
                } else {
                    strItemToCheckField = "item";
                    intItemToCheck = intItemId;
                }

                let intQuantity = 0;
                if (bConsolidationRequired && !isEmpty(intItemParent)) {
                    intQuantity = getItemQuantityTotal(recCurrentRecord, intItemParent, strItemToCheckField);
                } else {
                    intQuantity = getItemQuantityTotal(recCurrentRecord, intItemId, strItemToCheckField);
                }

                const intLTMQuantity = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_QTY,
                    line: intIndex
                }) || 0;
                const flLTMRate = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_RATE,
                    line: intIndex
                });

                const flLTMPercentage = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_PERCENTAGE,
                    line: intIndex
                }) || 0;

                let flChargeAmount = 0;
                let strAmountType = "";
                if (!isEmpty(flLTMRate) && flLTMRate > 0) {
                    flChargeAmount = parseFloat(flLTMRate);
                    strAmountType = "Flat Rate – ";
                } else if (isEmpty(flLTMRate) && flLTMPercentage > 0) {
                    let flPreviousItemAmount = 0;
                    if (!bConsolidationRequired && !isEmpty(intItemParent)) {
                        flPreviousItemAmount = recCurrentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "amount",
                            line: intIndex
                        });
                    } else {
                        flPreviousItemAmount = getItemAmountTotal(recCurrentRecord, intItemId, strItemToCheckField);
                    }
                    flChargeAmount = (flPreviousItemAmount * flLTMPercentage) / 100;
                    strAmountType = "Percent of Amount - ";
                }

                let intTaxCode = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "taxcode",
                    line: intIndex
                }) || "";
                let intLocation = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "location",
                    line: intIndex
                }) | "";

                if (intQuantity < intLTMQuantity) {
                    const intLTMExistAt = checkIfLTMItemExist(recCurrentRecord, objConfig.item, intItemToCheck);
                    if (intLTMExistAt < 0) {
                        const bNeedToAdd = showWarning(objConfig, recCurrentRecord);
                        if (!bNeedToAdd) {
                            return true;
                        }
                        isAuto = true;
                        addLTMItem(recCurrentRecord, intItemToCheck, objConfig.item, flChargeAmount, intTaxCode, intLocation, strAmountType);
                    } else {
                        const flAmountAlreadyOnLTMLine = recCurrentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "amount",
                            line: intLTMExistAt
                        });
                        if (flAmountAlreadyOnLTMLine === flChargeAmount) {
                            return true;
                        }
                        isAuto = true;

                        const bNeedToAdd = showWarning(objConfig, recCurrentRecord);
                        if (!bNeedToAdd) {
                            return true;
                        }
                        isAuto = true;
                        updateLTMItem(recCurrentRecord, intLTMExistAt, flChargeAmount);

                    }
                } else {
                    const intLTMExistAt = checkIfLTMItemExist(recCurrentRecord, objConfig.item, intItemToCheck);
                    if (intLTMExistAt >= 0) {
                        bRemoveLine = true;
                        isAuto = true;
                        removeLineItem(recCurrentRecord, intLTMExistAt);
                        bRemoveLine = false;

                    }
                    //isAuto = true;
                }
            }
        } catch (e) {
            log.error({title: "Error sublistChange", details: e.toString()});
            console.log("error sublistChange", e);
        }
    }

    const addLTMItem = (recCurrentRecord, intItemId, intChargeItem, flChargeAmount, intTaxCode, intLocation, strAmountType) => {
        recCurrentRecord.selectNewLine({
            sublistId: 'item'
        });
        recCurrentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            value: parseInt(intChargeItem),
            forceSyncSourcing: true
        });

        recCurrentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: 1,
            forceSyncSourcing: true
        });

        recCurrentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "price",
            value: -1,
            ignoreFieldChange: true
        });
        recCurrentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: flChargeAmount,
            ignoreFieldChange: false
        });


        if (!isEmpty(intTaxCode)) {
            recCurrentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                value: intTaxCode,
                forceSyncSourcing: true
            });
        }
        if (!isEmpty(intLocation)) {
            recCurrentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "location",
                value: intLocation,
                forceSyncSourcing: true
            });
        }

        recCurrentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_LTM_ITEM,
            value: intItemId,
            forceSyncSourcing: true
        });
        let strLTMItemName = recCurrentRecord.getCurrentSublistText({sublistId: "item", fieldId: FIELDS.FLD_LTM_ITEM});
        recCurrentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "description",
            value: strAmountType + " " + strLTMItemName,
            forceSyncSourcing: true
        });

        recCurrentRecord.commitLine({sublistId: 'item'});
    }

    const updateLTMItem = (recCurrentRecord, intLTMExistAt, flChargeAmount) => {
        recCurrentRecord.selectLine({sublistId: "item", line: intLTMExistAt});
        const flAmount = recCurrentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "amount"
        });
        if (flAmount != flChargeAmount) {
            recCurrentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: flChargeAmount,
                ignoreFieldChange: false,
                forceSyncSourcing: true
            });
            recCurrentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: flChargeAmount,
                ignoreFieldChange: false,
                forceSyncSourcing: true
            });
            recCurrentRecord.commitLine({sublistId: "item"});
        }
    }

    const showWarning = (objConfig, recCurrentRecord) => {
        let intOption = objConfig.option;
        let intIndex = recCurrentRecord.getCurrentSublistIndex({
            sublistId: 'item'
        });
        const intLineCount = recCurrentRecord.getLineCount({sublistId: "item"});
        if (intIndex === intLineCount) {
            intIndex -= 1;
        }
        let intItemId = recCurrentRecord.getSublistValue({sublistId: "item", fieldId: "item", line: intIndex});
        let strItemName = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "item_display",
            line: intIndex
        });
        let strUnitName = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "units_display",
            line: intIndex
        });
        let intLTMQuantity = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_LTM_QTY,
            line: intIndex
        });
        let intItemParent = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_PARENT_ITEM,
            line: intIndex
        });
        let intItemToCheck = "";
        let strItemToCheckField = "";
        if (objConfig.matrixOption && !isEmpty(intItemParent)) {
            strItemToCheckField = FIELDS.FLD_PARENT_ITEM;
            intItemToCheck = intItemParent;
        } else {
            strItemToCheckField = "item";
            intItemToCheck = intItemId;
        }
        let intQuantity = getItemQuantityTotal(recCurrentRecord, intItemToCheck, strItemToCheckField);

        let flRate = recCurrentRecord.getSublistValue({sublistId: "item", fieldId: "rate", line: intIndex});
        let flAmount = recCurrentRecord.getSublistValue({sublistId: "item", fieldId: "amount", line: intIndex});
        let flLTMRate = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_LTM_RATE,
            line: intIndex
        }) || 0;
        let flLTMPercent = recCurrentRecord.getSublistValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_LTM_PERCENTAGE,
            line: intIndex
        }) || 0;
        let flLTMCharges = 0;
        if (flLTMRate !== 0) {
            flLTMCharges = flLTMRate;
        } else {
            flLTMCharges = ((flLTMPercent * flRate) / 100) * intQuantity;
        }
        let intQuantityRequired = (intLTMQuantity - intQuantity);
        let flAmountIncrease = (flRate * intQuantityRequired);

        let strMessage = strItemName + ": is below the LTM quantity specified for this item. Add " + (intLTMQuantity - intQuantity) + " " + strUnitName + " to this order to hit LTM requirements and increase total item amount by " + formatCurrency(flAmountIncrease, "$", 2) + " Otherwise, click Ok to add a " + formatCurrency(flLTMCharges, "$", 2) + " LTM charge.";
        if (intOption == 1) {
            //warn
            const bNeedToAdd = confirm(strMessage);
            return bNeedToAdd;
        } else {
            //enforce
            alert(strMessage);
            return true;
        }
    }

    const showWarningSave = (intOption, intQuantity, intLTMQuantity, flTotalAmount, flChargeAmount, strItemName, flRate, strUnitName) => {

        //let intQuantityRequired = (intLTMQuantity - intQuantity);
        //let flAmountIncrease = (flRate * intQuantityRequired);

        let strMessage = strItemName + " is below the LTM quantity specified for this item. Add " + (intLTMQuantity - intQuantity) + " " + strUnitName + " to this order to hit LTM requirements and increase total item amount by " + formatCurrency(((intLTMQuantity - intQuantity) * flRate), "$", 2) + ". Otherwise, click Ok to add a " + formatCurrency(flChargeAmount, "$", 2) + " LTM charge."
        //warn
        if (intOption == 1) {
            return confirm(strMessage);
        } else {
            //enforce
            alert(strMessage);
            return true;
        }
    }

    const showWarningDelete = (intOption, strLTMItemName) => {
        //warn
        if (intOption == 1) {
            return confirm(strLTMItemName + ": requires Less than minimum charges. Click Ok to remove this charge line.");
        } else {
            //hold
            alert(strLTMItemName + ": requires an associated LTM charge line. Please remove " + strLTMItemName + " item remove LTM charge.");
            return false;
        }
    }

    let bRemoveLine = false;
    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    const validateDelete = (scriptContext) => {
        try {
            if (bRemoveLine) {
                return true;
            }
            if (scriptContext.sublistId == "item") {
                const objConfig = getLTMConfiguration(scriptContext);
                const recCurrentRecord = scriptContext.currentRecord;
                let intIndex = recCurrentRecord.getCurrentSublistIndex({
                    sublistId: 'item'
                });
                const intLTDItemId = recCurrentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_ITEM
                });
                const bLTDItem = !isEmpty(intLTDItemId) ? true : false;
                const strLTMItemName = recCurrentRecord.getCurrentSublistText({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_LTM_ITEM
                });
                let intParentItem = recCurrentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: FIELDS.FLD_PARENT_ITEM,
                });

                let bConsolidationRequired = false;
                if (objConfig.matrixOption) {
                    bConsolidationRequired = true;
                }
                const intItemId = recCurrentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: intIndex
                });
                let intItemToCheck = "";
                let strItemToCheckField = "";
                if (bConsolidationRequired && !isEmpty(intParentItem)) {
                    strItemToCheckField = FIELDS.FLD_PARENT_ITEM;
                    intItemToCheck = intParentItem;
                } else {
                    strItemToCheckField = "item";
                    intItemToCheck = intItemId;
                }
                //if item is LTM item
                if (bLTDItem) {
                    const bCoreItemFound = checkIfLTMCoreExist(recCurrentRecord, intItemId, intParentItem);
                    if (!bCoreItemFound) {
                        return true
                    } else {
                        return showWarningDelete(objConfig.option, strLTMItemName);
                    }
                } else {
                    //if item is not LTM item
                    const intLTMQuantity = recCurrentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_QTY
                    }) || 0;

                    const flLTMRate = recCurrentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_RATE
                    });

                    const flLTMPercentage = recCurrentRecord.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_PERCENTAGE,
                    }) || 0;

                    let flChargeAmount = 0;
                    let strAmountType = "";
                    if (!isEmpty(flLTMRate) && flLTMRate > 0) {
                        flChargeAmount = parseFloat(flLTMRate);
                        strAmountType = "Flat Rate – ";
                    } else if (isEmpty(flLTMRate) && flLTMPercentage > 0) {
                        let flPreviousItemAmount = 0;
                        if (!bConsolidationRequired && !isEmpty(intParentItem)) {
                            flPreviousItemAmount = recCurrentRecord.getSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                line: intIndex
                            });
                        } else {
                            flPreviousItemAmount = getItemRemainingAmountTotal(recCurrentRecord, intItemToCheck, strItemToCheckField, intIndex);
                        }
                        flChargeAmount = (flPreviousItemAmount * flLTMPercentage) / 100;
                        strAmountType = "Percent of Amount - ";
                    }
                    const intQuantityRemaining = getRemainingQuantity(recCurrentRecord, intItemToCheck, strItemToCheckField, intIndex);
                    let intLtmAt = checkIfLTMItemExist(recCurrentRecord, objConfig.item, intItemToCheck);
                    if (intLtmAt < 0) {
                        if (flChargeAmount === 0 || intQuantityRemaining === 0) {
                            return true
                        } else {
                            let intTaxCode = recCurrentRecord.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "taxcode"
                            }) || "";
                            let intLocation = recCurrentRecord.getCurrentSublistValue({
                                sublistId: "item",
                                fieldId: "location"
                            }) | "";
                            isAuto = true;
                            addLTMItem(recCurrentRecord, intItemToCheck, objConfig.item, flChargeAmount, intTaxCode, intLocation, strAmountType);
                            bRemoveLine = true;
                            removeLineItem(recCurrentRecord, intIndex);
                            bRemoveLine = false;
                        }
                    } else {
                        //update main item which needs to be removed
                        if (intLTMQuantity > intQuantityRemaining && intQuantityRemaining !== 0) {
                            isAuto = true;
                            updateLTMItem(recCurrentRecord, intLtmAt, flChargeAmount);
                            bRemoveLine = true;
                            removeLineItem(recCurrentRecord, intIndex);
                            bRemoveLine = false;
                        } else {
                            //remove LTM
                            if (intLtmAt > intIndex) {
                                bRemoveLine = true;
                                removeLineItem(recCurrentRecord, intLtmAt);
                                removeLineItem(recCurrentRecord, intIndex);
                                bRemoveLine = false;
                            } else {
                                bRemoveLine = true;
                                removeLineItem(recCurrentRecord, intIndex);
                                removeLineItem(recCurrentRecord, intLtmAt);
                                bRemoveLine = false;
                            }
                        }
                    }
                }
                bRemoveLine = false;
                return false;
            }
            return true;
        } catch (e) {
            log.error({title: "Error validateDelete", details: e.toString()});
            return true;
        }
    }

    const getItemQuantityTotal = (recRecord, intItemId, strItemField) => {
        let intTotal = 0;
        for (let i = 0; i < recRecord.getLineCount({sublistId: "item"}); i++) {
            let intLineItemId = recRecord.getSublistValue({sublistId: "item", fieldId: strItemField, line: i});
            let intLineQuantity = recRecord.getSublistValue({sublistId: "item", fieldId: "quantity", line: i});
            if (intLineItemId === intItemId) {
                intTotal += parseFloat(intLineQuantity);
            }
        }
        return intTotal;
    }
    const getRemainingQuantity = (recRecord, intItemId, strItemField, intIndex) => {
        let intTotal = 0;
        for (let i = 0; i < recRecord.getLineCount({sublistId: "item"}); i++) {
            let intLineItemId = recRecord.getSublistValue({sublistId: "item", fieldId: strItemField, line: i});
            let intLineQuantity = recRecord.getSublistValue({sublistId: "item", fieldId: "quantity", line: i});
            if (intLineItemId === intItemId && i !== intIndex) {
                intTotal += parseFloat(intLineQuantity);
            }
        }
        return intTotal;
    }


    const getItemAmountTotal = (recRecord, intItemId, strField) => {
        let intTotal = 0;
        for (let i = 0; i < recRecord.getLineCount({sublistId: "item"}); i++) {
            let intLineItemId = recRecord.getSublistValue({sublistId: "item", fieldId: strField, line: i});
            let intLineAmount = recRecord.getSublistValue({sublistId: "item", fieldId: "amount", line: i});
            if (intLineItemId === intItemId) {
                intTotal += parseFloat(intLineAmount);
            }
        }
        return intTotal;
    }

    const getItemRemainingAmountTotal = (recRecord, intItemId, strField, intIndex) => {
        let intTotal = 0;
        for (let i = 0; i < recRecord.getLineCount({sublistId: "item"}); i++) {
            let intLineItemId = recRecord.getSublistValue({sublistId: "item", fieldId: strField, line: i});
            let intLineAmount = recRecord.getSublistValue({sublistId: "item", fieldId: "amount", line: i});
            if (intLineItemId === intItemId && i !== intIndex) {
                intTotal += parseFloat(intLineAmount);
            }
        }
        return intTotal;
    }


    const checkIfLTMCoreExist = (recCurrentRecord, intLTMItem, intItemParent) => {
        if (!isEmpty(intItemParent)) {
            const intLTMParentSameFound = recCurrentRecord.findSublistLineWithValue({
                sublistId: "item",
                fieldId: FIELDS.FLD_PARENT_ITEM,
                value: intItemParent
            });
            return intLTMParentSameFound >= 0;
        } else {
            const intLTMParentSameFound = recCurrentRecord.findSublistLineWithValue({
                sublistId: "item",
                fieldId: "item",
                value: intLTMItem
            });
            return intLTMParentSameFound >= 0;
        }
    }

    const checkIfLTMCoreExistSave = (recCurrentRecord, intLTMItem) => {

        const intLTMParentSameFound = recCurrentRecord.findSublistLineWithValue({
            sublistId: "item",
            fieldId: FIELDS.FLD_PARENT_ITEM,
            value: intLTMItem
        });
        if (intLTMParentSameFound >= 0) {
            return intLTMParentSameFound >= 0;
        } else {
            const intLTMParentSameFound = recCurrentRecord.findSublistLineWithValue({
                sublistId: "item",
                fieldId: "item",
                value: intLTMItem
            });
            return intLTMParentSameFound >= 0;
        }
    }

    const checkIfLTMItemExist = (recCurrentRecord, intItemId, intLTMItem) => {
        let intIndex = -1;
        for (let i = 0; i < recCurrentRecord.getLineCount({sublistId: "item"}); i++) {
            let intLineItemId = recCurrentRecord.getSublistValue({sublistId: "item", fieldId: "item", line: i});
            let intLineLTMItem = recCurrentRecord.getSublistValue({
                sublistId: "item",
                fieldId: FIELDS.FLD_LTM_ITEM,
                line: i
            });
            if (intLineItemId === intItemId && intLTMItem === intLineLTMItem) {
                intIndex = i;
                break;
            }
        }
        return intIndex;
    }

    const removeLineItem = (recCurrentRecord, intIndex) => {
        bRemoveLine = true;
        recCurrentRecord.removeLine({
            sublistId: "item",
            line: intIndex,
        });
        bRemoveLine = false;
    }

    const getLTMConfiguration = (scriptContext) => {
        const recCurrentRecord = scriptContext.currentRecord;
        const objConfig = recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_CONFIG});
        if (!isEmpty(objConfig)) {
            return {
                item: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_DEF_ITEM}),
                option: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_OPTION}),
                matrixOption: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_CONSOLIDATE})
            };
        } else {
            const runtime = require("N/runtime");
            const intConfigurationId = runtime.getCurrentScript().getParameter({name: "custscript_ns_cs_ltm_configv2"});
            if (intConfigurationId === null) {
                return {};
            }
            recCurrentRecord.setValue({fieldId: FIELDS.FLD_LTM_CONFIG, value: intConfigurationId});
            return {
                item: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_DEF_ITEM}),
                option: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_OPTION}),
                matrixOption: recCurrentRecord.getValue({fieldId: FIELDS.FLD_LTM_CONSOLIDATE})
            };
        }
    }


    const isEmpty = (value) => {
        if (value == null) {
            return true;
        }
        if (value == undefined) {
            return true;
        }
        if (value == 'undefined') {
            return true;
        }
        if (value == '') {
            return true;
        }
        return false;
    }

    const formatCurrency = (flValue, stCurrencySymbol, intDecimalPrecision) => {
        let flAmount = flValue;
        if (typeof (flValue) != 'number') {
            flAmount = parseFloat(flValue);
        }
        let arrDigits = flAmount.toFixed(intDecimalPrecision).split(".");
        arrDigits[0] = arrDigits[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1,").split("").reverse().join("");
        return stCurrencySymbol + arrDigits.join(".");
    };

    const saveRecord = (scriptContext) => {
        try {
            const recCurrentRecord = scriptContext.currentRecord;
            const intLineCount = recCurrentRecord.getLineCount({sublistId: "item"});
            if (intLineCount > 0) {
                const objConfig = getLTMConfiguration(scriptContext);
                let bShowMessage = false;

                //if matrix consolidate,
                let bConsolidationRequired = false;
                if (objConfig.matrixOption) {
                    bConsolidationRequired = true;
                }
                let objItemQuantity = {};
                let objItemLTM = {}
                for (let i = 0; i < intLineCount; i++) {
                    let intLTMItemId = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_ITEM,
                        line: i
                    });
                    let bLTMItem = !isEmpty(intLTMItemId);
                    const intItemParent = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_PARENT_ITEM,
                        line: i
                    });
                    const intLTMItem = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_ITEM,
                        line: i
                    });
                    const intItemId = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        line: i
                    });

                    let intItemToCheck = "";
                    let strItemToCheckField = "";
                    if (bConsolidationRequired && !isEmpty(intItemParent)) {
                        strItemToCheckField = FIELDS.FLD_PARENT_ITEM;
                        intItemToCheck = intItemParent;
                    } else {
                        strItemToCheckField = "item";
                        intItemToCheck = intItemId;
                    }
                    let flAmount = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        line: i
                    });
                    let intQuantity = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        line: i
                    });

                    let strItemName = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "item_display",
                        line: i
                    });
                    let strUnitName = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "units_display",
                        line: i
                    });
                    let flRate = recCurrentRecord.getSublistValue({sublistId: "item", fieldId: "rate", line: i});

                    const intLTMQuantity = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_QTY,
                        line: i
                    }) || 0;
                    const flLTMRate = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_RATE,
                        line: i
                    });

                    const flLTMPercentage = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_PERCENTAGE,
                        line: i
                    }) || 0;

                    let flChargeAmount = 0;
                    let strAmountType = "";
                    if (!isEmpty(flLTMRate) && flLTMRate > 0) {
                        flChargeAmount = parseFloat(flLTMRate);
                        strAmountType = "Flat Rate – ";
                    } else if (isEmpty(flLTMRate) && flLTMPercentage > 0) {
                        let flPreviousItemAmount = 0;
                        if (!bConsolidationRequired && !isEmpty(intItemParent)) {
                            flPreviousItemAmount = recCurrentRecord.getSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                line: i
                            });
                        } else {
                            flPreviousItemAmount = getItemAmountTotal(recCurrentRecord, intItemId, strItemToCheckField);
                        }
                        flChargeAmount = (flPreviousItemAmount * flLTMPercentage) / 100;
                        strAmountType = "Percent of Amount - ";
                    }

                    if (bLTMItem) {
                        if (isEmpty(objItemLTM[intLTMItem])) {
                            objItemLTM[intLTMItem] = {
                                amount: parseFloat(flAmount)
                            }
                        } else {
                            objItemLTM[intLTMItem].amount += parseFloat(flAmount);
                        }
                    } else {
                        if (intLTMQuantity > 0) {
                            if (isEmpty(objItemQuantity[intItemToCheck])) {
                                objItemQuantity[intItemToCheck] = {
                                    quantity: parseFloat(intQuantity),
                                    amount: parseFloat(flAmount),
                                    ltmQuantity: intLTMQuantity,
                                    ltmAmount: flChargeAmount,
                                    amountType: strAmountType,
                                    field: strItemToCheckField,
                                    name: strItemName,
                                    rate: flRate,
                                    unit: strUnitName
                                }
                            } else {
                                objItemQuantity[intItemToCheck].quantity += parseFloat(intQuantity);
                                objItemQuantity[intItemToCheck].amount += parseFloat(flAmount);
                                if (strAmountType === "Flat Rate – ") {
                                    objItemQuantity[intItemToCheck].ltmAmount = parseFloat(flChargeAmount);
                                } else {
                                    objItemQuantity[intItemToCheck].ltmAmount += parseFloat(flChargeAmount);
                                }
                            }
                        }
                    }
                }

                //log.debug("objItemQuantity", objItemQuantity);
                //log.debug("objItemLTM", objItemLTM);
                //now run through non LTM lines;
                for (let key in objItemQuantity) {
                    let flAmount = objItemQuantity[key].amount;
                    let intQuantity = objItemQuantity[key].quantity;
                    let strItemName = objItemQuantity[key].name;
                    let flRate = objItemQuantity[key].rate;
                    let strUnitName = objItemQuantity[key].unit;
                    let intLTMQuantity = objItemQuantity[key].ltmQuantity;
                    let flChargeAmount = objItemQuantity[key].ltmAmount;
                    let strAmountType = objItemQuantity[key].amountType;
                    let strItemToCheckField = objItemQuantity[key].field;
                    let intTotalQuantity = getItemQuantityTotal(recCurrentRecord, key, strItemToCheckField);
                    let flTotalAmount = getItemAmountTotal(recCurrentRecord, key, strItemToCheckField);
                    if (intTotalQuantity < intLTMQuantity) {
                        if (isEmpty(objItemLTM[key])) {
                            if (!bShowMessage) {
                                let bProceed = showWarningSave(objConfig.option, intTotalQuantity, intLTMQuantity, flTotalAmount, flChargeAmount, strItemName, flRate, strUnitName);
                                if (!bProceed) {
                                    bShowMessage = true;
                                    return true;
                                }
                                bShowMessage = true;
                            }
                            isAuto = true;
                            addLTMItem(recCurrentRecord, key, objConfig.item, flChargeAmount, "", "", strAmountType);
                        } else {
                            //update line
                            let flLtmTotal = objItemLTM[key].amount || 0;
                            if (flLtmTotal != flChargeAmount) {
                                const intLTMExistAt = checkIfLTMItemExist(recCurrentRecord, objConfig.item, key);
                                if (intLTMExistAt >= 0) {
                                    isAuto = true;
                                    updateLTMItem(recCurrentRecord, intLTMExistAt, flChargeAmount);
                                }
                            }
                        }
                    }
                }

                //now run through LTM lines
                for (let j = intLineCount - 1; j >= 0; j--) {
                    let intLTMItemId = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_LTM_ITEM,
                        line: j
                    });
                    let intLTMParentId = recCurrentRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: FIELDS.FLD_PARENT_ITEM,
                        line: j
                    });
                    let bLTMItem = !isEmpty(intLTMItemId);
                    if (bLTMItem) {
                        let bCoreExist = false;
                        if (bConsolidationRequired && !isEmpty(intLTMParentId)) {
                            //bCoreExist = checkIfLTMCoreExist(recCurrentRecord, "", intLTMItemId);
                            bCoreExist = checkIfLTMCoreExistSave(recCurrentRecord, intLTMItemId);
                        } else {
                            //bCoreExist = checkIfLTMCoreExist(recCurrentRecord, intLTMItemId, "");
                            bCoreExist = checkIfLTMCoreExistSave(recCurrentRecord, intLTMItemId);
                        }
                        if (!bCoreExist) {
                            bRemoveLine = true;
                            removeLineItem(recCurrentRecord, j);
                            bRemoveLine = false;
                        }
                    }
                }
                return true;
            } else {
                return true;
            }
        } catch (e) {
            log.error({title: "Error while saving record", details: e.message});
            return true;
        }
    }


    return {pageInit, sublistChanged, validateDelete, saveRecord};

});
