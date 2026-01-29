/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

define(['N/currentRecord', 'N/ui/dialog'], function(currentRecord, dialog) {
  function pageInit(scriptContext) {
    // Add a button to the page
    var currentRec = scriptContext.currentRecord;
	// Add an HTML field to the page
// Add a container element to the page
  var container = document.createElement('div');
  container.id = 'custpage_sublist';
  document.body.appendChild(container);
	
	renderTable(scriptContext);
  }

// Add a function to get the selected rows
     function getSelectedRows() {
      var selectedRows = [];
      tableData.forEach(function(row) {
        if (document.getElementById('checkbox_' + row.id).checked) {
          selectedRows.push(row);
        }
      });

      // Create a sublist table
      var sublistHtml = '<table border="1">';
      sublistHtml += '<tr><th>Column 1</th><th>Column 2</th></tr>';
      selectedRows.forEach(function(row) {
        sublistHtml += '<tr><td>' + row.column1 + '</td><td>' + row.column2 + '</td></tr>';
      });
      sublistHtml += '</table>';
		alert(JSON.stringify(selectedRows));
      // Display the sublist table in a new dialog box
    
    }
  function renderTable(scriptContext) {
    // Define the table data
    var tableData = [
      { id: 1, column1: 'Value 1', column2: 'Value 2' },
      { id: 2, column1: 'Value 3', column2: 'Value 4' },
      { id: 3, column1: 'Value 5', column2: 'Value 6' }
    ];

    // Create the table
    var tableHtml = '<table border="1">';
    tableHtml += '<tr><th></th><th>Column 1</th><th>Column 2</th></tr>';
    tableData.forEach(function(row) {
      tableHtml += '<tr><td><input type="checkbox" id="checkbox_' + row.id + '"></td><td>' + row.column1 + '</td><td>' + row.column2 + '</td></tr>';
    });
    tableHtml += '</table>';

    // Add a button to get the selected rows
    tableHtml += '<button onclick="getSelectedRows()">Get Selected Rows</button>';
    var currentRec = scriptContext.currentRecord;
	currentRec.setValue('custbody_mrg_html_field', tableHtml);

    
  }
  

  return {
    pageInit: pageInit,
    renderTable: renderTable
  };
});