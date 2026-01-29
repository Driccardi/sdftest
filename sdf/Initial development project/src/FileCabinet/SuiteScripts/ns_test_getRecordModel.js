/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var rectype = scriptContext.request.parameters.recordType;

            var rec = record.create({
                type: record.Type[rectype],
                isDynamic: true,
            });


            var fields = rec.getFields();


            const outObj = { recordType: rectype, fields: fields, record: rec };
            
            scriptContext.response.write(JSON.stringify(outObj));
        }

        return {onRequest}

    });
