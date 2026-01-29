/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Custom Tool script for MCP: Record URL Resolution
 * Exposes N/url.resolveRecord to generate view and edit URLs for NetSuite records
 */
define(['N/url', 'N/log'], (url, log) => {
    const LOG_PREFIX = 'GetRecordURL';

    /**
     * Generate both view and edit URLs for a NetSuite record
     * @param {Object} args - Input parameters
     * @param {string} args.recordType - NetSuite record type (e.g., 'customer', 'salesorder', 'item')
     * @param {number|string} args.recordId - Internal ID of the record
     * @returns {Object} Result object with success flag, URLs, or error message
     */
    function getRecordUrl(args) {
        try {
            // Validate required inputs
            if (!args.recordType) {
                throw new Error('Missing required parameter: recordType');
            }
            if (!args.recordId) {
                throw new Error('Missing required parameter: recordId');
            }

            const recordType = String(args.recordType);
            const recordId = String(args.recordId);

            log.debug(`${LOG_PREFIX}:getRecordUrl`, { 
                recordType: recordType, 
                recordId: recordId 
            });

            // Resolve domain for fully qualified URLs
            const domain = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });

            // Generate VIEW URL
            const viewUrlPath = url.resolveRecord({
                recordType: recordType,
                recordId: recordId,
                isEditMode: false
            });

            // Generate EDIT URL
            const editUrlPath = url.resolveRecord({
                recordType: recordType,
                recordId: recordId,
                isEditMode: true
            });

            // Construct fully qualified URLs
            const viewUrl = `https://${domain}${viewUrlPath}`;
            const editUrl = `https://${domain}${editUrlPath}`;

            log.audit(`${LOG_PREFIX}:getRecordUrl:Success`, { 
                recordType: recordType,
                recordId: recordId,
                viewUrl: viewUrl,
                editUrl: editUrl
            });

            return {
                success: true,
                recordType: recordType,
                recordId: recordId,
                viewUrl: viewUrl,
                editUrl: editUrl,
                domain: domain
            };

        } catch (e) {
            const errorMsg = e.message || String(e);
            log.error(`${LOG_PREFIX}:getRecordUrl:Error`, errorMsg);
            
            return {
                success: false,
                error: `Failed to resolve record URL: ${errorMsg}. Please verify that the record type and ID are valid.`
            };
        }
    }

    // Export tool methods
    return {
        getRecordUrl
    };
});