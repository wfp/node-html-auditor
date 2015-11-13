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
var sys = require('sys');
var fs = require('fs');
var colors = require('colors');
var argv = require('yargs').argv;

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
            throw new Error(util.format('file %s couln\'t be found.'.red, file));
          }
          // Scan HTML files.
          _pa11y(path, stats);
        });
      });
    }
    else {
      fs.lstat(path, function(error, stats) {
        if (error) {
          throw new Error(util.format('path %s couln\'t be found.'.red, path));
        }
        if (stats.isDirectory()) {
          var pa11y = "for file in files/a11y_audit/*.html; do pa11y --standard WCAG2A --ignore 'notice;warning' file:$file; done;"
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
  // Prapare regex for .html match.
  var regex = /[a-zA-Z]+(([\-_])?[0-9]+)?\.html/;
  // Check for file validness & extension (.html is allowed).
  if (stats.isFile() && regex.test(_file[_file.length - 1])) {
    // Prapare CLI commad.
    var pa11y = util.format('pa11y --standard WCAG2A --ignore "notice;warning" file:%s.html', file.replace(/\.[^/.]+$/, ''))
    // Execute CLI command.
    exec(pa11y, puts);
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
  sys.puts(stdout);
}
