/**
 * @file files.js
 * @author Lasha Badashvili
 *
 * Get HTML file(s) from directory.
 */

'use strict';

/**
 * Module dependencies.
 */
var format = require('util').format;
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
module.exports = function(file, files, callback) {
  try {
    (function(_callback) {
      files.push(file);
      for (var i in files) {
        // Get file.
        file = files[i];
        // Get file stats.
        fs.lstat(file, function(error, stats) {
          if (error) {
            throw new Error(format('%s'.red, error));
          }
          // Remove slash.
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
    })(function(files) {
      var i = files.length;
      while(i--) {
        var file = files[i];
        if (!/[a-zA-Z]+(([\-_])?[0-9]+)?\.html$/.test(file)) {
          // Remove non-.html file from files.
          files.splice(files.indexOf(file), 1);
          // Skip & log non-.html files.
          console.error(format('Skip %s file.'.red, file));
        }
      }
      files.forEach(function(file) {
        callback(file, files.length);
      });
    });
  }
  catch (e) {
    // Log exception message.
    console.error(e.message);
  }
};
