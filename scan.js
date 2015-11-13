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
var util = require('util');
var exec = require('child_process').exec;
var fs = require('fs');
var colors = require('colors');
var argv = require('yargs').argv;
var pa11y = require('pa11y');

try {
  // Check for --path argument validness
  if (argv.hasOwnProperty('path') && typeof argv.path !== 'boolean' && typeof argv.path === 'string') {
    // Get files array.
    var files = argv._;
    // Get path to file (This might be directory or single file).
    var path = argv.path;
    if (files.length) {
      // Merge path & files.
      files.push(path);
      files.forEach(function(file) {
        fs.lstat(file, function(error, stats) {
          if (error) {
            throw new Error(util.format('file %s couldn\'t be found.'.red, file));
          }
          // Scan HTML files.
           console.log("hey");
          _pa11y(path, stats);
        });
      });
    }
    else {
      fs.lstat(path, function(error, stats) {
        if (error) {
          throw new Error(util.format('path %s couldn\'t be found.'.red, path));
        }
        // In case of directory do the scan for each file.
        if (stats.isDirectory()) {
          // Prepare CLI command.
          var pa11y = "for file in files/a11y_audit/*.html; do pa11y --standard WCAG2A --ignore 'notice;warning' file:$file; done;"
          // Execute CLI command.
          exec(pa11y, puts);
        }
        else {
          // Scan HTML files.
          _pa11y(path, stats);
        }
      });
    }
  }
  else {
    throw new Error('path isn\'t valid.'.red);
  }
}
catch (e) {
  console.error(e.message);
}

/**
 * @callback _pa11y - Executing CLI command - pa11y.
 *
 * @param {String} file
 * @param {Object} stats
 */
var _pa11y = function(file, stats) {
  var _file = file.split('/');
  // Prepare regex for .html match.
  var regex = /[a-zA-Z]+(([\-_])?[0-9]+)?\.html/;
  // Check for file validness & extension (.html is allowed).
  if (stats.isFile() && regex.test(_file[_file.length - 1])) {
    var options = {
      standard: 'WCAG2A',
      ignore: [
        'notice',
        'warning'
      ]
    };
    pa11y(options, function (error, test, exit) {
        test(util.format('file:%s.html', file.replace(/\.[^/.]+$/, '')), function (error, results) {
          if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
          }
          else {
            console.log(results);
          }
        });
    });
  }
  else {
    throw new Error(util.format('%s isn\'t valid HTML file.'.red, file));
  }
}

/**
 * @callback puts - Outputs CLI result.
 *
 * @param {Object} error
 * @param {String} stdout
 * @param {String} stderr
 */
var puts = function(error, stdout, stderr) {
  if (error) {
     console.log(error.stack);
     console.log('Error code: '+error.code);
     console.log('Signal received: '+error.signal);
  }
  else {
    console.log(stdout);
  }
}
