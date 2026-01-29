/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @Description Creates recall records from NHTSA API response for a given vehicle
 */
/** Useful site for testing:  https://vingenerator.org/     */


define(['N/record', 'N/search', 'N/runtime', 'N/log', './NHTSA_Recalls_Library'], 
    (record, search, runtime, log, recallsLib) => {
    
      const SCRIPT_PARAM_VEHICLE_ID = 'custscript_ns_mr_vino_recallrecid';
    
      /**
       * Parse MM/DD/YYYY to Date
       * @param {string} dateStr
       * @returns {Date|null}
       */
      function parseUSDate(dateStr) {
        return dateStr ? new Date(dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : null;
    }
    
      /**
       * Input stage: Fetch vehicle record and get recall data
       */
      const getInputData = () => {
        const vehicleId = runtime.getCurrentScript().getParameter({ name: SCRIPT_PARAM_VEHICLE_ID });
        if (!vehicleId) throw new Error('Vehicle ID script parameter is required');
    
        const vehicle = record.load({
          type: 'customrecord_ns_vino_vehicle',
          id: vehicleId,
          isDynamic: false
        });
    
        const make = vehicle.getValue('custrecord_ns_vino_make');
        const model = vehicle.getValue('custrecord_ns_vino_model');
        const year = vehicle.getValue('custrecord_ns_vino_year');
    
        if (!(make && model && year)) {
          throw new Error('Missing make, model, or year on vehicle record.');
        }
    
        const recalls = recallsLib.getRecallsByVehicle({ make, model, modelYear: year });
        return recalls.map(r => ({ ...r, vehicleId }));
      };
    
      /**
       * Map: Emit one recall per context
       */
      const map = (context) => {
        const recall = JSON.parse(context.value);
        const recallKey = `${recall.vehicleId}_${recall.NHTSACampaignNumber}`;
        context.write({ key: recallKey, value: recall });
      };
    
      /**
       * Reduce: Create recall record if not already present
       */
      const reduce = (context) => {
        const recall = JSON.parse(context.values[0]);
        const vehicleId = recall.vehicleId;
    
        const existing = search.create({
          type: 'customrecord_ns_vino_recalls',
          filters: [
            ['name', 'is', recall.NHTSACampaignNumber],
            'AND',
            ['custrecord_ns_vino_recall_vehiclelink', 'is', vehicleId]
          ],
          columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
    
        if (existing.length === 0) {
          const rec = record.create({ type: 'customrecord_ns_vino_recalls', isDynamic: false });
    
          rec.setValue({ fieldId: 'name', value: recall.NHTSACampaignNumber });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_vehiclelink', value: vehicleId });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_mfg', value: recall.Manufacturer || '' });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_parkit', value: !!recall.parkIt });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_parkitoutside', value: !!recall.parkOutSide });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_otaupdate', value: !!recall.overTheAirUpdate });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_component', value: recall.Component || '' });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_summary', value: recall.Summary || '' });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_consequence', value: recall.Consequence || '' });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_remedy', value: recall.Remedy || '' });
          rec.setValue({ fieldId: 'custrecord_ns_vino_recall_notes', value: recall.Notes || '' });
    
          const recallDate = parseUSDate(recall.ReportReceivedDate);
          if (recallDate && !isNaN(recallDate.getTime())) {
            rec.setValue({ fieldId: 'custrecord_ns_vino_recall_date', value: recallDate });
          }
    
          rec.save();
        }
      };
    
      /**
       * Summarize: Audit outcomes
       */
      const summarize = (summary) => {
/*         summary.output.iterator().each((key, value) => {
          log.audit('Recall Created', `Key: ${key}`);
          return true;
        });
    
        const logErrors = (stage) => {
          summary[stage].errors.iterator().each((key, error) => {
            log.error(`${stage} error for key ${key}`, error);
            return true;
          });
        };
    
        logErrors('inputSummary');
        logErrors('mapSummary');
        logErrors('reduceSummary'); */
      };
    
      return { getInputData, map, reduce, summarize };
    });
    