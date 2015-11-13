#! /usr/bin/env node

'use strict';

/**
 * Module dependencies.
 */
var http = require('http');
var util = require('util');
var join = require('path').join;
var url = require('url');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var smta = require('sitemap-to-array');

// Get arguments.
var _arguments = process.argv.slice(2);

try {
  // Check for sitemap URI validness.
  var condition = _arguments[0] && url.parse(_arguments[0]).hostname && _arguments[0].indexOf('sitemap') > - 1;
  var uri = condition
    ? _arguments[0]
      : (function() {
          throw new Error(util.format('%s isn\'t valid URI', _arguments[0]));
        })();
  // Parse sitemap XML.
  smta(uri, function(error, sitemaps) {
    if (error) {
      console.error(error);
    }
    else {
      // Extract all the sitemap URL.
      // Do http call for each of the URL & get HTML content.
      // Create unique filename and append file with the HTML content.
      sitemaps.forEach(function(sitemap, key) {
        // Get sitemap URL.
        var _url = sitemap.loc;
        // HTTP call.
        http.get(_url, function(response) {
          // data event - Get HTML content.
          response.on('data', function(chunk) {
            // Get chunk buffer and convert it to the HTML string.
            var data = chunk.toString();
            if (data) {
              // Create unique filename.
              var filename = util.format('sitemap-%d.html', key);
              // Create file & write content.
              fs.appendFile(join('files', 'a11y_audit', filename), chunk.toString(), function (error) {
                if (error) {
                  console.error(error);
                }
              });
            }
          })
          // error event.
          .on('error', function(error) {
            console.error(error);
          });
        });
      });
    }
  });

}
catch(e) {
  console.error(e.message);
}

var puts = function(error, stdout, stderr) {
  if (error) {
    console.error(error);
  }
  sys.puts(stdout);
}

var pa11y = 'for file in files/a11y_audit/*.html; do pa11y --standard WCAG2A --ignore \'notice;warning\' file:$file; done';

exec(pa11y, puts);
