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
  data = JSON.stringify(data);
  if (report && typeof report === 'string') {
    // Create directory.
    process.umask(0);
    fs.mkdir(report, '0777', function(error) {
      // Remove slash.
      report = report.replace(/\/$/, '');
      // Stream - create file.
      var stream = fs.createWriteStream(join(report, file));
      // Stream - error event.
      stream.on('error', function(error) {
        throw new Error(format('%s'.red, error));
      });
      // Stream - write.
      stream.write(data);
      // Stream - finish event.
      stream.on('finish', function() {
        // Stream - end.
        stream.end();
      });
    });
  }
  else {
    // Log.
    console.log(data);
  }
};
