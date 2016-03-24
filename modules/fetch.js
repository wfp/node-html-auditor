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

module.exports = {
  /**
   * Execute fetch.
   */
  execute: function(argv) {
    // Get arg - sitemap uri.
    const uri = argv.uri;
    // Get arg - sitemap htmls directory.
    const dir = argv.dir;
    // Get arg - JSON map file.
    const map = argv.map;
    // Get arg - last modified date.
    const modified = argv.lastmod || '';

    if (argv.help || (!uri || !dir) || (modified && !map)) {
      process.stdout.write(this.help());
      process.exit(0);
    }

    // Make http request for sitemap uri.
    this.request(uri, (error, status, XML) => {
      status = response.statusCode || false;
      if (error) {
        throw new Error(error);
      }
      else if (status && status !== 200) {
        throw new Error(`${uri} not found - status code: ${status}`);
      }

      let i = 0;
      const _map = {
        uris: {},
        modified: []
      };

      // Get uris [<loc>] from XML. 
      this.getUrisFromXML(XML, modified, (error, uri, modified) => {
        if (error) {
          throw new Error(error);
        }

        // Make http request for [<loc>] uri.
        this.request(uri, (error, status, HTML) => {
          if (error) {
            // Log & skip.
            console.dir(error);
          }

          i++;
          // Add sitemap-[ID].html.
          this.addSitemap(HTML, `sitemap-${i}.html`, dir, (error, basename, file) => {
            if (error) {
              throw new Error(error);
            }

            _map.uris[basename] = uri;

            if (modified) {
              _map.modified.push(file);
            }

            console.log(`${file}.green has been added`);

            if (Object.keys(_map.uris).length === i) {
              // Add sitemap map | Log.
              this.addSitemapMap(_map, map, (error, mapJSON) => {
                if (error) {
                  throw new Error(error);
                }

                // Log.
                console.log(`${mapJSON}.green has been added
                `);

                // Log.
                console.log('Fetch has completed'.green);
              });
            }
          });
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
          --lastmod  [date]                                         Date for downloading last modified content
  `;
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
    request(uri, (error, response, body) => {
      callback(error, response.statusCode);
    }).on('data', (data) => {
      XML = data;
    }).on('end', () => {
      if (content) {
        callback(null, null, content);
      }
    }).on('error', (error) => {
      callback(error);
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
        const mapJSON = path.join(dirname, `${basename[0]}.json`);
        // Stream - create map file.
        const stream = fs.createWriteStream(mapJSON);
        // Stream - error event.
        stream.on('error', (error) => {
          callback(error);
        });

        // Stream - write in file.
        stream.write(JSON.stringify(_map));

        callack(null, mapJSON);
      });
    }
    else {
      // Log.
      console.dir(data);
    }
  }
};
