/**
 * @file fetch.js
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

module.exports = {
  /**
   * Execute fetch.
   *
   * @param {Object} argv
   * @param {Function} callback
   */
  execute(argv, callback) {
    // Get arg - sitemap uri.
    const uri = argv.uri;
    // Get arg - sitemap htmls directory.
    const dir = argv.dir;
    // Get arg - JSON map file.
    const map = argv.map;
    // Get arg - last modified date.
    const modified = argv.lastmod || '';

    if (argv.help || (!uri || !dir) || (modified && !map)) {
      // Log.
      console.log(this.help());
      process.exit(0);
    }

    // Make http request for sitemap uri.
    this.request(uri, (error, _404, XML) => {
      if (error) {
        callback(error);
      }

      if (_404) {
        callback(_404);
      }

      let i = 0;
      let j = 0;
      let done = 0;
      const _map = {
        uris: {},
        modified: []
      };

      // Get uris [<loc>] from XML.
      this.getUrisFromXML(XML, modified, (error, uri, modified) => {
        if (error) {
          callback(error);
        }

        j++;
        // Make http request for [<loc>] uri.
        this.request(uri, (error, _404, HTML) => {
          if (error) {
            callback(error);
          }

          if (_404) {
            // Log.
            console.log(_404);
          }
          else {
            i++;
            // Prepare sitemap-[ID].html file.
            const basename = `sitemap-${i}.html`;
            // Add sitemap-[ID].html file.
            this.addSitemap(HTML, basename, dir, (error, basename, file) => {
              if (error) {
                callback(error);
              }

              if (modified) {
                _map.modified.push(file);
              }

              _map.uris[basename] = uri;

              // Log.
              console.log(`${file.green} has been added`);

              done++;

              if (done === j) {
                // Add sitemap [MAP].json file | Log.
                this.addSitemapMap(_map, map, (error, mapJSON) => {
                  if (error) {
                    callback(error);
                  }

                  // Log.
                  console.log(`${mapJSON.cyan} has been created`);

                  callback();
                });
              }
            });
          }
        });
      });
    });
  },

  /**
   * Get help text.
   */
  help: () => {
    /*eslint-disable max-len*/
    const help = `html-audit fetch usage:
        html-audit fetch [options]
Options
        --help                                                    Display help text
        --uri      [URI]  (required)                              Path or URL to XML Sitemap file
        --dir      [path] (required)                              Directory to output HTML files
        --map      [file] (required  when --lastmod is provided)  File to output JSON that maps file names to URLs and modified files. If not set, sends to stdout
        --lastmod  [date]                                         Date for downloading last modified content`;
    /*eslint-enable max-len*/

    return help.yellow;
  },

  /**
   * Make http request.
   *
   * @param {String} uri
   * @param {Function} callback
   */
  request: (uri, callback) => {
    let content = '';
    request(uri).on('response', (response) => {
      if (response && response.statusCode === 404) {
        callback(null, `${uri} not found - code: ${response.statusCode}`.red);
      }
    }).on('data', (data) => {
      if (data.length) {
        content += data;
      }
    }).on('error', (error) => {
      callback(error);
    }).on('end', () => {
      callback(null, null, content);
    }).end();
  },

  /**
   * Get uris [<loc>] from XML.
   *
   * @param {String} XML
   * @param {Boolean} modified
   * @param {Function} callback
   */
  getUrisFromXML: (XML, modified, callback) => {
    const _stream = new stream.PassThrough();
    _stream.end(XML);
    const _XML =  new XMLStream(_stream);
    _XML.on('endElement: url', (item) => {
      let _modified = false;
      let _uri = '';
      if ('loc' in item) {
        // Get location (uri).
        const location = item.loc;
        if (modified && 'lastmod' in item) {
          // Get sitemap modified date time.
          const __modified = new Date(item.lastmod).getTime();
          // Get input modified date time.
          const ___modified = new Date(modified).getTime();
          const condition = __modified === ___modified ||
            __modified > ___modified;
          if (condition) {
            _uri = location;
            _modified = true;
          }
        }
        else if (modified && !('lastmod' in item)) {
          _uri = location;
          _modified = true;
        }
        else {
          _uri = location;
        }
      }
      else {
        _XML.pause();
        callback('<loc> element not found');
      }

      if (_uri) {
        callback(null, _uri, _modified);
      }
    });
  },

  /**
   * Add sitemap file.
   *
   * @param {Object} data
   * @param {String} basename
   * @param {String} directory
   * @param {Function} callback
   */
  addSitemap: (data, basename, directory, callback) => {
    directory = path.resolve(directory);
    // Create sitemap htmls directory.
    mkdirp(directory, '0777', (error) => {
      if (error) {
        callback(error);
      }

      const file = path.join(directory, basename);
      // Stream - create sitemap file.
      const stream = fs.createWriteStream(file);
      // Stream - error event.
      stream.on('error', (error) => {
        callback(error);
      });

      // Stream - write in file.
      stream.write(data);

      callback(null, basename, file);
    });
  },

  /**
   * Add sitemap map file | Log.
   *
   * @param {Object} data
   * @param {String} map
   * @param {Function} callback
   */
  addSitemapMap: (data, map, callback) => {
    if (map && typeof map === 'string') {
      // Normalize.
      map = path.resolve(map);
      // Get map directory.
      const dirname = path.dirname(map);
      // Create map directory.
      mkdirp(dirname, '0777', (error) => {
        if (error) {
          callback(error);
        }

        // Get map basename.
        const basename = path.basename(map).split('.');
        // Prepare [MAP].json file.
        map = path.join(dirname, `${basename[0]}.json`);
        // Stream - create map file.
        const stream = fs.createWriteStream(map);
        // Stream - error event.
        stream.on('error', (error) => {
          callback(error);
        });

        // Stream - write in file.
        stream.write(JSON.stringify(data));

        callback(null, map);
      });
    }
    else {
      // Log.
      console.log(data);
    }
  }
};

