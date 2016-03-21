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
  const directory = path.resolve(path.normalize(argv.dir));
  // Get arg - map directory.
  const map = argv.map;
  // Get arg - last modified date.
  const modified = argv.lastmod || '';

  if (argv.help || (!uri || !directory) || (modified && !map)) {
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
    const _request = request(uri, (error, response, body) => {
      if (error) {
        callback(error);
      }
      if (response.statusCode === 404) {
        callback(`${uri} not found - status code: ${response.statusCode}`);
      }
    });

    _request.end();

    _request.on('data', (data) => {
      XML += data;
    }).on('end', _ => {
      callback(null, XML); 
    }).on('error', (error) => {
      callback(error);
    });
  };

  /**
   * Get uris (<loc>) from XML.
   *
   * @param {String} XML
   * @param {Function} callback
   */
  const getUrisFromXML = (XML, callback) => {
    let isModified = false;
    const _stream = new stream.PassThrough();
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
    // Create sitemap htmls directory.
    mkdirp(directory, '0777', (error) => {
      if (error) {
        callback(error);
      }
      // Prepare unique filename.
      let filename = `sitemap-${key}.html`;
      // Create file.
      let stream = fs.createWriteStream(path.join(directory, filename));
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
        // Stream - close.
        stream.end();
        callback(error);
      }).end();
    });
  };

  const createSitemapMap = (directory, filename, modified, callback) => {
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
  }

  getSitemapXML((error, XML) => {
    if (error) {
      throw new Error(error);
    }
    let i = 0;
    getUrisFromXML(XML, (error, uri, modified) => {
      if (error) {
        throw new Error(error);
      }
      getSitemapContent(uri, i, (error, directory, filename) => {
        if (error) {
          throw new Error(error);
        }
        // createSitemapMap()
      });
      i++;
    });
  });
};