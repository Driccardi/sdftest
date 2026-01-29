/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Copies an existing saved search and adds columns with formulas to analyze landed costs.
 * Based on SuiteAnswers 35633.
 */
define(['N/runtime', 'N/search'],
    
    (runtime, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const param_costCatSearch = 'custscript_nspsw_su_ss_landedcostcat';
            const param_costAnalysisSearch = 'custscript_nspsw_su_ss_landedanalysis';
            const featureId = 'LANDEDCOST';
            const searchTitle = 'NSPSW | Landed Cost Analysis';
            const searchId = 'customsearch_lca_';

            try{
                log.audit({
                    title: 'Execution Started',
                    details: runtime.getCurrentScript().deploymentId
                });

                const now = new Date();
                const isoString = now.toISOString().replace(/[^a-zA-Z0-9]/g, '');
                const newSearchId = searchId + isoString;
                const newSearchTitle = searchTitle + ' ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

                log.debug({
                    title: 'newSearchTitle',
                    details: newSearchTitle
                });
                log.debug({
                    title: 'newSearchId',
                    details: newSearchId
                });

                let lcEnabled = runtime.isFeatureInEffect({feature: featureId});
                if (!lcEnabled) return;

                let costCatSearchId = runtime.getCurrentScript().getParameter({name: param_costCatSearch});
                let costAnalysisSearchId = runtime.getCurrentScript().getParameter({name: param_costAnalysisSearch});

                let objSSCostCat = search.load({id: costCatSearchId});

                let arrCostCat = [];
                objSSCostCat.run().each(function (result) {
                    let costCat = {};
                    costCat['name'] = result.getValue({name: 'name'});
                    costCat['accountId'] = result.getValue({name: 'internalid', join: 'account'});
                    let duplicate = arrCostCat.map(element => element.accountId).includes(costCat.accountId);
                    if (!duplicate) arrCostCat.push(costCat);
                    return true;
                });

                log.debug({
                    title: 'arrCostCat',
                    details: JSON.stringify(arrCostCat)
                });

                let objSSAnalysis = search.load({id: costAnalysisSearchId});

                let objNewSearch = search.create({
                    title: newSearchTitle,
                    id: newSearchId,
                    type: objSSAnalysis.searchType,
                    filters: objSSAnalysis.filters,
                    columns: objSSAnalysis.columns
                });
                for (let costCat of arrCostCat) {
                    let stFormula = getLandedCostFormula(costCat.accountId);
                    log.debug({
                        title: JSON.stringify(costCat),
                        details: stFormula
                    });
                    objNewSearch.columns.push(search.createColumn({
                        name: 'formulacurrency',
                        summary: search.Summary.SUM,
                        formula: stFormula,
                        label: costCat.name
                    }));
                }

                let allLCAccounts = arrCostCat.map(element => element.accountId);
                let stFormula = getTotalLandedCostFormula(allLCAccounts);

                log.debug({
                    title: 'allLCAccounts ' + JSON.stringify(allLCAccounts),
                    details: stFormula
                });

                objNewSearch.columns.push(search.createColumn({
                    name: 'formulacurrency',
                    summary: search.Summary.SUM,
                    formula: stFormula,
                    label: 'Total Landed Cost'
                }));

                let newLCASearch = objNewSearch.save();

                log.audit({
                    title: 'Saved Search Created',
                    details: objNewSearch.title + '; ' + objNewSearch.id + '; internalId: ' + newLCASearch
                });

                log.audit({
                    title: 'Execution Completed',
                    details: 'Remaining usage: ' + runtime.getCurrentScript().getRemainingUsage()
                });
            } catch (ex) {
                log.error({
                    title: ex.name,
                    details: ex.message + '; stack: ' + ex.stack
                });
            }
        }

        /**
         * @name getLandedCostFormula
         * Case statement to be used in Formula (Currency) result column along with Account internal id
         * @param {string} accountId
         * @returns {string}
         */
        function getLandedCostFormula(accountInternalId) {
            let stCaseStatement = 'CASE WHEN {account.internalid} = ? THEN ABS({amount}) ELSE 0 END';
            return stCaseStatement.replace(/\?/g, accountInternalId);
        }

        /**
         * @name getTotalLandedCostFormula
         * Case statement to be used in Formula (Currency) result column along with array of Account internal ids
         * @param {string[]} arrAccountIds
         * @returns {string}
         */
        function getTotalLandedCostFormula(arrAccountIds) {
            let stCaseStatement = 'CASE WHEN {account.internalid} IN (?) THEN ABS({amount}) ELSE 0 END';
            return stCaseStatement.replace(/\?/g, arrAccountIds);
        }

        /**
         * @name isEmpty
         * Evaluates a value to see if it is null or empty
         * @param value
         * @returns {boolean}
         */
        function isEmpty(value) {
            if (value === null)
                return true;
            if (value === undefined)
                return true;
            if (value === 'undefined')
                return true;
            if (value === '')
                return true;
            if (value.constructor === Object && Object.keys(value).length === 0)
                return true;
            if (value.constructor === Array && value.length === 0)
                return true;
            return false;
        };

        return {onRequest}

    });
