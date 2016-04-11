/**
 * @file link.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Scan links (using broken-link-checker module).
 */

'use strict';

/**
 * Module dependencies.
 */
const fs = require('fs');
const colors = require('colors');
const BLC = require('broken-link-checker');
const _ = require('underscore');
const report = require('../helpers/report');
const files = require('../helpers/files');

module.exports = {
  /**
   * Execute link.
   *
   * @param {Object} argv
   * @param {Function} callback
   */
  execute(argv, callback) {
    // Get arg - path to file.
    const path = argv.path;
    // Get arg - report directory.
    const _report = argv.report;
    // Get arg - base uri.
    const uri = argv['base-uri'];
    // Get arg - JSON map file.
    const map = argv.map;
    // Get arg - modified boolean.
    const modified = argv.lastmod || false;
    // Get arg - report verbose.
    const verbose = argv['report-verbose'] || '';

    if ((argv.help || !path || !uri) || (modified && !map)) {
      // Log.
      console.log(this.help());
      process.exit(0);
    }

    this.scan(path, argv._, map, modified, uri, verbose, (error, data) => {
      if (error) {
        return callback(error);
      }

      // Create report.
      report({
        link: data
      }, _report, 'links-report.json', (error) => {
        if (error) {
          callback(error);
        }

        callback();
      });
    });
  },

  /**
   * Get help text.
   */
  help: () => {
    /*eslint-disable max-len*/
    const help = `html-audit link usage:
        html-audit link [options]
Options
        --help                                                                Display help text
        --path           [path / file] (required)                             Path to HTML files or an HTML file to audit
        --base-uri       [URI]         (required)                             The base URL of the site being audited
        --report         [path]                                               Path to output JSON audit report
        --report-verbose                                                      Verbose report
        --map            [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                             Scan last modified files`;
    /*eslint-enable max-len*/

    return help.yellow;
  },

  /**
   * Scan files using BLC.
   *
   * @param {String} file
   * @param {Object} _files
   * @param {String} map
   * @param {Boolean} modified
   * @param {String} uri
   * @param {Boolean} verbose
   * @param {Function} callback
   */
  scan(file, _files, map, modified, uri, verbose, callback) {
    let data = [];
    let i = 1;
    // Get file(s).
    files(file, _files, map, modified, (error, file, length) => {
      if (error) {
        callback(error);
      }

      // Get content.
      fs.readFile(file, 'utf-8', (error, content) => {
        if (error) {
          callback(error);
        }

        // Test file.
        this.BLC(file, verbose, (_data) => {
          if (i === length) {
            if (_data.length) {
              // Group by filename.
              data = _.groupBy(_data, 'filename');
              for (const i in data) {
                for (const j in data[i]) {
                  // Omit filename property.
                  data[i][j] = _.omit(data[i][j], 'filename');
                }
              }
            }
            else {
              // Log.
              console.log(`${file} - 0 errors found`.green);
            }

            callback(null, data);
          }

          i++;
        }).scan(content, uri);
      });
    });
  },

  /**
   * BLC object.
   *
   * @param {String} file
   * @param {Boolean} verbose
   * @param {Function} callback
   *
   * @return {Object} BLC object.
   */
  BLC(file, verbose, callback) {
    const _data = [];
    return new BLC.HtmlChecker({ filterLevel: 3 }, {
      link: (result) => {
        let condition = true;
        let error = '';
        // Get original url.
        const url = result.url;
        // Get base original url.
        const base = result.base.original;
        // Get links with 404 response.
        // Get links which has tag a & has base uri in href.
        // Get links which has internal & redirected property true.
        // Set proper error message.
        if (result.error) {
          error = result.error.toString();
        }
        else if (result.http.statusCode === 404) {
          error = 'Link not found';
        }
        else if (result.html.tagName === 'a'
          && url.original.search(base) > -1) {
          error  = 'Absolute internal URL';
        }
        else if (result.internal && url.redirected) {
          error = 'Internal redirect';
        }
        else {
          condition = false;
        }

        if (condition) {
          const _result = {
            error,
            filename: file,
            html: result.html.tag,
            url
          };

          if (verbose) {
            // Append verbose result.
            _result['verbose'] = result;
          }

          // Store result in _data variable.
          _data.push(_result);
          // Log.
          console.log(`${error} - ${url.original}`.red);
        }
        else {
          // Log.
          console.log(`${url.original} - errors not found`.green);
        }

      },
      complete: () => {
        callback(_data);
      }
    });
  }
};
