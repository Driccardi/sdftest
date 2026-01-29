/**
 * Run JavaScript MCP Tool
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * WARNING: This tool executes arbitrary JavaScript provided by the caller.
 * Use with care and appropriate roles/permissions.
 *
 * Design notes:
 * - Blocks (does not import) N/http, N/https, N/search per NetSuite MCP custom tool limitations.
 * - Exposes common, useful modules as variables for evaluated code:
 *   record, email, runtime, log, file, encode, crypto, format, task, url, cache
 * - Always returns a JSON-serializable object:
 *   { ok: boolean, result?: any, error?: string, message?: string, stack?: string, elapsedMs: number }
 */

define([
  'N/record',
  'N/email',
  'N/runtime',
  'N/log',
  'N/file',
  'N/encode',
  'N/crypto',
  'N/format',
  'N/task',
  'N/url',
  'N/cache'
], (
  record,
  email,
  runtime,
  log,
  file,
  encode,
  crypto,
  format,
  task,
  url,
  cache
) => {

  function toJSONSafe(value) {
    try {
      // JSON-ify complex objects to ensure the MCP connector can transport it
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      try {
        // Fallback to string representation
        return String(value);
      } catch (_e) {
        return '[Unserializable]';
      }
    }
  }

  return {
    /**
     * Evaluate JSON-encoded JavaScript with common SuiteScript modules in scope.
     *
     * Input:
     *   args.js: string - A JSON-encoded JavaScript program or expression.
     *                      Example: "return record.Type.SALES_ORDER;"
     * Scope variables available to the evaluated code:
     *   - record  (N/record): CRUD for standard/custom records
     *   - email   (N/email): Send emails, create messages
     *   - runtime (N/runtime): Script/Execution context, getCurrentUser, account, etc.
     *   - log     (N/log): Logging (debug, audit, error)
     *   - file    (N/file): Read/write files in the File Cabinet
     *   - encode  (N/encode): Encode/decode utilities
     *   - crypto  (N/crypto): Crypto utilities (hashing, HMAC); not HTTP
     *   - format  (N/format): Date/number formatting
     *   - task    (N/task): Schedule/MapReduce tasks
     *   - url     (N/url): Resolve script/deployment and task URLs
     *   - cache   (N/cache): Per-account/script caching
     *
     * Not available (blocked in custom tool scripts):
     *   - N/http, N/https, N/search
     *
     * Returns:
     *   Always an object: { ok, result?, error?, message?, stack?, elapsedMs }
     */
    runJavascript: (args = {}) => {
      const started = Date.now();

      // Accept common aliases just in case
      let code = args.js || args.javascript || args.code || '';
      if (typeof code !== 'string') {
        try {
          code = String(code);
        } catch (_e) {
          return {
            ok: false,
            error: 'InvalidInput',
            message: 'Input "js" must be a string containing JavaScript to evaluate.',
            elapsedMs: Date.now() - started
          };
        }
      }

      if (!code.trim()) {
        return {
          ok: false,
          error: 'NoCodeProvided',
          message: 'Provide JavaScript in args.js',
          elapsedMs: Date.now() - started
        };
      }

      try {
        // Construct a function with the allowed modules as parameters.
        // The caller's code executes inside an IIFE; they can `return ...` a value.
        /* eslint-disable no-new-func */
        const fn = new Function(
          'record', 'email', 'runtime', 'log', 'file', 'encode', 'crypto', 'format', 'task', 'url', 'cache',
          '"use strict";\\n' +
          'return (function(){\\n' +
          code + '\\n' +
          '})();'
        );

        const result = fn(
          record, email, runtime, log, file, encode, crypto, format, task, url, cache
        );

        return {
          ok: true,
          result: toJSONSafe(result),
          elapsedMs: Date.now() - started
        };
      } catch (err) {
        return {
          ok: false,
          error: (err && err.name) || 'EvalError',
          message: (err && err.message) || String(err),
          stack: err && err.stack,
          elapsedMs: Date.now() - started
        };
      }
    }
  };
});
