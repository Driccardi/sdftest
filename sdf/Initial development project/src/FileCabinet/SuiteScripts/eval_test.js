/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/log'], (https, log) => {

  const URL_TO_LOAD = 'https://tstdrv2140477.app.netsuite.com/core/media/media.nl?id=10442&c=TSTDRV2140477&h=1j05mETSCV6s75uJArDk_fkNVH0YgzNkH3iA5dxTCmt_JBiu&_xt=.js'; // Replace with your target JS

  const execute = (context) => {
    try {
      const response = https.get({ url: URL_TO_LOAD });
		eval(response.body);
    } catch (error) {
      log.error({
        title: 'Error Fetching URL',
        details: error
      });
    }
  };

  return { execute };

});