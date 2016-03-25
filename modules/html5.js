/**
 * @file html5.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * HTML5 validator (using html5-lint module).
 */

'use strict';

/**
 * Module dependencies.
 */
const fs = require('fs');
const html5Lint = require('html5-lint');
const colors = require('colors');
const _ = require('underscore');
const report = require('../helpers/report');
const files = require('../helpers/files');

module.exports = {
  /**
   * Execute html5.
   */
  execute(argv) {
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

    if (argv.help || !path || (modified && !map)) {
      console.log(this.help());
      process.exit(0);
    }

    this.html5Lint(path, argv._, map, modified, errorsOnly, (error, data) => {
      if (error) {
        throw new Error(error);
      }

      // Create report.
      report({
        html5: data
      }, _report, 'html5-report.json');
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
        --lastmod                                                           Scan last modified files`;
    /*eslint-enable max-len*/

    return help.yellow;
  },

  /**
   * Run html5Lint.
   *
   * @param {String} file
   * @param {Object} _files
   * @param {String} map
   * @param {Boolean} modified
   * @param {Boolean} errorsOnly
   * @param {Function} callback
   */
  html5Lint: (file, _files, map, modified, errorsOnly, callback) => {
    const _data = [];
    let i = 1;
    // Get file(s).
    files(file, _files, map, modified, (file, length) => {
      // Get file content.
      fs.readFile(file, 'utf-8', (error, content) => {
        if (error) {
          callback(error);
        }

        // Test file.
        html5Lint(content, { errorsOnly }, (error, data) => {
          if (error) {
            callback(error);
          }

          if (data.messages.length) {
            data.messages.forEach((object) => {
              // Add filename.
              object.filename = file;
              // Store result in _data variable.
              _data.push(object);
            });

            // Log file scanning.
            console.log(`Test passed - ${file}`.green);

            if (i === length) {
              callback(null, _.groupBy(_data, 'filename'));
            }

            i++;
          }
        });
      });
    });
  }
};
