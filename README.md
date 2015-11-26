# node-pa11y-auditor

## Installation

```
npm install
npm link
```

## Usage

### Fetch HTML

```
html-fetch --uri [URI] --dir [path/to/directory]
```

## Accessibility audit (WCAG)

```
a11y-audit --path [path/to/folder] --report [path/to/report] --standard [STANDARD]
a11y-audit --path [path/to/folder/file.html] --report [path/to/report] --standard [STANDARD]
a11y-audit --path [path/to/folder/file.html path/to/folder/file-1.html ... ] --report [path/to/report] --standard [STANDARD]
```

## HTML validation audit

```
html5-audit --path [path/to/folder] --report [path/to/report]
html5-audit --path [path/to/folder/file.html] --report [path/to/report]
html5-audit --path [path/to/folder/file.html path/to/folder/file-1.html ... ] --report [path/to/report]
```

## Link audit (dead links, etc)

```
link-audit --path [path/to/folder] --report [path/to/report] [--report-verbose] --base-uri [BASE URI]
link-audit --path [path/to/folder/file.html] --report [path/to/report] [--report-verbose] --base-uri [BASE URI]
link-audit --path [path/to/folder/file.html path/to/folder/file-1.html ... ] --report [path/to/report] [--report-verbose] --base-uri [BASE URI]
