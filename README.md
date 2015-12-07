# node-html-auditor

## Installation

```
npm install
npm link
```

## Usage

### Fetch HTML

```
html-fetch --uri [URI] --dir [path/to/directory] --map [path/to/directory]
```

## Accessibility audit (WCAG)

```
a11y-audit --path [/absolute/path/to/folder] [--report [path/to/reports]] --standard [STANDARD] [--ignore 'ignore1;ignore2;...']
a11y-audit --path [/absolute/path/to/folder/file.html] [--report [path/to/reports]] --standard [STANDARD] [--ignore 'ignore1;ignore2...']
a11y-audit --path [/absolute/path/to/folder/file.html path/to/folder/file-1.html ... ] [--report [path/to/reports]] --standard [STANDARD] [--ignore 'ignore1;ignore2...']
```

## HTML validation audit

```
html5-audit --path [path/to/folder] [--report [path/to/reports]] [--errors-only]
html5-audit --path [path/to/folder/file.html] [--report [path/to/reports]] [--errors-only]
html5-audit --path [path/to/folder/file.html path/to/folder/file-1.html ... ] [--report [path/to/reports]] [--errors-only]
```

## Link audit (dead links, etc)

```
link-audit --path [path/to/folder] [--report [path/to/reports]] [--report-verbose] [--base-uri [BASE URI]]
link-audit --path [path/to/folder/file.html] [--report [path/to/reports]] [--report-verbose] [--base-uri [BASE URI]]
link-audit --path [path/to/folder/file.html path/to/folder/file-1.html ... ] [--report [path/to/reports]] [--report-verbose] [--base-uri [BASE URI]]
