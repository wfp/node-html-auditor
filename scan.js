#! /usr/bin/env node

/**
 * @file scan.js
 * @author Lasha Badashvili
 *
 * Scans HTML files (Standard - WCAG2A).
 */

'use strict';

/**
 * Module dependencies.
 */
var format = require('util').format;
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var pa11y = require('pa11y');
var argv = require('yargs').argv;
var join = path.join;

var _data = [];

try {
  // Get path to file (This might be directory or single file).
  var _path = argv.path;
  // Get report directory.
  var report = argv.report;
  // Arguments condition.
  var condition = !report || !_path;
  if (condition) {
    // Throws error (--path or --report argument is missing).
    throw new Error('arguments are missing a11y-audit --path [path/to/file(s)] --report [path/to/report]'.red);
  }
  // Remove last slash for --report (e.g - path/to/file/ = pato/to/file).
  report = report.replace(/\/$/, '');
  // Regex for matching .html files.
  var regex = /[a-zA-Z]+(([\-_])?[0-9]+)?\.html/;
  // File where report will be written.
  var _file = 'report.json';
  // Check for report directory.
  fs.lstat(report, function(error, stats) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (stats.isDirectory()) {
      (function(callback) {
      // Get files object.
      var files = argv._;
      files.push(_path);
      files.forEach(function(file) {
        fs.lstat(file, function(error, stats) {
          if (error) {
            throw new Error(format('%s'.red, error));
          }
          // Remove last slash for --path (e.g - path/to/file/ = pato/to/file).
          file = file.replace(/\/$/, '');
          // Case path is directory.
          // Get all files from directory.
          // Passing files array to the callback e.g - [path/to/file.html, path/to/file-1.html].
          if (stats.isDirectory()) {
            // Read directory & get all files from directory.
            fs.readdir(file, function(error, _files) {
              if (error) {
                throw new Error(format('%s'.red, error));
              }
              // Update files value setting full path.
              _files.forEach(function(_file, key, _files) {
                _files[key] = join(file, _file);
              });
              // Calling callback - passing files.
              callback(_files);
            });
          }
          // Case path is file or files list.
          // Passing file or files list as array to the callback.
          else {
            // Calling callback - passing files. e.g - [path/to/file.html] [path/to/file-1.html]
            callback([file]);
          }
        });
      });
      })(function(files) {
        files.forEach(function(file) {
          // Check file (only .html files will pass check, others will be skipped.).
          if (regex.test(file)) {
            // Test file(s).
            _pa11y(file, function(data) {
              // Create write stream.
              var stream = fs.createWriteStream(join(__dirname, report, _file));
              // Stream - error event.
              stream.on('error', function(error) {
                throw new Error(format('%s'.red, error));
              });
              // Stream write.
              stream.write(JSON.stringify(data));
              // Stream - finish event.
              stream.on('finish', function() {
                // Log when finishes writing.
                console.log('writing report in %s/%s'.green, report, _file);
              }).end();
            });
          }
          else {
            // Skip & log non-.html files.
            console.error(format('%s isn\'t html file.'.red, file));
          }
        });
      });
    }
    else {
      // Throws error (--report directory not found).
      throw new Error(format('directory %s couldn\'t be found.'.red, report));
    }
  })
}
catch (e) {
  // Log exception message.
  console.error(e.message);
}

/**
 * @callback _pa11y - Executing pa11y.
 *
 * @param {String} file
 * @param {String} report
 * @param {Object} stats
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
      // Push all report object in _data object.
      data.forEach(function(object) {
        _data.push(object);
      });
      // Calling callback - passing data object.
      callback(_data);
    }
  });
}
