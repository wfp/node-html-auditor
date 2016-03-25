/**
 * @file html5.js
 * @author Lasha Badashvili (lashab@picktek.com)
 *
 * HTML5 validator (using html5-lint module).
 */

'use strict';

/**
 * Module dependencies.
 */
const fs = require('fs');
const html5Lint = require('html5-lint');
const colors = require('colors');
const _ = require('underscore');
const report = require('../helpers/report');
const files = require('../helpers/files');

module.exports = (argv) => {
  /*eslint-disable max-len*/
  // Prepare help text.
  const help = `html-audit html5 usage:
        html-audit html5 [options]
Options
        --help                                                                Display help text
        --path           [path / file] (required)                             Path to HTML files or an HTML file to audit
        --report         [path]                                               Path to output JSON audit report
        --errors-only                                                         Only report errors (no notices or warnings)
        --map            [file]        (required when --lastmod is provided)  JSON map file which holds modified files data
        --lastmod                                                             Scan last modified files
`;
  /*eslint-enable max-len*/

  if (argv.help) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  const _data = [];
  // Get arg - path to file.
  const path = argv.path;
  // Get arg - report directory.
  const _report = argv.report || '';
  // Get arg - errors only.
  const errorsOnly = argv['errors-only'] || false;
  // Get arg -JSON map file.
  const map = argv.map || '';
  // Get arg - modified boolean.
  const modified = argv.lastmod || false;

  if (!path || (modified && !map)) {
    process.stdout.write(help.yellow);
    process.exit(0);
  }

  let i = 1;
  // Get file(s).
  files(path, argv._, map, modified, (file, length) => {
    // Get file content.
    fs.readFile(file, 'utf-8', (error, content) => {
      if (error) {
        throw new Error(error);
      }

      // Test file.
      html5Lint(content, { errorsOnly }, (error, data) => {
        if (error) {
          throw new Error(error);
        }

        if (data.messages.length) {
          // Log file scanning.
          console.log('Scanning %s'.green, file);
          data.messages.forEach((object) => {
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

