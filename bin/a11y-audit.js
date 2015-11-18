#! /usr/bin/env node

/**
 * @file a11y-audit.js
 * @author Lasha Badashvili
 *
 * Scan HTML files (using pa11y module).
 */

'use strict';

/**
 * Module dependencies.
 */
var format = require('util').format;
var colors = require('colors');
var pa11y = require('pa11y');
var argv = require('yargs').argv;
var report = require('../helpers/report');
var files = require('../helpers/files');

var _data = [];

try {
  // Get path to file.
  var path = argv.path;
  // Get report directory.
  var _report = argv.report;
  // Arguments condition.
  var condition = !_report || !path;
  if (condition) {
    throw new Error('arguments are missing a11y-audit --path [path/to/file(s)] --report [path/to/report]'.red);
  }
  // Get file(s).
  files(path, argv._, function(file) {
    // Test file.
    _pa11y(file, function(data) {
      // Create report.
      report(data, _report, 'a11y-report.json');
    });
  });
}
catch (e) {
  // Log exception message.
  console.error(e.message);
}

/**
 * @callback _pa11y - Executing pa11y.
 *
 * @param {String} file
 * @param {Function} callback
 */
var _pa11y = function(file, callback) {
  // Prepare pa11y options.
  var options = {
    standard: 'WCAG2A',
    ignore: [
      'notice',
      'warning'
    ]
  };
  // Test file.
  pa11y(options).run(format('file:%s', file), function(error, data) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (data.length) {
      // Push result in _data variable.
      data.forEach(function(object) {
        _data.push(object);
      });
      // callback - passing _data object.
      callback(_data);
    }
  });
};
