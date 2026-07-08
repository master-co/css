<br>
<div align="center">

<p align="center">
  <a href="https://css.master.co">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/33840671/201701649-3bb7d698-abec-4d5f-ac30-ccc4d7bafcd4.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg">
      <img alt="Master CSS" src="https://user-images.githubusercontent.com/33840671/201703010-77bf2373-9899-40cc-98f5-30cf9b546941.svg" width="100%">
    </picture>
  </a>
</p>
<p align="center">Master CSS source scanner for static rendering</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-scanner">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-scanner?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-scanner?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-scanner?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Discord Community" href="https://discord.gg/sZNKpAAAw6">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/discord/917780624314613760?color=212022&label=%20&logo=discord&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
      <img alt="Discord online" src="https://img.shields.io/discord/917780624314613760?color=f6f7f8&label=%20&logo=discord&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Follow @mastercorg" href="https://twitter.com/mastercorg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=212022&logo=twitter&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
      <img alt="Follow @mastercorg" src="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Github Actions" href="https://github.com/master-co/css/actions/workflows/ci-release.yml">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=212022&logo=githubactions&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
      <img alt="Github release actions" src="https://img.shields.io/github/actions/workflow/status/master-co/css/ci-release.yml?branch=rc&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
    </picture>
  </a>
</p>

</div>

## Installation

```bash
npm install @master/css-scanner
```

`@master/css-scanner` is the Node.js content-scanning engine behind Master CSS static rendering. It scans supplied source text, validates possible classes, inserts generated rules, and maintains scanner state for build integrations. Source discovery, file watching, and CSS file output are owned by CLI/framework/build integrations.

## Usage

```js
import { CSSScanner } from '@master/css-scanner'

const scanner = new CSSScanner(options, cwd)
```

`cwd` resolves project-relative module excludes and log output.

## Options

Default options are exported from the root package and the side-effect-free `./options` subpath:

```js
import { scannerOptions } from '@master/css-scanner'
import defaultScannerOptions from '@master/css-scanner/options'
```

| Option | Type | Description |
| --- | --- | --- |
| `manifest` | `MasterCSSManifest` | Explicit compiled manifest. When omitted, integrations and CLI flows load the project CSS entry manifest from `cwd`. |
| `exclude` | `string[]` | Module paths to exclude from integration-fed module scans. |
| `safelist` | `string[]` | Classes generated regardless of source detection. |
| `blocklist` | `(string \| RegExp)[]` | Classes excluded from accidental scanner matches. |

Use `safelist` for classes from asynchronous data, irregular classes, or classes that are not visible in source. Use `blocklist` for false positives.

## CSS directives

CLI and framework/build integrations handle ordinary project source discovery. Use stylesheet directives when a stylesheet needs explicit source exceptions or candidate policy. For the full stylesheet syntax, see [CSS directives](https://rc.css.master.co/reference/directives).

```css
@source '../content/**/*.mdx';
@source '../packages/ui/**/*.{ts,tsx}';
@source not '../packages/ui/**/*.stories.tsx';

@safelist 'dialog-open bg:blue-60@dark';
@blocklist 'debug-*';
```

Stylesheet `@source` directives are resolved by the stylesheet pipeline as `(source union) - (source not union)`. Use them for extra content, shared source, or scoped roots rather than restating the default app scan. `@safelist` maps to `safelist`, and `@blocklist` maps to `blocklist`.

Bare source globs are resolved from `cwd`. Globs that start with `./` or `../` are resolved relative to the CSS file that declares the directive. `@blocklist` accepts exact strings and `*` / `?` wildcard patterns.

## Native CSS pruning

Prune native CSS class selector rules from a stylesheet by importing `@master/css` in that stylesheet:

```css
@import "@master/css";
@import "./styles/btn.css";

.card {
  color: red;
}

.unused {
  color: blue;
}
```

Local relative `.css` imports are expanded, the Master import is replaced by generated CSS, and native class rules are kept only when their class names are found by the scanner. Add `@preserve native;` to preserve native CSS in a Master-managed root. See [Native CSS pruning](https://rc.css.master.co/guide/native-css-pruning) for the full model.

## Class candidate extraction

Use `@master/css-source` when a tool only needs unvalidated class-like candidates from source content:

```ts
import { extractClassCandidates } from '@master/css-source'

const result = extractClassCandidates(source)
```
