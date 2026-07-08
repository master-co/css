# Master CSS Diagnostics

Adapter-neutral project inspection reports for Master CSS tooling.

`@master/css-diagnostics` builds scanner, stylesheet, generated CSS, and missing CSS reports that can be reused by adapters such as `@master/css-cli` and `@master/css-mcp`.

It does not own class lint policy. Use `@master/css-lint` for class-list diagnostics and fixes.

## Usage

```ts
import { createMasterCSSInspectionReport } from '@master/css-diagnostics'

const report = await createMasterCSSInspectionReport({
  cwd: process.cwd(),
  patterns: ['src/**/*.{html,tsx}'],
  classes: ['btn', 'card'],
  includeCss: false
})
```

The report uses `version: 1` and includes scanner state, stylesheet entries, generated CSS metadata, missing CSS checks, per-file discoveries, diagnostics, and summary counts.
