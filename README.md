# HTML auditor

Branch  | Build Status
--------|-------------
master  | [![Build Status](https://travis-ci.org/wfp/ui.svg?branch=master)](https://travis-ci.org/wfp/ui)
develop | [![Build Status](https://travis-ci.org/wfp/ui.svg?branch=develop)](https://travis-ci.org/wfp/ui)

A NodeJS CLI tool to fetch and audit HTML pages for [web accessibility](https://en.wikipedia.org/wiki/Web_accessibility) (WCAG2), HTML5 and link validation.

# Installation

```
npm install -g html-auditor
```

# Retreive HTML

## HTML Fetch

`html-audit fetch`: fetch HTML pages from an [XML sitemap](https://en.wikipedia.org/wiki/Sitemaps) or individual HTML page.

### Options

- `--help` _(optional)_ - Display help text
- `--uri` _(required)_ - path or URL to XML Sitemap file
- `--dir` _(required)_ - directory to output HTML files
- `--map` _(required when --lastmod is provided)_ - file to output JSON that maps file names to URLs and modified files. If not set, sends to stdout
- `--lastmod` _(optional)_ - Date for downloading last modified content

### Example

```
html-audit fetch --uri https://www.washingtonpost.com/web-national-sitemap.xml --dir ./html-pages
```

# Audit HTML

## 1. Accessibility audit (WCAG)

`html-audit a11y`: audit HTML pages for accessibility issues.

### Options

- `--help` _(optional)_ - Display help text.
- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--standard [standard]` (default: `WCAG2AA`) - Accessibility standard as per [pa11y](https://github.com/nature/pa11y#standard-string)
- `--report [path]` - path to output JSON audit report
- `--ignore [types]` - types to ignore separated by semi-colons (`notice;warning`)
- `--map` _(required when --lastmod is provided)_ - JSON map file which holds modified files data
- `--lastmod` _(optional)_ - Scan last modified files

### Example

```
html-audit a11y --path ./html-pages --report ./report --standard WCAG2AA --ignore 'notice;warning'
```

## 2. HTML5 validation audit

`html-audit html5`: audit HTML pages for HTML5 validation issues.

### Options

- `--help` _(optional)_ - Display help text
- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--report [path]` - path to output JSON audit report
- `--errors-only` - only report errors (no notices or warnings)
- `--map` _(required when --lastmod is provided)_ - JSON map file which holds modified files data
- `--lastmod` _(optional)_ - Scan last modified files
- `--validator` _(optional)_ - Manually specify validator service

### Example

```
html-audit html5 --path ./html-pages --report ./report --errors-only
```

## 3. Link audit

`html-audit link`: audit HTML pages for link issues.

### Options

- `--help` _(optional)_ - Display help text
- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--base-uri` _(required)_ - the base URL of the site being audited
- `--report [path]` - path to output JSON audit report
- `--report-verbose` - verbose report
- `--map` _(required when --lastmod is provided)_ - JSON map file which holds modified files data.
- `--lastmod` _(optional)_ - Scan last modified files

### Example

```
html-audit link --path ./html-pages --report ./report --base-uri http://example.com --report-verbose
```

# Development

## Code Standards

```bash
# Run code standard review
npm run eslint
```

## Test

```
npm run test
```

