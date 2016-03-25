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
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const mkdirp = require('mkdirp');

/**
 * Create report.
 *
 * @param {Object} data
 * @param {String} report
 * @param {String} file
 */
module.exports = (data, report, file) => {
  // Prepare data.
  data = JSON.stringify(data);
  if (report) {
    // Prepare report directory.
    report = path.resolve(report);
    // Prepare report file.
    file = path.join(report, file);
    // Create directory.
    mkdirp(report, '0777', (error) => {
      if (error) {
        throw new Error(error);
      }
      // Stream - create file.
      const stream = fs.createWriteStream(file);
      // Stream - error event.
      stream.on('error', (error) => {
        throw new Error(error);
      });
      // Stream - write.
      stream.write(data);
      // Log.
      console.log(`${file} has been created`.green);
    });
  }
  else {
    // Log.
    console.log(data);
  }
};
