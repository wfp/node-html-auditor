/**
 * @file a11y-audit.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Scan HTML files (using pa11y module).
 */

'use strict';

/**
 * Module dependencies.
 */
var path   = require('path');
var phantomjs = require('phantomjs-prebuilt');
var colors = require('colors');
var async  = require('async');
var pa11y  = require('pa11y');
var report = require('../helpers/report');
var files  = require('../helpers/files');

module.exports = function(argv) {
  if (!process.env.PATH) {
    throw new Error('Environment PATH not found.');
  }

  // Help text.
  var help = 'html-audit a11y usage:\n' +
    '\thtml-audit a11y [options]\n' +
    'Options\n' +
    '\t--help                                                          ' +
    'Display this error message\n' +
    '\t--path      [path / file] (required)                            ' +
    'Path to HTML files or an HTML file to audit\n' +
    '\t--standard  [standard]    (default: WCAG2AA)                    ' +
    'Accessibility standard as per ' +
    'https://github.com/nature/pa11y#standard-string\n' +
    '\t--report    [path]                                              ' +
    'Path to output JSON audit report\n' +
    '\t--ignore    [types]                                             ' +
    'Types to ignore separated by semi-colons (notice,warning)\n' +
    '\t--map       [file]        (required when --lastmod is provided) ' +
    'File containing filename:url object\n' +
    '\t--lastmod                                                       ' +
    'Scan last modified files';

  if (argv.help) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  var _data = {};
  // Get path to file.
  var _path = argv.path;
  // Get report directory.
  var _report = argv.report || '';
  // Get standard.
  var standard = argv.standard || 'WCAG2AA';
  // Get ignore.
  var ignore = argv.ignore || [];
  // Get JSON map path.
  var map = argv.map;
  // Get modified boolean.
  var modified = argv.lastmod || false;

  if (!_path || (modified && !map)) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  // Prepare pa11y options.
  var options = {
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

  var i = 1;
  // Instantiate pa11y.
  var _patty = pa11y(options);
  // Get file(s).
  files(_path, argv._, map, modified, function(file, length) {
    // Prepare _data object.
    _data[file] = _patty.run.bind(_patty, 'file://' + path.resolve(file));
    if (i === length) {
      // Test file(s).
      async.series(_data, function(error, data) {
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
