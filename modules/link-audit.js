/**
 * @file link-audit.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Scan HTML links (using broken-link-checker module).
 */

'use strict';

/**
 * Module dependencies.
 */
var url = require('url');
var fs = require('fs');
var colors = require('colors');
var _ = require('underscore');
var report = require('../helpers/report');
var files = require('../helpers/files');
var BLC = require('broken-link-checker');

module.exports = function(argv) {
  // Help text template.
  var help = 'link-audit usage:\n' +
    '\tlink-audit [options]\n' +
    'Options\n' +
    '\t--help                                                               ' +
    'Display this error message\n' +
    '\t--path           [path / file] (required)                            ' +
    'Path to HTML files or an HTML file to audit\n' +
    '\t--base-uri       [URI]         (required)                            ' +
    'The base URL of the site being audited\n' +
    '\t--report         [path]                                              ' +
    'Path to output JSON audit report\n' +
    '\t--report-verbose                                                     ' +
    'Verbose report\n' +
    '\t--map            [file]        (required when --lastmod is provided) ' +
    'File containing filename:url object\n' +
    '\t--lastmod                                                            ' +
    'Scan last modified files';

  if (argv.help) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  var _data = [];
  // Get path to file.
  var path = argv.path;
  // Get report directory.
  var _report = argv.report;
  // Get base uri.
  var uri = argv['base-uri'];
  // Get JSON map path.
  var map = argv.map;
  // Get modified boolean.
  var modified = argv.lastmod || false;
  if ((!path || !uri) || (modified && !map)) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  // Regex for uri.
  var regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  if (!regex.test(uri)) {
    var message = 'You entered incorrect base uri --base-uri=';
    throw new Error(message + uri);
  }

  // Get file(s).
  files(path, argv._, map, modified, function(file) {
    // Get content.
    fs.readFile(file, 'utf-8', function(error, content) {
      if (error) {
        throw new Error(error);
      }
      // Test file.
      check(file).scan(content, uri);
    });
  });

  /**
   * @callback check - Test file.
   *
   * @param {String} file
   * @return {Object} new BLC instance.
   */
  var check = function(file) {
    return new BLC.HtmlChecker({ filterLevel: 3 }, {
      link: function(result) {
        console.log('Scanning %s'.green, file);
        var verbose = argv['report-verbose'] || '';
        var condition = true;
        var error = '';
        // Get original url.
        var url = result.url;
        // Get base original url.
        var base = result.base.original;
        // Get links with 404 response.
        // Get links which has tag a & has base uri in href.
        // Get links which has internal & redirected property true.
        // Set proper error message.
        if (result.error) {
          error = result.error.toString();
        }
        else if (result.http.statusCode === 404) {
          error = 'Link page not found';
        }
        else if (result.html.tagName === 'a'
          && url.original.search(base) > -1) {
          error  = 'Absolute internal URL';
        }
        else if (result.internal && url.redirected) {
          error = 'Internal redirect';
        }
        else {
          condition = false;
        }
        if (condition) {
          var _result = {
            error: error,
            filename: file,
            html: result.html.tag,
            url: url
          };
          if (verbose) {
            // Append entire result.
            _result['verbose'] = result;
          }
          // Store result in _data variable.
          _data.push(_result);
          // Log.
          console.log('Errors found for %s'.red, url.original);
        }
        else {
          // Log.
          console.log('%s passed scan test successfuly'.green, url.original);
        }
      },
      complete: function() {
        // Get _data variable length.
        var length = _data.length;
        if (length) {
          // Group by filename.
          // Omit filename property.
          var data = _.groupBy(_data, 'filename');
          for (var i in data) {
            for (var j in data[i]) {
              data[i][j] = _.omit(data[i][j], 'filename');
            }
          }
          // Create report.
          report({
            link: data
          }, _report, 'links-report.json');
          // Log.
          console.log('%d errors found'.red, length);
        }
        else {
          // Log.
          console.log('Congrats! 0 errors found'.green);
        }
      }
    });
  };
};
