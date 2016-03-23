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

module.exports = (argv) => {
  /*eslint-disable max-len*/
  // Prepare help text.
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

  // Get arg - sitemap uri.
  const uri = argv.uri;
  // Get arg - sitemap htmls directory.
  let dir = argv.dir;
  // Get arg - JSON map file.
  const map = argv.map;
  // Get arg - last modified date.
  const modified = argv.lastmod || '';

  if (argv.help || (!uri || !dir) || (modified && !map)) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  dir = path.resolve(dir);

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

      if (response.statusCode !== 200) {
        callback(`${uri} not found - status code: ${response.statusCode}`);
      }
    }).on('data', (data) => {
      XML += data;
    }).on('end', () => {
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
    _stream.end(XML);
    const _XML =  new XMLStream(_stream);
    let _modified = false;
    _XML.on('endElement: url', (item) => {
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
            _modified = true;
            _uri = location;
          }
        }
        else if (modified && !('lastmod' in item)) {
          _modified = true;
          _uri = location;
        }
        else {
          _modified = false;
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
  };

  /**
   * Get sitemap HTML content from uri & store in file.
   *
   * @param {String} uri
   * @param {Number} key
   * @param {Function} callback
   */
  const getSitemapContent = (uri, key, callback) => {
    // Create sitemap htmls directory.
    mkdirp(dir, '0777', (error) => {
      if (error) {
        callback(error);
      }

      // Prepare unique filename.
      const filename = `sitemap-${key}.html`;
      // Create file.
      const stream = fs.createWriteStream(path.join(dir, filename));
      // Make HTTP request for each of the uri & get HTML content.
      request(uri).on('data', (data) => {
        // Write HTML content in file.
        stream.write(data);
      }).on('end', () => {
        // Log.
        console.log(`${filename.green} has been added`);
        callback(null, filename);
      }).on('error', (error) => {
        callback(error);
      }).end();
    });
  };

  getSitemapXML((error, XML) => {
    if (error) {
      throw new Error(error);
    }

    let i = 0;
    const _map = {
      uris: {},
      modified: []
    };
    getUrisFromXML(XML, (error, uri, modified) => {
      if (error) {
        throw new Error(error);
      }

      getSitemapContent(uri, i, (error, filename) => {
        if (error) {
          throw new Error(error);
        }

        _map.uris[filename] = uri;

        if (modified) {
          _map.modified.push(path.join(dir, filename));
        }

        if (Object.keys(_map.uris).length === i) {
          if (map && typeof map === 'string') {
            // Get map directory.
            const dirname = path.dirname(path.normalize(map));
            // Create map directory.
            mkdirp(dirname, '0777', (error) => {
              if (error) {
                throw new Error(error);
              }

              // Get map basename.
              const basename = path.basename(map).split('.');
              // Prepare [MAP].json file.
              const mapJSON = path.join(dirname, `${basename[0]}.json`);
              // Create map file.
              // - filename:url object.
              // - last modified file paths object.
              const stream = fs.createWriteStream(mapJSON);
              stream.write(JSON.stringify(_map));
            });
          }
          else {
            // Log.
            console.dir(_map);
          }

          // Log.
          console.log('Download has completed'.green);
        }
      });
      i++;
    });
  });
};

