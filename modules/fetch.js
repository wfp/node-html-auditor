/**
 * @file html-fetch.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Fetches sitemap URIs & downloads HTML content.
 */

'use strict';

/**
 * Module dependencies.
 */
var format = require('util').format;
var stream = require('stream');
var path = require('path');
var fs = require('fs');
var XMLStream = require('xml-stream');
var request = require('request');
var colors = require('colors');
var mkdirp = require('mkdirp');
var _ = require('underscore');

module.exports = function(argv) {
  // Help text.
  var help = 'html-audit fetch usage:\n' +
    '\thtml-audit fetch [options]\n' +
    'Options\n' +
    '\t--help                                                   ' +
    'Display this error message\n' +
    '\t--uri      [URI]  (required)                             ' +
    'Path or URL to XML Sitemap file\n' +
    '\t--dir      [path] (required)                             ' +
    'Directory to output HTML files\n' +
    '\t--map      [file] (required when --lastmod is provided)  ' +
    'File to output JSON that maps file names to URLs. If not set, sends to ' +
    'stdout\n' +
    '\t--lastmod  [date]                                        ' +
    'Date for downloading last modified content';

  // Get uri.
  var uri = argv.uri;
  // Get directory.
  var dir = argv.dir;
  // Get map directory.
  var map = argv.map;
  // Get last modified date.
  var modified = argv.lastmod || '';

  if (argv.help || (!uri || !dir) || (modified && !map)) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  process.umask(0);

  dir = path.normalize(dir);
  // Create directory.
  mkdirp(dir, '0777', function(error) {
    if (error) {
      throw new Error(error);
    }
    var data = '';
    // Do HTTP call for sitemap XML URI.
    request(uri, function(error, response, body) {
      if (error) {
        throw new Error(error.message);
      }
      if (response.statusCode !== 200) {
        throw new Error(uri + ' not found.');
      }
    }).on('data', function(string) {
      data += string;
    }).on('end', function() {
      var _stream = new stream.PassThrough();
      var isModified = false;
      var stdout = [];
      var _map = {
        uris: {},
        modified: []
      };
      var j = -1;
      var i = 0;
      // Store data.
      _stream.end(data);
      var XML = new XMLStream(_stream);
      XML.on('endElement: url', function(item) {
        var _uri = '';
        if (_.has(item, 'loc')) {
          // Get location (uri).
          var location = item.loc;
          if (modified && _.has(item, 'lastmod')) {
            // Get sitemap modified date time.
            var _modified = new Date(item.lastmod).getTime();
            // Get input modified date time.
            var __modified = new Date(modified).getTime();
            var condition = _modified === __modified ||
              _modified > __modified;
            if (condition) {
              isModified = true;
              // Set location.
              _uri = location;
            }
            else {
              console.log('%s is up-to-date', location.green);
            }
          }
          else if (modified && !_.has(item, 'lastmod')) {
            isModified = true;
            // Set location.
            _uri = location;
          }
          else {
            isModified = false;
            // Set location.
            _uri = location;
          }
        }
        else {
          XML.pause();
          throw new Error('<loc> element not found');
        }

        if (_uri) {
          // Download HTML content.
          download(_uri, i, function(directory, filename) {
            // Create filename:url key value object.
            _map.uris[filename] = _uri;
            if (map && _.isString(map)) {
              // Get map directory path.
              var dirname = path.dirname(path.normalize(map));
              // Create directory.
              mkdirp(dirname, '0777', function(error) {
                if (error) {
                  throw new Error(error);
                }
                // Get map basename.
                var basename = path.basename(map).split('.');
                // Create [MAP].json file.
                var mapJSON = path.join(dirname, basename[0] + '.json');
                fs.readFile(mapJSON, 'utf-8', function(error, data) {
                  if (isModified) {
                    _map.modified.push(path.join(directory, filename));
                    if (data) {
                      _map.uris = _.extend(_map.uris, JSON.parse(data).uris);
                    }
                  }
                  // Write - filename:url object.
                  // Write - last modified file paths object.
                  var stream = fs.createWriteStream(mapJSON);
                  stream.write(JSON.stringify(_map));
                  stream.end();
                });
              });
              j--;
            }
            else {
              // Log _map data object.
              stdout.push(_map);
              j--;
              if (j == 0) {
                for (var i = 0, length = stdout.length; i < length; i++) {
                  console.log(JSON.stringify(stdout[i], null, ' '));
                }
              }
            }
          });
        }
        i++;
        j = Math.max(j, i);
      });
    }).on('error', function(error) {
      throw new Error(error);
    }).end();
  });

  /**
   * @callback download - Get HTML content & store in file.
   *
   * @param {String} url
   * @param {Number} key
   * @param {Number} date
   * @param {Function} callback
   */
  function download(url, key, callback) {
    // Create unique filename.
    var filename = format('sitemap-%d.html', key);
    // Get directory.
    var directory = dir.replace(/\/$/, '');
    // Create write stream.
    var stream = fs.createWriteStream(path.join(directory, filename));
    // Do HTTP call for each of the URL & get HTML content.
    // Write HTML content in file.
    request(url).on('data', function(data) {
      // Write stream.
      stream.write(data);
    }).on('end', function() {
      // Log filename.
      console.log('%s has been added', filename.green);
      // Stream - end.
      stream.end();
      // Passing _map object to the callback.
      callback(directory, filename);
    }).on('error', function(error) {
      // Stream - close.
      stream.end();
      throw new Error(error);
    }).end();
  };
};
