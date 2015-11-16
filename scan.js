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
var path = require('path');
var fs = require('fs');
var colors = require('colors');
var argv = require('yargs').argv;
var pa11y = require('pa11y');
var format = util.format;
var join = path.join;

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
            throw new Error(format('%s couldn\'t be found.'.red, file));
          }
          // Scan HTML files.
          _pa11y(path, stats);
        });
      });
    }
    else {
      fs.lstat(path, function(error, stats) {
        if (error) {
          console.error(format('%s couldn\'t be found.'.red, path));
        }
        // In case of directory do the scan for each file.
        if (stats && stats.isDirectory()) {
          // Read directory and get all files.
          fs.readdir(path, function(error, files) {
            if (error) {
              throw new Error(format('Error happened while reading %s directory'.red, path));
            }
            files.forEach(function(file) {
              file = join(path, file);
              // Get file stats.
              fs.lstat(file, function(error, stats) {
                // Test file(s).
                _pa11y(file, stats);
              })
            });
          });
        }
        else {
          // Test file.
          _pa11y(path, stats);
        }
      });
    }
  }
  else {
    throw new Error('Path isn\'t valid.'.red);
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
  if (stats && stats.isFile() && regex.test(_file[_file.length - 1])) {
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
        throw new Error(format('Error happened while testing %s file'.red, file));
      }
      // Output.
      console.dir(data);
    });
  }
  else {
    console.error(format('%s isn\'t valid HTML file.'.red, file));
  }
}
