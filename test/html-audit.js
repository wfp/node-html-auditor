'use strict';

describe('html-audit', function() {
  const uri = 'https://www.washingtonpost.com/web-national-sitemap.xml';

  context('fetch', function () {

    it(`should download content from ${uri}`, function (done) {
      require('../modules/fetch').execute({ 
        _: [ 'fetch' ],
        uri: 'https://www.washingtonpost.com/web-national-sitemap.xml',
        dir: 'files/sitemaps/',
        map: 'files/reports/map'
       }, done);
    });

    it(`should download content from ${uri} modified an hour ago`, function (done) {
      const date = new Date();
      date.setHours(date.getHours() - 1);
      require('../modules/fetch').execute({ 
        _: [ 'fetch' ],
        uri: 'https://www.washingtonpost.com/web-national-sitemap.xml',
        dir: 'files/sitemaps/',
        map: 'files/reports/map',
        lastmod: date
       }, done);
    });

  });

  context('a11y', function () {

    it(`should pass accessebility test on file`, function (done) {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/'
       }, done);
    });

    it(`should pass accessebility test on file and ignore notice and warnings`, function (done) {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        ignore: 'notice;warning'
       }, done);
    });

    it(`should pass accessebility test on file using WCAG2A standard`, function (done) {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        standard: 'WCAG2A'
       }, done);
    });

    it(`should pass accessebility test on files modified an hour ago`, function (done) {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        map: 'files/reports/map',
        lastmod: true
       }, done);
    });

  });

  context('html5', function () {

    it(`should pass HTML5 test on file and report only errors`, function (done) {
      require('../modules/html5').execute({ 
        _: [ 'html5' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'errors-only': true
       }, done);
    });

    it(`should pass HTML5 test on file and report warnings and errors`, function (done) {
      require('../modules/html5').execute({ 
        _: [ 'html5' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'errors-only': false
       }, done);
    });

    it(`should pass HTML5 test on files modified an hour ago`, function (done) {
      require('../modules/html5').execute({ 
        _: [ 'html5' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        'errors-only': true,
        map: 'files/reports/map',
        lastmod: true
       }, done);
    });

  });

  context('link', function () {

    it(`should pass broken link checker test on file`, function (done) {
      require('../modules/link').execute({ 
        _: [ 'link' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'base-uri': 'https://www.washingtonpost.com',
        'report-verbose': false,
       }, done);
    });

    it(`should pass broken link checker test on file and report verbose`, function (done) {
      require('../modules/link').execute({ 
        _: [ 'link' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'base-uri': 'https://www.washingtonpost.com',
        'report-verbose': true,
       }, done);
    });

    it(`should pass broken link checker test on files modified an hour ago`, function (done) {
      require('../modules/link').execute({ 
        _: [ 'link' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        'base-uri': 'https://www.washingtonpost.com',
        'report-verbose': true,
        map: 'files/reports/map',
        lastmod: true
       }, done);
    });

  });
});