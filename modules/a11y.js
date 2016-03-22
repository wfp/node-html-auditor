/**
 * @file a11y-audit.js
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

module.exports = (argv) => {
  if (!process.env.PATH) {
    throw new Error('Environment PATH not found.');
  }

  /*eslint-disable max-len*/
  // Prepare help text.
  const help = `html-audit a11y usage:
        html-audit a11y [options]
Options
        --help                                                           Display help text
        --path      [path / file] (required)                             Path to HTML files or an HTML file to audit
        --standard  [standard]    (default: WCAG2AA)                     Accessibility standard as per https://github.com/nature/pa11y#standard-string'
        --report    [path]                                               Path to output JSON audit report
        --ignore    [types]                                              Types to ignore separated by semi-colons (notice,warning)
        --map       [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                        Scan last modified files
`;
  /*eslint-enable max-len*/

  if (argv.help) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  const _data = {};
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

  if (!_path || (modified && !map)) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  // Prepare pa11y options.
  const options = {
    standard: standard,
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
    // Get ignore object.
    ignore = ignore.split(';');
    // Add ignore option.
    options['ignore'] = ignore;
  }

  let i = 1;
  const _patty = pa11y(options);
  // Get file(s).
  files(_path, argv._, map, modified, (file, length) => {
    // Prepare _data object.
    _data[file] = _patty.run.bind(_patty, `file://${path.resolve(file)}`);
    if (i === length) {
      // Test file(s).
      async.series(_data, (error, data) => {
        if (error) {
          throw new Error(error);
        }
        // Create report.
        report({
          assessibility: data
        }, _report, 'a11y-report.json');
      });
    }
    i++;
  });
};
