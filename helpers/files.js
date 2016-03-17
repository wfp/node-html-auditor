/**
 * @file files.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Get HTML file(s) path to scan.
 */

'use strict';

/**
 * Module dependencies.
 */
var join = require('path').join;
var fs = require('fs');
var colors = require('colors');

/**
 * @callback - Get HTML file(s) from directory.
 *
 * @param {String} file
 * @param {Object} files
 * @param {Function} callback
 */
module.exports = function(file, files, map, modified, callback) {
  (function(_callback) {
    if (modified) {
      // Get modified files.
      fs.readFile(map, 'utf-8', function(error, data) {
        if (error && error.code === 'ENOENT') {
          var _error = '\nThe file ' + map + ' does not exist.\n';
          _error += 'You must specify an existent  map file.';
          throw new Error(_error);
        }
        if (error) {
          throw new Error(error);
        }
        _callback(JSON.parse(data).modified);
      });
    }
    else {
      files.shift();
      files.push(file);
      for (var i in files) {
        // Get file.
        file = files[i];
        // Get file stats.
        fs.lstat(file, function(error, stats) {
          if (error) {
            throw new Error(error);
          }
          // Remove slash.
          file = file.replace(/\/$/, '');
          // Case path is directory.
          // Get all files from directory.
          // Passing files array to the callback e.g - [path/to/file.html ..]
          if (stats.isDirectory()) {
            // Read directory & get all files from directory.
            fs.readdir(file, function(error, _files) {
              if (error) {
                throw new Error(error);
              }
              // Update files path.
              _files.forEach(function(_file, key, _files) {
                _files[key] = join(file, _file);
              });
              _callback(_files);
            });
          }
          else {
            _callback(files);
          }
        });
        break;
      }
    }
  })(function(files) {
    var i = files.length;
    while (i--) {
      var file = files[i];
      if (!/[a-zA-Z]+(([\-_])?[0-9]+)?\.html$/.test(file)) {
        // Remove non-.html file from files.
        files.splice(files.indexOf(file), 1);
        // Skip & log non-.html files.
        console.log('Skip %s file'.yellow, file);
      }
    }
    files.forEach(function(file) {
      callback(file, files.length);
    });
  });
};
