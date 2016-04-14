'use strict';

describe('html-audit', function() {
  const uri = 'https://www.washingtonpost.com/web-national-sitemap.xml';

  context('fetch', () => {
    it(`should fetch ${uri}`, (done) => {
      const date = new Date();
      require('../modules/fetch').execute({ 
        _: [ 'fetch' ],
        uri: 'https://www.washingtonpost.com/web-national-sitemap.xml',
        dir: 'files/sitemaps/',
        map: 'files/reports/map.json'
       }, done);
    });
  });

  context('a11y', () => {
    it(`should pass accessebility test`, (done) => {
      require('../modules/a11y').execute({ 
        _: [ 'a11y' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
       }, done);
    });
  });

  context('link', () => {
    it(`should pass broken link checker test`, (done) => {
      require('../modules/link').execute({ 
        _: [ 'link' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        'base-uri': 'https://www.washingtonpost.com',
        'report-verbose': true
       }, done);
    });
  });
  
  context('html5', () => {
    it(`should pass HTML5 validator test`, (done) => {
      require('../modules/html5').execute({ 
        _: [ 'html5' ],
        path: 'files/sitemaps/',
        report: 'files/reports/',
        'errors-only': true
       }, done);
    });
  });
});