/**
 * @file report.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Create report JSON file.
 */

'use strict';

/**
 * Module dependencies.
 */
var join = require('path').join;
var fs = require('fs');
var format = require('util').format;
var colors = require('colors');

/**
 * @callback - Create report write stream.
 *
 * @param {Object} data
 * @param {String} report
 * @param {String} file
 */
module.exports = function(data, report, file) {
  // Cast filename.
  file = file.toString();
  // Check file extension (.json).
  if (!file || !/[a-zA-Z]+(([\-_])?[0-9]+)?\.json/.test(file)) {
    throw new Error(format('%s isn\'t json file.'.red, file));
  }
  // Cast report directory & remove slash.
  report = report.toString().replace(/\/$/, '');
  // Get report directory stats.
  fs.lstat(report, function(error, stats) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (stats.isDirectory()) {
      // Stream - create file.
      var stream = fs.createWriteStream(join('.', report, file));
      // Stream - error event.
      stream.on('error', function(error) {
        throw new Error(format('%s'.red, error));
      });
      // Stream - write.
      stream.write(JSON.stringify(data));
      // Stream - finish event.
      stream.on('finish', function() {
        // Log when finishes writing.
        console.log('Writing report in %s/%s'.green, report, file);
      }).end();
    }
  });
};
