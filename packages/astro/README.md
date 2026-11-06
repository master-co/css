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
<p align="center">Astro integration for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="GitHub release" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-astro">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-astro?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-astro?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-astro?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="Follow @mastercorg" href="https://twitter.com/mastercorg">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=212022&logo=twitter&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
      <img alt="Follow @mastercorg" src="https://img.shields.io/static/v1?label=%20&message=twitter&color=f6f7f8&logo=twitter&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="GitHub Actions" href="https://github.com/master-co/css/actions/workflows/release.yml">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=main&label=%20&color=212022&logo=githubactions&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=main&label=%20&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
      <img alt="GitHub release workflow" src="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=main&label=%20&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
    </picture>
  </a>
</p>

</div>

## Installation

```bash
npm install @master/css-astro
```

## Usage

```js
import { defineConfig } from 'astro/config'
import masterCSS from '@master/css-astro'

export default defineConfig({
  integrations: [
    masterCSS()
  ]
})
```

| `mode` | Where Master CSS generates utility rules |
| --- | --- |
| `static` (default) | Scans source, including `.astro` files, and writes the rules to a stylesheet. |
| `runtime` | Generates rules in the browser for classes as they appear. |
| `prerender` | Uses Astro middleware to put rules for classes in the rendered HTML into `style#master-css`. |
| `progressive` | Uses the same middleware for initial CSS and starts the browser engine when a class outside the page manifest appears. |

In static builds with `mode: 'runtime'`, the integration modulepreloads the runtime script and preloads the emitted runtime program with `<link rel="preload" as="fetch">` when it also injects the runtime script. To omit the browser runtime, choose `static` or `prerender`; `runtime: false` conflicts with `runtime` and `progressive` modes and is rejected. SSR-only Astro output does not receive these preloads because the integration cannot reliably resolve the final client program asset URL at build time.

```css
@import '@master/css';
```

## Options

The `options` object extends `@master/css-vite` plugin options and is passed to the Astro integration.

```js
import { defineConfig } from 'astro/config'
import masterCSS from '@master/css-astro'

export default defineConfig({
  integrations: [
    masterCSS({
      mode: 'progressive'
    })
  ]
})
```

For `prerender` and `progressive` modes, Astro owns the HTML rendering step through `@master/css-astro/middleware`, so you do not need to add `@master/css-server` manually.

Default options:

| Option | Default | Description |
| --- | --- | --- |
| `enabled` | `true` | Enables the integration. |
| `mode` | `'static'` | Selects `static`, `prerender`, `runtime`, or `progressive` rendering. |
| `scanner` | `{}` | Scanner configuration passed through to the shared Vite pipeline. |
| `runtime` | `{ enabled: false }` | Enabled by runtime/progressive modes; optional FOUC protection. Explicit enabled values must agree with the mode. |

See the [Astro installation guide](https://css.master.co/guide/installation/astro) for a full project setup.
