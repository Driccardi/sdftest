/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/log', 'N/query', 'N/record', 'N/runtime','N/url','N/ui/dialog','./indexDB'],
    /**
     * @param{currentRecord} currentRecord
     * @param{log} log
     * @param{query} query
     * @param{record} record
     * @param{runtime} runtime
     */
    function(currentRecord, log, query, record, runtime, url, dialog, indexDB) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            var thisScript = runtime.getCurrentScript();
            var setupRecord = thisScript.getParameter({name: 'custscript_ns_itemdrop_setup'});

            loadAliasTable(setupRecord);
            backgroundCacheItemAliases(setupRecord);
            document.getElementById('item-drop-processor').addEventListener('click', function(event) {
                 event.preventDefault(); // Prevent default behavior

                    var fileInput = document.getElementById('fileUpload');
                    var file = fileInput.files[0];
                    console.log(file);
                    if (file) {
        
                        parseFile(file);

                    } else {
                        dialog.alert({
                            title: 'No File Selected',
                            message: `Please select a file to process.`,
                        });

                    }
                    return false; 
            }); // End of Event Listener - Click function

    
        } // End of pageInit function

        /**
         * Loads the alias table, caching results for subsequent operations.
         */
        function loadAliasTable() {
            console.log('Loading Alias Table');
            try {
                var storedTable = sessionStorage.getItem('aliasTable');
                console.log(storedTable);
                //const aliasTable = sessionStorage.getItem('aliasTable') || fetchAliasTable();
                const aliasTable =  fetchAliasTable();
                sessionStorage.setItem('aliasTable', JSON.stringify(aliasTable));
            } catch (error) {
                log.error('Alias Table Load Failed', error.message);
            }
        }
        /**
     * Fetches the alias table in a background thread and caches the result.
     */
    function fetchAliasTable() {
        console.log('Fetching Alias Table');
        try {
            // Define the Suitelet URL (retrieve from NetSuite or define constant)
            const scriptId = runtime.getCurrentScript().getParameter({      name: 'custscript_ns_itdp_getter_su'    });
            const deploymentId = runtime.getCurrentScript().getParameter({  name: 'custscript_ns_itdp_getter_sud'   });
            //_ns_su_itemdrop_datahandler
            const params = { datatype: 'aliastable' }; // Example query parameter
            const accountDomain = url.resolveDomain({
                hostType: url.HostType.APPLICATION  // Other options: url.HostType.RESTLET, url.HostType.SUITETALK
            });
            const suiteletUrl = 'https://' + accountDomain +  url.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId,
                returnExternalUrl: false, // Use false for internal URL
                params: params, // Optional query parameters
            });
            console.log(suiteletUrl);

            // Create a new worker thread
            const worker = new Worker(URL.createObjectURL(new Blob([
                `(${aliasTableWorker.toString()})()`
            ], { type: 'application/javascript' })));

            // Pass the Suitelet URL to the worker thread
            worker.postMessage(suiteletUrl);

            // Handle messages from the worker
            worker.onmessage = function(event) {
                const aliasTable = event.data;
                if (aliasTable) {
                    if(aliasTable.error) {
                        log.error('Worker Suitelet Error', aliasTable.error);
                        // Show a modal dialog with the error message
                        dialog.alert({
                            title: 'Error retrieving field aliases',
                            message: `An error occurred: ${aliasTable.error}. Please contact the administrator.`,
                        });
                    } else {
                        sessionStorage.setItem('aliasTable', JSON.stringify(aliasTable));
                        log.debug('Alias Table Cached Successfully', aliasTable);
                        console.log(aliasTable);
                    }
                }
            };

            // Handle errors in the worker
            worker.onerror = function(error) {
                log.error('Worker Error', error.message);
                        // Show a modal dialog with the error message
                    dialog.alert({
                        title: 'Error retrieving field aliases',
                        message: `An error occurred: ${error.message}. Please contact the administrator.`,
                    });
            };
        } catch (error) {
            log.error('Error Initializing Alias Table Fetch', error.message);
        }
    }
    function backgroundCacheItemAliases(setupRecord){
        console.log('Caching Item Aliases');
        try {
            // Define the Suitelet URL (retrieve from NetSuite or define constant)
            const scriptId = runtime.getCurrentScript().getParameter({      name: 'custscript_ns_itemdrop_getter_su'    });
            const deploymentId = runtime.getCurrentScript().getParameter({  name: 'custscript_ns_itemdrop_getter_sud'   });
            const record = currentRecord.get();
            const subsidiary = record.getValue({fieldId: 'subsidiary'});
            const params = { 
                        datatype: 'itemalias',
                        setuprecord: setupRecord,
                        sub: subsidiary
                    };
            const accountDomain = url.resolveDomain({
                hostType: url.HostType.APPLICATION 
            });
            const suiteletUrl = 'https://' + accountDomain +  url.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId,
                returnExternalUrl: false, // Use false for internal URL
                params: params, // Optional query parameters
            });

            // Create a new worker thread
            const worker = new Worker(URL.createObjectURL(new Blob([
                `(${aliasTableWorker.toString()})()`
            ], { type: 'application/javascript' })));

            // Pass the Suitelet URL to the worker thread
            worker.postMessage(suiteletUrl);

            // Handle messages from the worker
            worker.onmessage = function(event) {
                var aliasTable = event.data;
                console.log(aliasTable);
                if (aliasTable) {
                    if(aliasTable.error) {
                        log.error('Worker Suitelet Error', aliasTable.error);
                        // Show a modal dialog with the error message
                        dialog.alert({
                            title: 'Error retrieving Item Aliases',
                            message: `An error occurred: ${aliasTable.error}. Please contact the administrator.`,
                        });
                    } else {
                        aliasTable = transformItemArray(aliasTable);
                        sessionStorage.setItem('itemAlias', JSON.stringify(aliasTable));
                        log.debug('Item Aliases Table Cached Successfully', aliasTable);
                        console.log(aliasTable);
                    }
                }
            };

            // Handle errors in the worker
            worker.onerror = function(error) {
                log.error('Worker Error', error.message);
                        // Show a modal dialog with the error message
                    dialog.alert({
                        title: 'Error retrieving Item Aliases',
                        message: `An error occurred: ${error.message}. Please contact the administrator.`,
                    });
            };
        } catch (error) {
            log.error('Error Initializing Item Table Fetch', error);
        }
    }
    /**
     * Worker thread for fetching the alias table via Suitelet.
     */

    function aliasTableWorker() {
        onmessage = function(e) {
            console.log('Worker Received Message');
            console.log(e);
            const suiteletUrl = e.data; // Suitelet URL passed from the main thread


            // Perform the HTTP GET request to fetch the alias table
            fetch(suiteletUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        // If the data contains an error, throw it to trigger onerror in the main thread
                        throw new Error(data.error);
                    }
                    // Send the fetched data back to the main thread
                    postMessage(data);
                    self.close();
                })
                .catch(error => {
                    // Handle errors and log them
                    console.error('Error Fetching Alias Table:', error.message);
                    postMessage({ error: error.message });
                    self.close();
                });
        };
    }
/**
 * Transforms an input array of item objects by splitting the alias field into individual aliases,
 * creating new entries for each alias, and removing duplicates.
 *
 * @param {Array<Object>} inputArray - The array of objects to transform. Each object must have the fields:
 *   - `alias` (string): The pipe-delimited aliases.
 *   - `itemid` (string): The item's ID.
 *   - `fullname` (string): The item's full name.
 *   - `internalid` (number): The item's internal ID.
 * @returns {Array<Object>} - A new array with individual aliases, each mapped to the original object's properties,
 *                            with duplicates removed.
 */
function transformItemArray(inputArray) {
    let resultArray = []; // Array to hold the transformed results

    inputArray.forEach(obj => {
        const aliases = obj.alias.split('|'); // Split the alias string by "|" to get individual aliases
        aliases.forEach(alias => {
            if (alias.trim() !== '') { // Ignore empty or whitespace-only aliases
                resultArray.push({
                    alias: alias.trim(), // Trim whitespace around the alias
                    itemid: obj.itemid, // Retain the original item's ID
                    fullname: obj.name, // Retain the original item's full name
                    internalid: obj.internalid // Retain the original item's internal ID
                });
            }
        });
    });

    // Remove duplicates from the resulting array
    resultArray = removeDuplicates(resultArray);
    return resultArray;
}

/**
 * Removes duplicate objects from an array based on a combination of alias and internalid fields.
 *
 * @param {Array<Object>} array - The array of objects to deduplicate. Each object must have the fields:
 *   - `alias` (string): The alias string.
 *   - `internalid` (number): The item's internal ID.
 * @returns {Array<Object>} - A new array with duplicates removed.
 */
function removeDuplicates(array) {
    const uniqueEntries = new Set(); // A set to track unique combinations of alias and internalid
    const filteredArray = array.filter(item => {
        const key = `${item.alias}-${item.internalid}`; // Create a unique key by combining alias and internalid
        if (uniqueEntries.has(key)) {
            return false; // Skip duplicates if the key already exists in the set
        } else {
            uniqueEntries.add(key); // Add the unique key to the set
            return true; // Keep the item if it's unique
        }
    });
    return filteredArray;
}

    function parseFile(file) {
        log.debug('Parsing Start', { fileName: file.name });
        showSpinner();
        setupRecordId = runtime.getCurrentScript().getParameter({name: 'custscript_ns_itemdrop_setup'});
        setupRecord = record.load({
            type: 'customrecord_ns_itemdrop_setup',
            id: setupRecordId
        });
        const warnRowCount = setupRecord.getValue({fieldId: 'custrecord_ns_ids_warnrows'});
        const hardStopRowCount = setupRecord.getValue({fieldId: 'custrecord_ns_ids_maxrows'});

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                hideSpinner();
                const headers = results.meta.fields; // Original CSV headers
                const mappedHeaders = mapHeadersToAliasTable(headers); // Map headers to alias table
    
                if (!mappedHeaders.valid) {
                    dialog.alert({
                        title: 'Alias Table Error',
                        message: `<span>&#x26A0; Warning: Missing headers detected!</span><br/>There was an issue with the alias table or the uploaded file headers. Please ensure all CSV headers are valid and mapped and try again. <br/><br/><b>The following headers are missing or invalid: ${mappedHeaders.missingHeaders.join(', ')}</b>.`,
                    });
                    log.error('Invalid Alias Table or Headers', mappedHeaders);
                    return;
                }
                log.debug('Mapped Headers', mappedHeaders);
                console.log(mappedHeaders);
                const totalRowCount = results.data.length;
                log.debug('Total Row Count', totalRowCount);
    
                // Check row count thresholds
                if (totalRowCount > warnRowCount && totalRowCount <= hardStopRowCount) {
                    dialog.alert({
                        title: 'Performance Warning',
                        message: `The uploaded CSV contains ${totalRowCount} rows, which may cause performance issues. Please proceed with caution.`,
                    }).then(() => {
                        processCsvData(results.data,mappedHeaders.mappedArray);
                    });
                } else if (totalRowCount > hardStopRowCount) {
                    dialog.alert({
                        title: 'File Too Large',
                        message: `The uploaded CSV contains ${totalRowCount} rows, which exceeds the limit of ${hardStopRowCount}. Please reduce the number of rows and try again.`,
                    });
                    return; // Stop processing
                } else {
                    // Proceed if row count is within acceptable limits
                    processCsvData(results.data,mappedHeaders.mappedArray);
                }
            },
            error: function (error) {
                hideSpinner();
                dialog.alert({
                    title: 'Parsing Error',
                    message: `Error parsing file: ${error.message}`,
                });
            }
        });
    }
        /**
         * Maps CSV headers to the alias table and validates them.
         * Strips spaces and special characters from both headers and alias table entries for normalization.
         * @param {Array<string>} headers - Array of CSV headers from the file.
         * @returns {Object} - Object containing mapped headers, a validity flag, and missing headers.
         */
        function mapHeadersToAliasTable(headers) {
            // Retrieve the alias table from sessionStorage
            const aliasTable = JSON.parse(sessionStorage.getItem('aliasTable'));

            // Validate the alias table
            if (!aliasTable || !Array.isArray(aliasTable)) {
                log.error('Invalid Alias Table', 'The alias table is null, undefined, or not an array.');
                return {
                    valid: false,
                    mappedArray: [],
                    missingHeaders: headers, // If alias table is invalid, all headers are considered missing
                };
            }

            const mappedArray = [];
            const missingHeaders = [];

            // Helper function to normalize headers (strip spaces, special characters, and make lowercase)
            const normalize = str => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

            // Normalize alias table entries
            const normalizedAliasTable = aliasTable.map(alias => ({
                ...alias,
                normalized_column_name: normalize(alias.column_name)
            }));

            // Normalize and map headers
            headers.forEach(header => {
                const normalizedHeader = normalize(header);
                const aliasEntry = normalizedAliasTable.find(alias => alias.normalized_column_name === normalizedHeader);
                if (aliasEntry) {
                    mappedArray.push({
                        column_name: aliasEntry.column_name,
                        field_id: aliasEntry.field_id,
                        data_type_text: aliasEntry.data_type_text,
                        data_type_id: aliasEntry.data_type_id
                    });
                } else {
                    missingHeaders.push(header);
                }
            });

            return {
                valid: missingHeaders.length === 0,
                mappedArray: mappedArray,
                missingHeaders: missingHeaders
            };
        }

//*************************************************************************************************/
/**
 * Processes the CSV data and maps each row to the alias array.
 * Categorizes rows into Single Matches (good), Multiple Matches (ambiguous), and Unmatched (errors).
 *
 * @param {Array<Object>} csvData - Parsed CSV data rows.
 * @param {Array<Object>} mappedHeaders - The mapped header array from the alias table.
 */
function processCsvData(csvData, mappedHeaders) {
    const aliasTable = JSON.parse(sessionStorage.getItem('itemAlias')); // Retrieve alias table from session storage
    if (!aliasTable || !Array.isArray(aliasTable)) {
        dialog.alert({
            title: 'Alias Table Error',
            message: 'The alias table is not loaded or is invalid. Please reload the page and try again.',
        });
        return;
    }

    // Locate the item column using mappedHeaders
    const itemColumn = mappedHeaders.find(header => header.field_id === 'item');
    if (!itemColumn) {
        dialog.alert({
            title: 'Header Error',
            message: 'The CSV does not contain a valid item column. Please check the uploaded file.',
        });
        return;
    }

    // Initialize arrays for different match statuses
    const singleMatches = [];
    const multipleMatches = [];
    const unmatched = [];

    // Process each row in the CSV
    var rowIndex = 0;
    csvData.forEach((row, index) => {
        console.log('Processing Row:', index + 1);
        console.log(row);
        console.log(itemColumn);
        const column_name = itemColumn.column_name.trim().toLowerCase() // Normalize the item column name;
        const itemString = row[column_name]; // Extract the item string from the current row
        const matchedAliases = lookupAlias(itemString, aliasTable);

        if (matchedAliases.length === 1) {
            // Single match: good row
            singleMatches.push({
                rowIndex: index + 1,
                originalRow: row,
                matchedItem: matchedAliases[0],
            });
        } else if (matchedAliases.length > 1) {
            // Ambiguous match: multiple entries found
            multipleMatches.push({
                rowIndex: index + 1,
                originalRow: row,
                matchedAliases,
            });
        } else {
            // No match: unmatched row
            unmatched.push({
                rowIndex: index + 1,
                originalRow: row,
            });
        }
    });

    // Display results in a modal DIV interface
    displayResults(singleMatches, multipleMatches, unmatched, csvData, mappedHeaders,aliasTable);
}

/**
 * Looks up an item string in the alias table.
 *
 * @param {string} itemString - The item string to look up.
 * @param {Array<Object>} aliasTable - The alias table to search.
 * @returns {Array<Object>} - An array of matched aliases.
 */
function lookupAlias(itemString, aliasTable) {
    console.log('Item String:', itemString);
    const normalizedItem = normalizeString(itemString); // Normalize the item string for comparison
    console.log('Normalized Item:', normalizedItem);
    return aliasTable.filter(alias =>
        normalizeString(alias.alias).includes(normalizedItem)
    );
}

/**
 * Normalizes a string by trimming whitespace and converting it to lowercase.
 *
 * @param {string} str - The string to normalize.
 * @returns {string} - The normalized string.
 */
function normalizeString(str) {
    return str ? str.trim().toLowerCase() : '';
}

/**
 * Displays the results in a modal DIV interface.
 *
 * @param {Array<Object>} singleMatches - Array of single matches (good rows).
 * @param {Array<Object>} multipleMatches - Array of multiple matches (ambiguous rows).
 * @param {Array<Object>} unmatched - Array of unmatched rows (errors).
 * @param {Array<Object>} csvData - The original CSV data rows.
 * @param {Array<Object>} mappedHeaders - The mapped header array.
 */
function displayResults(singleMatches, multipleMatches, unmatched, csvData, mappedHeaders, aliasTable) {
    // Create the modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');

    // Create the modal container
    const modalDiv = document.createElement('div');
    modalDiv.classList.add('modal-div');
    modalDiv.innerHTML = `
        <button class="modal-close">&times;</button>
        <div class="modal-header">Results Summary</div>
        <div class="modal-content">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Original Item</th>
                        <th>Matched Item</th>
                        ${mappedHeaders.map(header => `<th>${header.column_name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${generateResultsRows(unmatched, 'red')}
                    ${generateResultsRows(multipleMatches, 'yellow', true)}
                    ${generateResultsRows(singleMatches, 'green')}
                </tbody>
            </table>
        </div>
    `;

    // Append the modalDiv to the overlay
    modalOverlay.appendChild(modalDiv);

    // Append the modal overlay to the document body
    document.body.appendChild(modalOverlay);

    // Attach event listeners for close functionality
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });

    // Close modal when clicking outside the modal content
    modalOverlay.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-overlay')) {
            document.body.removeChild(modalOverlay);
        }
    });

    // Attach event listeners for ambiguous and unmatched rows
    attachEventListenersForAmbiguousAndUnmatchedRows(multipleMatches, unmatched, aliasTable);
}

/**
 * Generates rows for the results table based on match status.
 *
 * @param {Array<Object>} rows - The array of rows to display.
 * @param {string} color - The dot color (green, yellow, red).
 * @param {boolean} isAmbiguous - Whether the rows are ambiguous.
 * @returns {string} - HTML string for the rows.
 */
function generateResultsRows(rows, color, isAmbiguous = false) {
    return rows.map(row => {
        const status = isAmbiguous ? 'MULTIPLE' : color === 'red' ? 'NO MATCH' : 'MATCHED';
        return `
            <tr data-row-index="${row.rowIndex}"  class="status_${status}">
                <td><span class="dot ${color}"></span></td>
                <td>${row.originalRow.item}</td>
                <td>${status}</td>
                ${Object.values(row.originalRow)
                    .map(value => `<td>${value}</td>`)
                    .join('')}
            </tr>
        `;
    }).join('');
}

/**
 * Attaches event listeners for handling ambiguous and unmatched rows.
 *
 * @param {Array<Object>} multipleMatches - Array of ambiguous rows.
 * @param {Array<Object>} unmatched - Array of unmatched rows.
 * @param {Array<Object>} aliasTable - The alias table to use for rematching.
 */
function attachEventListenersForAmbiguousAndUnmatchedRows(multipleMatches, unmatched, aliasTable) {
    multipleMatches.forEach(row => {
        const rowElement = document.querySelector(`[data-row-index="${row.rowIndex}"]`);
        console.log(rowElement);
       rowElement.addEventListener('click', () => {
            // Open a pop-up for the user to select the correct alias
            showAmbiguousPopup(row, aliasTable);
        });
    });

    unmatched.forEach(row => {
        const rowElement = document.querySelector(`[data-row-index="${row.rowIndex}"]`);
        console.log(rowElement);
        rowElement.addEventListener('click', () => {
            // Open a text box interface for the user to re-enter the item string
            showUnmatchedPopup(row, aliasTable);
        });
    });
}

/**
 * Displays a pop-up modal for resolving ambiguous matches.
 * Allows the user to select the correct alias for a row.
 *
 * @param {Object} row - The row with ambiguous matches.
 * @param {Array<Object>} aliasTable - The alias table for reference.
 */
function showAmbiguousPopup(row, aliasTable) {
    // Create the modal overlay
    const popupOverlay = document.createElement('div');
    popupOverlay.classList.add('modal-overlay');

    // Create the modal content
    const popupDiv = document.createElement('div');
    popupDiv.classList.add('modal-div-small');
    popupDiv.innerHTML = `
        <button class="modal-close">&times;</button>
        <div class="modal-header">Resolve Ambiguous Match</div>
        <div class="modal-content">
            <p>The item "${row.originalRow.item}" matches multiple aliases. Please select the correct one:</p>
            <ul class="alias-selection-list no-bullets">
                ${row.matchedAliases.map(alias => `
                    <li>
                        <span class="alias-select-button emoji" data-internalid="${alias.internalid}" data-fullname="${alias.itemid}">🔘 ${alias.internalid}: ${alias.itemid}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;

    // Append the modal to the overlay
    popupOverlay.appendChild(popupDiv);

    // Append the overlay to the document body
    document.body.appendChild(popupOverlay);

    // Attach event listener to close the modal
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(popupOverlay);
    });

    // Handle alias selection
    document.querySelectorAll('.alias-select-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const selectedInternalId = event.target.getAttribute('data-internalid');
            const selectedFullName = event.target.getAttribute('data-itemid');

            // Update the row with the selected alias
            row.matchedItem = { internalid: selectedInternalId, fullname: selectedFullName };
            row.resolved = true; // Mark row as resolved

            console.log(`Selected alias for row ${row.rowIndex}:`, row.matchedItem);

            // Close the modal after selection
            document.body.removeChild(popupOverlay);

            // Optionally update the UI to reflect the resolved row
            updateRowToGreen(row);
        });
    });
}

/**
 * Updates the UI to reflect that a row has been resolved.
 *
 * @param {Object} row - The resolved row.
 */
function updateRowToGreen(row) {
    const rowElement = document.querySelector(`[data-row-index="${row.rowIndex}"]`);
    if (rowElement) {
        rowElement.querySelector('.dot').classList.remove('yellow');
        rowElement.querySelector('.dot').classList.add('green');
        const matchedItemCell = rowElement.querySelector('td:nth-child(3)'); // Adjust column index if needed
        matchedItemCell.textContent = `${row.matchedItem.internalid}: ${row.matchedItem.fullname}`;
    }
}


//**************************************   UI  HELPERS ************************************** */
        function showSpinner() {
            document.querySelector('.spinner').style.display = 'block';
            document.querySelector('.overlay').style.display = 'block';
        }
        
        function hideSpinner() {
            document.querySelector('.spinner').style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
        }
    
        return {
            pageInit: pageInit,

        };
        
    });
    