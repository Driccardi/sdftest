/**
 * Copyright NetSuite, Inc. 2025 All rights reserved. 
 * The following code is a demo prototype. Due to time constraints of a demo,
 * the code may contain bugs, may not accurately reflect user requirements 
 * and may not be the best approach. Actual implementation should not reuse 
 * this code without due verification.
 * 
 * (Module description here. Whole header length should not exceed 
 * 100 characters in width. Use another line if needed.)
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Feb 2025     SDEGUZMA
 * 
 */
/*
 * Task: SD140618
 * TSTDRV: Stairway for Retail US v2024.2 01.28 (TD2982761)
 */ 
{
     
}

/**
 * @param  Can be create, copy, edit
 */
function rejectLines() {
    alert('reject button clicked');
}

/**
 * @param  Can be create, copy, edit
 */
function approveLines() {
    alert('approve button clicked');
    submitPage();
}

function submitPage(){
    var oButton = document.forms['main_form'].elements['submitter'];
    if (oButton) {
        oButton.click();
    } else {
        window.onbeforeunload = null;
        document.forms[0].submit();
    }
}