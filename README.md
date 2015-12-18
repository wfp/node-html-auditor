A NodeJS CLI tool to fetch and audit HTML pages for [web accessibility](https://en.wikipedia.org/wiki/Web_accessibility) (WCAG2), HTML5 and link validation.

# Installation

```
git clone https://github.com/wfp/node-html-auditor.git
cd node-html-auditor
git checkout develop

npm install
npm link
```

# Retreive HTML

## HTML Fetch

`html-fetch`: fetch HTML pages from an [XML sitemap](https://en.wikipedia.org/wiki/Sitemaps) or individual HTML page.

### Options

- `--uri` _(required)_ - path or URL to XML Sitemap file.
- `--dir` _(required)_ - directory to output HTML files.
- `--map` _(optional)_ - file to output JSON that maps file names to URLs. If not set, sends to stdout


### Example

```
html-fetch --uri http://www.bbc.com/sport/sitemap.xml --dir ./html-pages
```

# Audit HTML

## 1. Accessibility audit (WCAG)

`a11y-audit`: audit HTML pages for accessibility issues.

### Options

- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--standard [standard]` (default: `WCAG2AA`) - Accessibility standard as per [pa11y](https://github.com/nature/pa11y#standard-string)
- `--report [path]` - path to output JSON audit report
- `--ignore [types]` - types to ignore separated by semi-colons (`notice;warning`)
- `--phantomjs [path]` - define the path to the phantomjs binary.

### Example

```
a11y-audit --path ./html-pages --report ./report --standard WCAG2AA --ignore 'notice;warning'
```

## 2. HTML5 validation audit

`html5-audit`: audit HTML pages for HTML5 validation issues.

### Options

- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--report [path]` - path to output JSON audit report
- `--errors-only` - only report errors (no notices or warnings)

### Example

```
html5-audit --path ./html-pages --report ./report --errors-only
```

## 3. Link audit

`link-audit`: audit HTML pages for link issues.

### Options

- `--path [path / file]` _(required)_ - path to HTML files or an HTML file to audit
- `--base-uri` _(required)_ - the base URL of the site being audited
- `--report [path]` - path to output JSON audit report
- `--report-verbose` - verbose report

### Example

```
link-audit --path ./html-pages --report ./report --base-uri http://example.com --report-verbose
```

# Development

## Code Standards

```bash
# Run code standard review
npm run eslint
```
