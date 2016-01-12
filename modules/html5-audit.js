/**
 * @file html5-audit.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * Scan HTML files (using html5-lint module).
 */

'use strict';

/**
 * Module dependencies.
 */
var fs = require('fs');
var html5Lint = require('html5-lint');
var colors = require('colors');
var _ = require('underscore');
var report = require('../helpers/report');
var files = require('../helpers/files');

module.exports = function(argv) {
  // Help text template.
  var help = 'html5-audit usage:\n' +
    '\thtml5-audit [options]\n' +
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
  var _report = argv.report || '';
  // Get errors only.
  var errorsOnly = argv['errors-only'] || false;
  // Get JSON map path.
  var map = argv.map || '';
  // Get modified boolean.
  var modified = argv.lastmod || false;
  if (!path || (modified && !map)) {
    process.stdout.write(help.yellow + '\n');
    process.exit(0);
  }

  var i = 1;
  // Get file(s).
  files(path, argv._, map, modified, function(file, length) {
    // Get content.
    fs.readFile(file, 'utf-8', function(error, content) {
      if (error) {
        throw new Error(error);
      }
      // Test file.
      html5Lint(content, {
        errorsOnly: errorsOnly
      }, function(error, data) {
        if (error) {
          throw new Error(error);
        }
        if (data.messages.length) {
          // Log file scanning.
          console.log('Scanning %s'.green, file);
          data.messages.forEach(function(object) {
            // Add filename.
            object.filename = file;
            // Store result in _data variable.
            _data.push(object);
          });
          if (i === length) {
            // Create report.
            report({
              html5: _.groupBy(_data, 'filename')
            }, _report, 'html5-report.json');
          }
          i++;
        }
      });
    });
  });
};
