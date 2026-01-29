/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define(['N/ui/serverWidget', 'N/url','N/query'], (serverWidget, url,query) => {

    const PORTLET_TITLE = 'Transaction Search by Amount';
    const NO_RESULTS_MESSAGE = 'No matching transactions found';

    function render(params) {
        const portlet = params.portlet;
        portlet.title = PORTLET_TITLE;

        const suiteletPath = url.resolveScript({
            scriptId: 'customscript_ns_txas_su_searchwidget',
            deploymentId: 'customdeploy_ns_txas_su_searchwidget',
            returnExternalUrl: false
        });

        const baseUrl = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        const suiteletUrl = `https://${baseUrl}${suiteletPath}`;

        const html = `
            <style>
                .redwood-portlet { font-family: Arial, sans-serif; padding: 10px; }
                .redwood-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                .redwood-table th, .redwood-table td { border: 1px solid #ddd; padding: 8px; }
                .redwood-table th { background-color: #375E62; color: white; }
                .alert { color: #B07283; font-weight: bold; margin-top: 10px; }
                .form-row { margin: 6px 0; }
            </style>
            <div class="redwood-portlet">
                <div class="form-row">
                    <label for="amount">Amount:</label>
                    <input type="number" id="amount" step="0.01">
                </div>
                <button id="searchBtn">Search</button>
                <div id="results"></div>
            </div>
            <script>
                    window.searchTransactions = function() {
                    console.log('Searching transactions...');
                        const amount = document.getElementById('amount').value;
                        const resultsDiv = document.getElementById('results');

                        fetch('${suiteletUrl}', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount })
                        })
                        .then(response => {
                            if (!response.ok) throw new Error('HTTP error! Status: ' + response.status);
                            return response.json();
                        })
                        .then(data => {
                            if (!data.length) {
                                resultsDiv.innerHTML = '<div class="alert">⚠️ ${NO_RESULTS_MESSAGE} </div>';
                                return;
                            }

                            let table = '<table class="redwood-table"><tr><th>Date</th><th>Type</th><th>Status</th><th>Transaction</th></tr>';
                            data.forEach(row => {
                                table += '<tr><td>' + row.trandate +  '</td><td>' + row.type + '</td><td>' + row.status + '</td><td><a href="'+ row.url+'" target="_blank">'+ row.tranname +'</a></td></tr>';
                            });
                            table += '</table>';
                            resultsDiv.innerHTML = table;
                        })
                        .catch(error => {
                            console.error('Error searching transactions:', error);
                            resultsDiv.innerHTML = '<div class="alert">❌ Search failed: ' + error.message + '</div>';
                        });
                    }

                    document.getElementById('searchBtn').addEventListener('click', window.searchTransactions);

            </script>
        `;

        portlet.html = html;
    }
    return { render };
});
