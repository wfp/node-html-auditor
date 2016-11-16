'use strict';

describe('html-audit', function() {
  const uri = 'https://www.washingtonpost.com/web-national-sitemap.xml';

  context('fetch', function () {
    it(`should fetch files from ${uri} modified an hour ago`, function (done) {
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
    it(`should pass accessebility test`, function (done) {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'map': 'files/reports/map',
        'lastmod': true
       }, done);
    });
  });

  context('html5', function () {
    it(`should pass HTML5 validator test`, function (done) {
      require('../modules/html5').execute({ 
        _: [ 'html5' ],
        path: 'files/sitemaps/sitemap-1.html',
        report: 'files/reports/',
        'errors-only': true,
        'map': 'files/reports/map',
        'lastmod': true
       }, done);
    });
  });

  context('link', function () {
    it(`should pass broken link checker test`, function (done) {
      require('../modules/link').execute({ 
        _: [ 'link' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        'base-uri': 'https://www.washingtonpost.com',
        'report-verbose': true,
        'map': 'files/reports/map',
        'lastmod': true
       }, done);
    });
  });
});