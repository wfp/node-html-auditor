/**
 * @file report.js
 * @author Lasha Badashvili
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
  report = report.replace(/\/$/, '');
  fs.lstat(report, function(error, stats) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (stats.isDirectory()) {
      // Create write stream.
      var stream = fs.createWriteStream(join('.', report, file));
      // Stream - error event.
      stream.on('error', function(error) {
        throw new Error(format('%s'.red, error));
      });
      // Stream write.
      stream.write(JSON.stringify(data));
      // Stream - finish event.
      stream.on('finish', function() {
        // Log when finishes writing.
        console.log('writing report in %s/%s'.green, report, file);
      }).end();
    }
  });
};
