/**
 * @file
 * HTML5 validator (using html5-lint module).
 */

'use strict';

/**
 * Module dependencies.
 */
const fs = require('fs');
const html5Lint = require('html5-lint');
const request = require('request');
const colors = require('colors');
const _ = require('underscore');
const report = require('../helpers/report');
const files = require('../helpers/files');

module.exports = {

  /**
   * Execute html5.
   *
   * @param {Object} argv
   * @param {Function} callback
   */
  execute(argv, callback) {
    // Get arg - path to file.
    const path = argv.path;
    // Get arg - report directory.
    const _report = argv.report || '';
    // Get arg - errors only.
    const errorsOnly = argv['errors-only'] || false;
    // Get arg - JSON map file.
    const map = argv.map || '';
    // Get arg - modified boolean.
    const modified = argv.lastmod || false;
    // Get arg - validator service.
    const service = argv.validator || '';

    if (argv.help || !path || (modified && !map)) {
      console.log(this.help());
      process.exit(0);
    }

    this.getService(service, (error, service) => {
      if (error) {
        callback(error);
      }

      this.scan({
        errorsOnly,
        service
      }, path, argv._, map, modified, (error, data) => {
        if (error) {
          callback(error);
        }

        // Create report.
        report({
          html5: data
        }, _report, 'html5-report.json', (error) => {
          if (error) {
            callback(error);
          }

          callback();
        });
      });
    });
  },

  /**
   * Get help text.
   */
  help: () => {
    /*eslint-disable max-len*/
    const help = `html-audit html5 usage:
        html-audit html5 [options]
Options
        --help                                                              Display help text
        --path         [path / file] (required)                             Path to HTML files or an HTML file to audit
        --report       [path]                                               Path to output JSON audit report
        --errors-only                                                       Only report errors (no notices or warnings)
        --map          [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                           Scan last modified files
        --validator                                                         Manually specify validator service (default: http://html5.validator.nu/)`;
    /*eslint-enable max-len*/

    return help.yellow;
  },

  /**
   * Scan files using html5Lint.
   *
   * @param {Object} options
   * @param {String} file
   * @param {Object} _files
   * @param {String} map
   * @param {Boolean} modified
   * @param {Function} callback
   */
  scan: (options, file, _files, map, modified, callback) => {
    const _data = [];
    let i = 1;

    // Get file(s).
    files(file, _files, map, modified, (error, file, length) => {
      if (error) {
        callback(error);
      }

      // Get file content.
      fs.readFile(file, 'utf-8', (error, content) => {
        if (error) {
          callback(error);
        }

        // Test file.
        html5Lint(content, options, (error, data) => {
          if (error) {
            callback(error);
          }

          // Errors.
          const errors = data.messages;
          // Errors count.
          const count = errors.length;

          if (count) {
            errors.forEach((object) => {
              // Add filename.
              object.filename = file;
              // Store result in _data variable.
              _data.push(object);
            });

            // Log.
            console.log(`${file} - ${count} errors found`.red);
          }
          else {
            // Log.
            console.log(`${file} - 0 errors found`.green);
          }

          if (i === length) {
            callback(null, _.groupBy(_data, 'filename'));
          }

          i++;
        });
      });
    });
  },

  /**
   * Get validator service.
   *
   * @param {String} service
   * @param {Function} callback
   */
  getService: (service, callback) => {
    let services = [
      'https://validator.w3.org/nu/',
      'https://checker.html5.org/',
      'https://html5.validator.nu/'
    ];

    if (service) {
      services = [
        service
      ];
    }

    let i = 0;
    const index = [];

    for (const j in services) {
      const service = services[j];

      request(service, (error, response) => {
        if (!error && response.statusCode === 200) {
          index.push(j);
        }

        if (i === services.length - 1) {
          const service = services[Math.min(...index)];

          if (service) {
            callback(null, service);
          }
          else {
            callback(error);
          }
        }

        i++;
      });
    }
  }

};
