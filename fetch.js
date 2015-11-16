#! /usr/bin/env node

/**
 * @file fetch.js
 * @author Lasha Badashvili
 *
 * Fetches sitemap.xml URIs & downloading HTML content.
 */

'use strict';

/**
 * Module dependencies.
 */
var http = require('http');
var util = require('util');
var join = require('path').join;
var fs = require('fs');
var colors = require('colors');
var smta = require('sitemap-to-array');
var argv = require('yargs').argv;
var format = util.format;

try {
  // Get URI.
  var uri = argv.uri;
  // Get directory.
  var dir = argv.dir;
  // Check for directory validness.
  if (typeof dir !== 'string') {
    throw new Error(format('%s isn\'t valid directory, please provide correct --dir argument.'.red, dir));
  }
  // Get directory stats.
  fs.lstat(dir, function(error, stats) {
    if (error) {
      throw new Error(format('%s'.red, error));
    }
    if (stats && stats.isDirectory()) {
      // Regex for URI.
      var regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      // Check for sitemap URI validness.
      var condition = uri && regex.test(uri) && uri.indexOf('sitemap') > -1;
      uri = condition ? uri : (function() {
        throw new Error(format('%s isn\'t valid uri, please provide correct --uri argument.'.red, uri));
      })();
      // Parse sitemap XML.
      smta(uri, function(error, sitemaps) {
        if (error) {
          throw new Error(format('%s'.red, error));
        }
        // Extract all the sitemap URL.
        // Do http call for each of the URL & get HTML content.
        // Create unique filename and append file with the HTML content.
        sitemaps.forEach(function(sitemap, key) {
          // Create unique filename.
          var filename = format('sitemap-%d.html', key);
          // Get sitemap URL.
          var _url = sitemap.loc;
          // HTTP call.
          http.get(_url, function(response) {
            // data event - Get HTML content.
            response.on('data', function(chunk) {
              // Get chunk buffer and convert it to the HTML string.
              var data = chunk.toString();
              if (data) {
                // Create file & write content.
                fs.appendFile(join(__dirname, dir, filename), data, function (error) {
                  if (error) {
                    throw new Error(format('%s'.red, error));
                  }
                });
              }
            })
            // error event.
            .on('error', function(error) {
              throw new Error(format('%s'.red, error));
            })
            .on('end', function() {
              console.log('%s has been added.', filename.yellow);
            });
          });
        });
      });
    }
    else {
      throw new Error('directory %s couldn\'t be found.'.red);
    }
  });
}
catch(e) {
  console.error(e.message);
}
