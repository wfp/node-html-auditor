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
const path = require('path');
const fs = require('fs');
const colors = require('colors');

/**
 * Get HTML file(s) from directory or modifed files from map file.
 *
 * @param {String} file
 * @param {Object} files
 * @param {Object} files
 * @param {Object} files
 * @param {Function} callback
 */
module.exports = (file, files, map, modified, callback) => {
  /**
   * Get HTML modified file(s) from map file.
   *
   * @param {Function} callback
   */
  const getModifiedFiles = (callback) => {
    // Get modified files from map file.
    fs.readFile(map, 'utf-8', (error, data) => {
      if (error && error.code === 'ENOENT') {
        /*eslint-disable max-len*/
        error.message = `The file ${map} does not exist \n You must specify an existent map file`;
        /*eslint-enable max-len*/
        throw new Error(error);
      }

      if (error) {
        throw new Error(error);
      }

      callback(JSON.parse(data).modified);
    });
  };

  /**
   * Get HTML file(s) from directory.
   *
   * @param {Function} callback
   */
  const getFiles = (callback) => {
    // Get file(s) from directory.
    files.shift();
    files.push(file);
    for (const i in files) {
      // Get file.
      file = files[i];
      // Get file stats.
      fs.lstat(file, (error, stats) => {
        if (error) {
          throw new Error(error);
        }

        // Remove slash.
        file = path.resolve(file);
        // Case path is directory.
        // Get all files from directory.
        // Passing files array to the callback e.g - [path/to/file.html ..]
        if (stats.isDirectory()) {
          // Read directory & get all files from directory.
          fs.readdir(file, (error, _files) => {
            if (error) {
              throw new Error(error);
            }

            // Update files path.
            _files.forEach((_file, key, _files) => {
              _files[key] = path.join(file, _file);
            });

            callback(_files);
          });
        }
        else {
          callback(files);
        }
      });
      break;
    }
  };

  ((_callback) => {
    if (modified) {
      getModifiedFiles((files) => {
        _callback(files);
      });
    }
    else {
      getFiles((files) => {
        _callback(files);
      });
    }
  })((files) => {
    let i = files.length;
    while (i--) {
      const file = files[i];
      if (!/[a-zA-Z]+(([\-_])?[0-9]+)?\.html$/.test(file)) {
        // Remove non-.html file from files.
        files.splice(files.indexOf(file), 1);
        // Skip & log non-.html files.
        console.log(`Skip ${file} file`.yellow);
      }
    }

    files.forEach((file) => {
      callback(file, files.length);
    });
  });
};
