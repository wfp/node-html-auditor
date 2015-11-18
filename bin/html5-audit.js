#! /usr/bin/env node

/**
 * @file html5-audit.js
 * @author Lasha Badashvili
 *
 * Scan HTML files (using html5-lint module).
 */

'use strict';

/**
 * Module dependencies.
 */
var format = require('util').format;
var fs = require('fs');
var html5Lint = require('html5-lint');
var colors = require('colors');
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
    _html5Lint(file, function(data) {
      // Create report.
      report(data, _report, 'html5-report.json');
    });
  });
}
catch (e) {
  // Log exception message.
  console.error(e.message);
};

/**
 * @callback _html5Lint - Executing html5Lint.
 *
 * @param {String} file
 * @param {Function} callback
 */
var _html5Lint = function(file, callback) {
  fs.readFile(file, 'utf-8', function(error, file) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    // html5Lint - Test file.
    html5Lint(file, function(error, data) {
      if (error) {
        throw new Error(format('%s'.red, error));
      }
      if (data.messages.length) {
        // Push result in _data variable.
        data.messages.forEach(function(object) {
          _data.push(object);
        });
        // callback - passing _data object.
        callback(_data);
      }
    });
  });
};
