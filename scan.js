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
var extname = path.extname;
var join = path.join;

try {
  // Get path to file (This might be directory or single file).
  var _path = argv.path;
  // Get report directory.
  var report = argv.report;
  // arguments condition.
  var condition = !report || !_path;
  if (condition) {
    throw new Error('arguments are missing a11y-audit --path [path/to/file(s)] --report [path/to/report]'.red);
  }
  // Get files array.
  var files = argv._;
  if (files.length) {
    // Merge path & files.
    files.push(_path);
    files.forEach(function(file) {
      fs.lstat(file, function(error, stats) {
        if (error) {
          throw new Error(format('%s'.red, error));
        }
        // Test file(s).
        _pa11y(file, report, stats);
      });
    });
  }
  else {
    fs.lstat(_path, function(error, stats) {
      if (error) {
        throw new Error(format('%s'.red, error));
      }
      // In case of directory do the scan for each file.
      if (stats && stats.isDirectory()) {
        // Read directory and get all files.
        fs.readdir(_path, function(error, files) {
          if (error) {
            throw new Error(format('%s'.red, error));
          }
          files.forEach(function(file) {
            file = join(_path, file);
            // Get file stats.
            fs.lstat(file, function(error, stats) {
              if (error) {
                throw new Error(format('%s'.red, error));
              }
              // Test file(s).
              _pa11y(file, report, stats);
            })
          });
        });
      }
      else {
        // Test file.
        _pa11y(_path, report, stats);
      }
    });
  }
}
catch (e) {
  console.error(e.message);
}

/**
 * @callback _pa11y - Executing pa11y.
 *
 * @param {String} file
 * @param {String} report
 * @param {Object} stats
 */
var _pa11y = function(file, report, stats) {
  // Prepare regex for .html match.
  var regex = /[a-zA-Z]+(([\-_])?[0-9]+)?\.html/;
  var _file = file.match(regex);
  // Check for file validness & extension (.html is allowed).
  if (stats && stats.isFile() && _file) {
    _file = _file[0];
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
        fs.lstat(report, function(error, stats) {
          if (error) {
            throw new Error(format('%s'.red, error));
          }
          if (stats.isDirectory()) {
            // Get report directory.
            var _report = report.replace(/\/$/, '');
            // Replace .html file with .json.
            _file = _file.substr(0, _file.lastIndexOf('.')) + '.json';
            // Create write stream.
            var stream = fs.createWriteStream(join(__dirname, _report, _file));
            // Write stream.
            stream.write(JSON.stringify(data));
            // error event.
            stream.on('error', function(error) {
              throw new Error(format('%s'.red, error));
            });
            stream.on('finish', function() {
              console.log('report %s/%s has been added.'.green, _report, _file);
            }).end();
          }
          else {
            throw new Error(format('%s isn\'t directory.'.red))
          }
        });
      }
    });
  }
  else {
    console.error(format('%s isn\'t html file.'.red, file));
  }
}
