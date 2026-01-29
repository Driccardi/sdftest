/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @Description Create VIN attribute records from stored JSON API response
 */

define(['N/record', 'N/search', 'N/runtime', 'N/log'],
    (record, search, runtime, log) => {
  
    const SCRIPT_PARAM_VEHICLE_ID = 'custscript_ns_mr_vehicle_id';
    const MAIN_FIELDS = ['Make', 'Model', 'VehicleType', 'BodyClass'];
  
    /**
     * Input stage: Fetch API response JSON from the target vehicle record
     */
    const getInputData = () => {
      const vehicleId = runtime.getCurrentScript().getParameter({ name: SCRIPT_PARAM_VEHICLE_ID });
      if (!vehicleId) throw new Error('Vehicle ID script parameter is required');
  
      const vehicleRec = record.load({
        type: 'customrecord_ns_vino_vehicle',
        id: vehicleId,
        isDynamic: false
      });
  
      const vin = vehicleRec.getValue('custrecord_ns_vino_vin');
      const rawJson = vehicleRec.getValue('custrecord_ns_vino_apiresponse');
      if (!rawJson || !vin) {
        throw new Error(`Missing VIN or API response for vehicle ID ${vehicleId}`);
      }
  
      const jsonData = JSON.parse(rawJson);
      const keyValuePairs = [];
  
      for (const [key, value] of Object.entries(jsonData)) {
        if (value && !MAIN_FIELDS.includes(key)) {
          keyValuePairs.push({
            key,
            value,
            vin,
            vehicleId
          });
        }
      }
  
      return keyValuePairs;
    };
  
    /**
     * Map stage: Emit one record per attribute
     */
    const map = (context) => {
      const entry = JSON.parse(context.value);
      const attrName = `${entry.vin}_${entry.key}`;
  
      context.write({
        key: attrName,
        value: {
          attrKey: entry.key,
          attrValue: entry.value,
          vehicleId: entry.vehicleId
        }
      });
    };
  
    /**
     * Reduce stage: Create attribute record if not already present
     */
    const reduce = (context) => {
      const attrName = context.key;
      const data = JSON.parse(context.values[0]); // only one value per key expected
      const vehicleId = data.vehicleId;
  
      // Check for existing attribute with same name + vehicle
      const existing = search.create({
        type: 'customrecord_ns_vino_attribute',
        filters: [
          ['name', 'is', attrName],
          'AND',
          ['custrecord_ns_vino_vehicle_ref', 'is', vehicleId]
        ],
        columns: ['internalid']
      }).run().getRange({ start: 0, end: 1 });
  
      if (existing.length === 0) {
        const attrRec = record.create({
          type: 'customrecord_ns_vino_attribute',
          isDynamic: false
        });
  
        attrRec.setValue({ fieldId: 'name', value: attrName });
        attrRec.setValue({ fieldId: 'custrecord_ns_vino_vehicle_ref', value: vehicleId });
        attrRec.setValue({ fieldId: 'custrecord_ns_vino_attr_name', value: data.attrKey });
        attrRec.setValue({ fieldId: 'custrecord_ns_vino_attr_value', value: data.attrValue });
        attrRec.save();
      }
    };
  
    /**
     * Summarize: log results and errors
     */
    const summarize = (summary) => {
/*       const logErrors = (stage) => {
        summary[stage].errors.iterator().each((key, error) => {
          log.error(`${stage} error for key ${key}`, error);
          return true;
        });
      }; */
  
      log.audit('MR Completed', {
        totalDuration: summary.seconds,
        usage: summary.usage
      });
  
      //logErrors('inputSummary');
      //logErrors('mapSummary');
      //logErrors('reduceSummary');
    };
  
    return { getInputData, map, reduce, summarize };
  });
  