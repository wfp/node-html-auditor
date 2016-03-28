/**
 * @file a11y.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Accessibility testing - (using pa11y module).
 */

'use strict';

/**
 * Module dependencies.
 */
const path = require('path');
const phantomjs = require('phantomjs-prebuilt');
const colors = require('colors');
const async  = require('async');
const pa11y  = require('pa11y');
const report = require('../helpers/report');
const files  = require('../helpers/files');

module.exports = {
  /**
   * Execute a11y.
   *
   * @param {Object} argv
   * @param {Function} callback
   */
  execute(argv, callback) {
    if (!process.env.PATH) {
      callback('Environment PATH not found');
    }

    // Get arg - path to file.
    const _path = argv.path;
    // Get arg - report directory.
    const _report = argv.report || '';
    // Get arg - accessibility standard.
    const standard = argv.standard || 'WCAG2AA';
    // Get arg - ignore.
    const ignore = argv.ignore || [];
    // Get arg - JSON map file.
    const map = argv.map;
    // Get arg - modified boolean.
    const modified = argv.lastmod || false;

    if (argv.help || !_path || (modified && !map)) {
      console.log(this.help());
      process.exit(0);
    }

    // Prepare pa11y options.
    const options = {
      standard,
      log:      {
        debug: console.log.bind(console),
        error: console.error.bind(console),
        info:  console.info.bind(console)
      },
      phantom: {
        path: phantomjs.path
      }
    };

    if (ignore && typeof ignore === 'string') {
      // Add ignore option.
      options['ignore'] = ignore.split(',');
    }

    this.scan(options, _path, argv._, map, modified, (error, data) => {
      if (error) {
        callback(error);
      }

      // Create report.
      report({
        assessibility: data
      }, _report, 'a11y-report.json', (error) => {
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
    const help = `html-audit a11y usage:
        html-audit a11y [options]
Options
        --help                                                           Display help text
        --path      [path / file] (required)                             Path to HTML files or an HTML file to audit
        --standard  [standard]    (default: WCAG2AA)                     Accessibility standard as per https://github.com/nature/pa11y#standard-string'
        --report    [path]                                               Path to output JSON audit report
        --ignore    [types]                                              Types to ignore separated by semi-colons (notice,warning)
        --map       [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                        Scan last modified files`;
    /*eslint-enable max-len*/

    return help.yellow;
  },

  /**
   * Scan files using pa11y.
   *
   * @param {Object} options
   * @param {String} file
   * @param {Object} _files
   * @param {String} map
   * @param {Boolean} modified
   * @param {Function} callback
   */
  scan: (options, file, _files, map, modified, callback) => {
    const _data = {};
    const _patty = pa11y(options);
    let i = 1;
    // Get file(s).
    files(file, _files, map, modified, (error, file, length) => {
      if (error) {
        callback(error);
      }

      // Prepare _data object.
      _data[file] = _patty.run.bind(_patty, `file://${path.resolve(file)}`);
      if (i === length) {
        // Test file(s).
        async.series(_data, (error, data) => {
          if (error) {
            callback(error);
          }

          callback(null, data);
        });
      }
      
      i++;
    });
  }
};

