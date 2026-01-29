/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description Retrieves vehicle and recall data from NHTSA and triggers Map/Reduce for attribute creation
 */

define([
  'N/record',
  'N/log',
  'N/runtime',
  'N/search',
  'N/task',
  './NHTSA_VPIC_Library'
], (record, log, runtime, search, task, vpic) => {

  const MAIN_RECORD_FIELDS = ['Make', 'Model', 'VehicleType', 'BodyClass'];

  /**
   * Convert MM/DD/YYYY to Date object
   * @param {string} dateStr
   * @returns {Date|null}
   */
  function parseUSDate(dateStr) {
      return dateStr ? new Date(dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')) : null;
  }

  /**
   * AfterSubmit logic to fetch and persist vehicle data and trigger attribute generation
   * @param {UserEventContext} context
   */
  const afterSubmit = (context) => {
      try {
          const recordId = context.newRecord.id;

          const vehicleRecord = record.load({
              type: 'customrecord_ns_vino_vehicle',
              id: recordId,
              isDynamic: false
          });

          const vin = vehicleRecord.getValue('custrecord_ns_vino_vin');
          const year = vehicleRecord.getValue('custrecord_ns_vino_year');
          const doVinLookup = vehicleRecord.getValue('custrecord_ns_vino_getdata');
          const doRecallLookup = vehicleRecord.getValue('custrecord_ns_vino_getrecalls');
          let recRequiresUpdate = false;

          // Skip if not flagged for data fetch
          if ((vin && year && doVinLookup)) {
            log.debug('VINO Script', 'VIN Lookup required.');
            log.audit('VINO Script', `Decoding VIN ${vin} for year ${year}`);
            const result = vpic.decodeVinValues(vin, year);
            const vehicleData = result?.Results?.[0];

            if (!vehicleData) {
                log.error('VINO Script', 'No vehicle data returned from VIN API.');
                return;
            }

            // === Update vehicle record with primary decoded fields ===
            vehicleRecord.setValue('name', `${vehicleData.Make}|${vehicleData.Model}|${vehicleData.ModelYear}|${vehicleData.VIN}`);
            vehicleRecord.setValue('custrecord_ns_vino_make', vehicleData.Make || '');
            vehicleRecord.setValue('custrecord_ns_vino_model', vehicleData.Model || '');
            vehicleRecord.setValue('custrecord_ns_vino_type', vehicleData.VehicleType || '');
            vehicleRecord.setValue('custrecord_ns_vino_body', vehicleData.BodyClass || '');
            vehicleRecord.setValue('custrecord_ns_vino_apiresponse', JSON.stringify(vehicleData));
            vehicleRecord.setValue('custrecord_ns_vino_datadate', new Date());
            vehicleRecord.setValue('custrecord_ns_vino_getdata', false);
            recRequiresUpdate = true;
            //vehicleRecord.save();

            log.audit('VINO Script', 'Vehicle record updated. Submitting MR for attribute creation.');

            // === Submit Map/Reduce task to process attribute records ===
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ns_mr_vino',
                //deploymentId: 'customdeploy_ns_mr_vino_01',
                params: {
                    custscript_ns_mr_vehicle_id: recordId
                }
            });
            const taskId = mrTask.submit();
            log.audit('VINO Script', `Attribute creation Map/Reduce submitted. Task ID: ${taskId}`);
          }  else {
                log.audit('VINO Script', 'VIN Lookup not required or VIN/Year not provided.');
          }
          // End of VIN Lookup
          // === Optional Recall Lookup ===
          if (doRecallLookup) {
                   // === Submit Map/Reduce task to process Recall records ===
                   const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_ns_mr_vino_recallcreator',
                    //deploymentId: 'customdeploy_ns_mr_vino_01',
                    params: {
                      custscript_ns_mr_vino_recallrecid: recordId
                    }
                });
                const recallTaskId = mrTask.submit();
                log.audit('VINO Script', `Recall creation Map/Reduce submitted. Task ID: ${recallTaskId}`);

              vehicleRecord.setValue('custrecord_ns_vino_getrecalls', false);
              vehicleRecord.setValue('custrecord_ns_vino_recalldate', new Date());
              recRequiresUpdate = true;
        } else {
          log.audit('VINO Script', 'Recall Lookup not required');
        }

        // === Save vehicle record with updated fields ===
        if (recRequiresUpdate) {
          vehicleRecord.save();
        }
      } catch (e) {
          log.error('VINO Script Error', e.toString());
      }
  };

  return { afterSubmit };
});
