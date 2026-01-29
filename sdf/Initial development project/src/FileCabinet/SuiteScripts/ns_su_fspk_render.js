/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @Filename ns_su_fspk_render.js
 */
define(['N/ui/serverWidget', 'N/query', 'N/record', 'N/task', 'N/log','N/file'],
    (ui, query, record, task, log,file) => {
      const LOG_RECORD = 'customrecord_ns_fspk_log';
  
      const onRequest = (context) => {
        const { request, response } = context;
        const isPost = request.method === 'POST';
  
        if (isPost) {
          try {
            const payload = JSON.parse(request.body);
            const logId = record.create({ type: LOG_RECORD, isDynamic: true });
            logId.setValue({ fieldId: 'custrecord_ns_fspk_log_setup', value: payload.setupId });
            logId.setValue({ fieldId: 'custrecord_ns_fspk_log_data', value: JSON.stringify(payload.data) });
            const id = logId.save();
  
            task.create({
              taskType: task.TaskType.MAP_REDUCE,
              scriptId: 'customscript_ns_mr_fspk_process'
            }).submit();
  
            response.write(JSON.stringify({ status: 'ok', logId }));
  
          } catch (e) {
            log.error('Form Submission Error', e);
            response.write(JSON.stringify({ status: 'error', message: e.message }));
          }
          return;
        }
  
        const setupId = request.parameters.setup;
        if (!setupId) {
          response.write('Missing setup parameter');
          return;
        }
  
        const setupData = query.runSuiteQL({
          query: `
            SELECT *
            FROM customrecord_ns_fspk_setup
            WHERE id = ?
          `,
          params: [setupId]
        }).asMappedResults()[0];

        const setupRecord = record.load({
          type: 'customrecord_ns_fspk_setup',
            id: setupId,
        });
  
        const sectionData = query.runSuiteQL({
          query: `
            SELECT *
            FROM customrecord_ns_fspk_sections
            WHERE custrecord_ns_fspk_section_setuplink = ?
            ORDER BY custrecord_ns_fspk_section_sequence ASC
          `,
          params: [setupId]
        }).asMappedResults();
  
        const fieldData = query.runSuiteQL({
          query: `
            SELECT *,BUILTIN.DF(custrecord_ns_fspk_field_type) AS field_type
            FROM customrecord_ns_fspk_fields
            WHERE custrecord_ns_fspk_field_setup = ?
            ORDER BY custrecord_ns_fspk_field_sequence ASC
          `,
          params: [setupId]
        }).asMappedResults();
  
        const html = renderHtml(setupId, setupData, sectionData, fieldData,setupRecord);
        response.write(html);
      };
  
      function renderHtml(setupId, setup, sections, fields,setupRecord) {
        const sectionMap = {};
        sections.forEach(s => sectionMap[s.id] = { ...s, fields: [] });
        fields.forEach(f => {
          if (sectionMap[f.custrecord_ns_fspk_field_seclink])
            sectionMap[f.custrecord_ns_fspk_field_seclink].fields.push(f);
        });
        const cssLink = getCssLinkTag(setupRecord);
        const logo = getLogoImageTag(setupRecord);
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${setup.custrecord_ns_fspk_htmltitle || 'Form'}</title>
            ${cssLink}
            <style>
              .ns-fspk-error {
                border: 2px solid var(--nsn-uif-redwood-color-light-danger-100);
                background-color: var(--nsn-uif-redwood-color-light-danger-10);
                transition: border 0.3s ease-in-out;
              }
            </style>
            <script src="https://www.google.com/recaptcha/api.js" async defer></script>
          </head>
          <body>
            <div class="form-wrapper">
            ${logo}  
            <!--<div class='title'>${setup.name}</div>-->

              <header>${setup.custrecord_ns_fspk_header || ''}</header>

              <form id="fspk-form" method="POST">
                <input type="hidden" name="setupId" value="${setupId}" />
        `;
  
        Object.values(sectionMap).forEach(section => {
          html += `<section>`;
          if (section.custrecord_ns_fspk_section_usename === 'T') {
            html += `<h2>${section.name}</h2>`;
          }
  
          section.fields.forEach(field => {
            html += `
              <div class="form-field">
                ${renderField(field)}
              </div>`;
          });
  
          html += `</section>`;
        });

        html += `<div class="form-buttons">` + renderButtons(setup) + `</div>`;
        
        html += `
                <footer>${setup.custrecord_ns_fspk_footer || ''}</footer>
              </form>
            </div>
            <script>
              document.getElementById('fspk-form').addEventListener('submit', async function(e) {
                e.preventDefault();
                const form = e.target;
                const data = {};
                Array.from(form.elements).forEach(el => {
                  if (el.name && el.type !== 'submit') {
                    data[el.name] = el.value;
                  }
                });
                const res = await fetch(window.location.href, {
                  method: 'POST',
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ setupId: "${setupId}", data })
                });
                const result = await res.json();
                alert(result.status === 'ok' ? 'Form Submitted' : result.message);
              });
            </script>
          </body>
          </html>
        `;
        return html;
      }
  
      function renderField(field) {
        const name = `f_`+ labelToIdName(field.name);
        const id = `fid_`+ labelToIdName(field.name);
        const type = field.field_type;
        const required = field.custrecord_ns_fspk_field_mandatory === 'T' ? 'required' : '';
        const validation = field.custrecord_ns_fspk_field_validation ? `data-validation="${field.custrecord_ns_fspk_field_validation}"` : '';
        const placeholder = `placeholder="${field.custrecord_ns_fspk_field_placeholder}"` || '';
        let output = '';
        if(field.custrecord_ns_fspk_showlabel === 'T') {
          output += `<label for="${name}">${field.name}</label>`;
        }
        switch (type) {
            case 'Free Form Text': // 1
              output += `<input type="text" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
            break;
            case 'Float': // 2
            output +=  `<input type="text" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
            break;
            case 'Currency': // 3
            output +=  `<input type="text" name="${name}" id="${id}" ${required} ${validation} ${placeholder}/>`;
            break;
            case 'Integer': // 4
            output +=  `<input type="number" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
             break;
            case 'Long Text': // 5
            output +=  `<textarea name="${name}" id="${id}" ${required} ${validation} ${placeholder}></textarea>`;
          break;
            case 'Radio': // 6
            output +=  `<input type="radio" name="${name}" id="${id}" ${validation} />`;
          break;
            case 'Checkbox': // 7
            output +=  `<input type="checkbox" name="${name}" id="${id}" ${validation} />`;
            break;
            case 'File': // 8
            output +=  `<input type="file" name="${name}" id="${id}" ${required} ${validation} />`;
            break;
            case 'Hidden': // 9
            output +=  `<input type="hidden" name="${name}" id="${id}" />`;
            break;
            case 'Phone': // 10
            output +=  `<input type="tel" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
            break;
            case 'Email':
                output +=  `<input type="email" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
            break;
            default:
                output +=  `<input type="text" name="${name}" id="${id}" ${required} ${validation} ${placeholder} />`;
          }
        return output;
        }

      function renderButtons(setup){
        let buttons = '';
        if (setup.custrecord_ns_fspk_setup_submitlbl) {
          buttons += `<button type="submit" class="btn-submit">${setup.custrecord_ns_fspk_setup_submitlbl}</button>`;
        }
        if (setup.custrecord_ns_fspk_field_cxlbuttonlbl) {
          buttons += `<button type="button" class="btn-cancel">${setup.custrecord_ns_fspk_field_cxlbuttonlbl}</button>`;
        }
        if (setup.custrecord_ns_fspk_field_clrbuttonlbl) {
          buttons += `<button type="reset" class="btn-reset">${setup.custrecord_ns_fspk_field_clrbuttonlbl}</button>`;
        }
        return buttons;
      }
            /**
         * Converts a user-friendly label into a valid HTML id/name value
         * @param {string} label - The field label (e.g. "First Name")
         * @returns {string} - A sanitized, lowercase, hyphenated string (e.g. "first-name")
         */
        function labelToIdName(label) {
            return label
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')      // replace spaces and punctuation with hyphens
            .replace(/^-+|-+$/g, '');         // trim hyphens from start/end
        }
        /**
         * Generates a stylesheet <link> tag from a file ID in the setup record.
         * @param {Object} setup - The setup record object with `custrecord_ns_fspk_css` as a file ID.
         * @returns {string} HTML <link> tag or empty string
         */
        function getCssLinkTag(setupRecord) {
            log.debug('Setup', setupRecord);
            const fileId = setupRecord.getValue('custrecord_ns_fspk_css');
            if (!fileId) return '';
        
            try {
            const cssFile = file.load({ id: fileId });
            log.debug('CSS File', `File ID: ${fileId}, URL: ${cssFile.url}`);
            log.debug('CSS File', `File ID: ${fileId}, isOnline: ${cssFile.isOnline}`);
            if(!cssFile.isOnline){return '';}
            const url = cssFile.url
            return `<link rel="stylesheet" type="text/css" href="${url}" />`;
            } catch (e) {
            log.error('CSS Load Error', `Failed to load stylesheet file ID ${fileId}: ${e.message}`);
            return '';
            }
        }
        /**
         * Generates an <img> tag for a given NetSuite file ID (logo).
         * @param {number|string} fileId - The internal ID of the file
         * @returns {string} - HTML <img> tag with class="logo" or empty string
         */
        function getLogoImageTag(setupRecord) {
            const fileId = setupRecord.getValue('custrecord_ns_fspk_logo');
            if (!fileId) return '';
        
            try {
            const logoFile = file.load({ id: fileId });
            log.debug('Logo File', `File ID: ${fileId}, URL: ${logoFile.url}`);
            if (!logoFile.isOnline) return '';
        
            const url = logoFile.url;
            return `<img src="${url}" class="logo" alt="Form Logo" />`;
            } catch (e) {
            log.error('Logo Load Error', `Failed to load logo file ID ${fileId}: ${e.message}`);
            return '';
            }
        }
      return { onRequest };
    });
  