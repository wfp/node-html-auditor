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
var path = require('path');
var fs = require('fs');
var format = require('util').format;
var colors = require('colors');
var mkdirp = require('mkdirp');

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
    report = path.normalize(report);
    // Create directory.
    process.umask(0);
    mkdirp(report, '0777', function(error) {
      if (error) {
        throw new Error(format('%s'.red, error));
      }
      // Remove slash.
      report = report.replace(/\/$/, '');
      // Stream - create file.
      var stream = fs.createWriteStream(path.join(report, file));
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
