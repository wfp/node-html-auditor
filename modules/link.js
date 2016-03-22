/**
 * @file link-audit.js
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

module.exports = function(argv) {
  /*eslint-disable max-len*/
  // Prepare help text.
  const help = `html-audit link usage:
        html-audit link [options]
Options
        --help                                                                Display help text
        --path           [path / file] (required)                             Path to HTML files or an HTML file to audit
        --base-uri       [URI]         (required)                             The base URL of the site being audited
        --report         [path]                                               Path to output JSON audit report
        --report-verbose                                                      Verbose report
        --map            [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                             Scan last modified files
`;
  /*eslint-enable max-len*/

  if (argv.help) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  const _data = [];
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

  if ((!path || !uri) || (modified && !map)) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  let i = 1;
  // Get file(s).
  files(path, argv._, map, modified, (file, length) => {
    // Get content.
    fs.readFile(file, 'utf-8', (error, content) => {
      if (error) {
        throw new Error(error);
      }

      // Test file.
      check(file, (_data) => {
        if (i === length) {
          // Get _data length.
          const length = _data.length;
          if (length) {
            // Group by filename.
            const data = _.groupBy(_data, 'filename');
            for (const i in data) {
              for (const j in data[i]) {
                // Omit filename property.
                data[i][j] = _.omit(data[i][j], 'filename');
              }
            }

            // Create report.
            report({
              link: data
            }, _report, 'links-report.json');
          }
        }

        i++;
      }).scan(content, uri);
    });
  });

  /**
   * Check file.
   *
   * @param {String} file
   * @param {Function} callback
   *
   * @return {Object} BLC object.
   */
  const check = function(file, callback) {
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
          error = 'Link page not found';
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
          console.log(`Test passed - ${url.original}`.green);
        }

      },
      complete: () => {
        callback(_data);
      }
    });
  };
};
