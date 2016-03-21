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
const stream = require('stream');
const path = require('path');
const fs = require('fs');
const XMLStream = require('xml-stream');
const request = require('request');
const colors = require('colors');
const mkdirp = require('mkdirp');
const _ = require('underscore');

module.exports = (argv) => {
  // Prepare help text.
  const help = 'html-audit fetch usage:\n' +
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

  // Get arg - sitemap uri.
  const uri = argv.uri;
  // Get arg - sitemap htmls directory.
  const dir = argv.dir;
  // Get arg - map directory.
  const map = argv.map;
  // Get arg - last modified date.
  const modified = argv.lastmod || '';

  if (argv.help || (!uri || !dir) || (modified && !map)) {
    process.stdout.write(`${help.yellow}
  `);
    process.exit(0);
  }

  /**
   * Make http request for sitemap uri and get XML.
   *
   * @param {Function} callback
   */
  const getSitemapXML = (callback) => {
    let XML = '';
    request(uri, (error, response, body) => {
      if (error) {
        callback(error);
      }
      if (response.statusCode === 404) {
        callback(`${uri} not found - status code: ${response.statusCode}`);
      }
    }).on('data', (data) => {
      XML += data;
    }).on('end', _ => {
      callback(null, XML);
    }).on('error', (error) => {
      callback(error);
    }).end();
  };

  /**
   * Get uris (<loc>) from XML.
   *
   * @param {String} XML
   * @param {Function} callback
   */
  const getUrisFromXML = (XML, callback) => {
    const _stream = new stream.PassThrough();
    let isModified = false;
    // Store data.
    _stream.end(XML);
    new XMLStream(_stream).on('endElement: url', (item) => {
      let _uri = '';
      if (_.has(item, 'loc')) {
        // Get location (uri).
        const location = item.loc;
        if (modified && _.has(item, 'lastmod')) {
          // Get sitemap modified date time.
          const _modified = new Date(item.lastmod).getTime();
          // Get input modified date time.
          const __modified = new Date(modified).getTime();
          const condition = _modified === __modified ||
            _modified > __modified;
          if (condition) {
            isModified = true;
            // Set location.
            _uri = location;
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
        callback('<loc> element not found');
      }

      if (_uri) {
        callback(null, _uri, isModified);
      }

    });
  };

  /**
   * Get sitemap HTML content from uri & store in file.
   *
   * @param {String} uri
   * @param {Number} key
   * @param {Function} callback
   */
  const getSitemapContent = (uri, key, callback) => {
    const directory = path.resolve(path.normalize(dir));
    // Create sitemap htmls directory.
    mkdirp(dir, '0777', (error) => {
      if (error) {
        callback(error);
      }
      // Prepare unique filename.
      const filename = `sitemap-${key}.html`;
      // Create file.
      const stream = fs.createWriteStream(path.join(directory, filename));
      // Make HTTP request for each of the uri & get HTML content.
      request(uri).on('data', (data) => {
        // Write HTML content in file.
        stream.write(data);
      }).on('end', _ => {
        // Log filename.
        console.log(`${filename.green} has been added`);
        // Stream - end.
        stream.end();
        callback(null, directory, filename);
      }).on('error', (error) => {
        // Stream - end.
        stream.end();
        callback(error);
      }).end();
    });
  };

  getSitemapXML((error, XML) => {
    if (error) {
      throw new Error(error);
    }

    getUrisFromXML(XML, (error, uri, modified) => {
      if (error) {
        throw new Error(error);
      }

      let i = 0;
      let _map = {
        uris: {},
        modified: []
      };
      getSitemapContent(uri, i, (error, directory, filename) => {
        if (error) {
          throw new Error(error);
        }

        _map.uris[filename] = uri;
        if (map && typeof map === 'string') {
          // Get map directory.
          var dirname = path.dirname(path.normalize(map));
          // Create map directory.
          mkdirp(dirname, '0777', function(error) {
            if (error) {
              throw new Error(error);
            }

            // Get map basename.
            const basename = path.basename(map).split('.');
            // Create [MAP].json file.
            const mapJSON = path.join(dirname, basename[0] + '.json');
            fs.readFile(mapJSON, 'utf-8', function(error, data) {
              if (modified) {
                _map.modified.push(path.join(directory, filename));
                if (data) {
                  _map.uris = _.extend(_map.uris, JSON.parse(data).uris);
                }
              }

              // Create map file
              // - filename:url object.
              // - last modified file paths object.
              var stream = fs.createWriteStream(mapJSON);
              stream.write(JSON.stringify(_map));
              stream.end();
            });
          });
        }
      });
      i++;
    });
  });

};
