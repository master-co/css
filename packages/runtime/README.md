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
<p align="center">Browser runtime for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-runtime">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-runtime?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-runtime?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-runtime?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css-runtime">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-runtime?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-runtime?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
      <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css-runtime?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
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
npm install @master/css-runtime
```

Initialize the runtime with the project manifest and emitted global CSS state provided by an official integration:

```js
import { MasterCSSRuntime } from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'

const cssRuntime = await MasterCSSRuntime.start({ manifest, emittedGlobals })
cssRuntime.observe()
```

## CDN IIFE

Use the CDN runtime when a page only needs the default preset and zero configuration:

```html
<link rel="preload" as="style" href="https://cdn.master.co/css@rc/base.css">
<link rel="modulepreload" as="json" crossorigin href="https://cdn.master.co/css-runtime@rc/default-manifest.json">
<link rel="stylesheet" href="https://cdn.master.co/css@rc/base.css">
<script src="https://cdn.master.co/css-runtime@rc"></script>
```

The IIFE imports `default-manifest.json` next to the runtime script as a JSON module, starts automatically, and registers the document runtime as `globalThis.masterCSSRuntime`. The CDN must serve the manifest with `application/json`, and the browser must support JSON modules and import attributes. It does not read global options or custom manifests. Use ESM `await MasterCSSRuntime.start({ manifest, emittedGlobals })` for custom inputs.

## API

### `MasterCSSRuntime`

```ts
import { MasterCSSRuntime } from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'

const cssRuntime = await MasterCSSRuntime.start({ manifest })
cssRuntime.observe()
```

`MasterCSSRuntime` is the DOM/CSSOM host around a Rust/Wasm engine session. Public state is available only through `snapshot()` and the readonly global facade.

| API | Type | Description |
| --- | --- | --- |
| `MasterCSSRuntime.start(options)` | `Promise<MasterCSSRuntime>` | Initializes or reuses the runtime for `options.root`; `manifest` is required. |
| `observe()` | `this` | Observes class attribute changes. |
| `disconnect()` | `this` | Stops observation and clears non-hydrated runtime state. |
| `refresh(manifest)` | `this` | Replaces the complete manifest. |
| `ensureClassRules(classNames)` | `MasterCSSEngineTransition` | Ensures rules for a readonly class-name collection. |
| `deleteClassRules(classNames)` | `MasterCSSEngineTransition` | Deletes rules for a readonly class-name collection. |
| `snapshot()` | `MasterCSSRuntimeSnapshot` | Returns frozen class rules, usage counts, layers, CSS text, binding, and hydration state. |
| `dispose()` | `void` | Idempotently releases observation, CSSOM state, and the binding session. |

### Progressive Hydration

```ts
import { MasterCSSRuntime } from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'

const cssRuntime = await MasterCSSRuntime.start({
  manifest,
  emittedGlobals,
})
cssRuntime.observe()
```

`start()` resolves explicit, inline, or external hydration data before returning. `emittedGlobals` tells the runtime which variables and keyframes were already emitted by the project CSS entry, so future dynamic classes can reuse them without inserting duplicate global CSS. These counts are cumulative for the lifetime of the runtime and cannot be unregistered.

Concurrent `start()` calls for the same root share one startup. The first call's manifest, binding, timeout, and diagnostic callback remain authoritative; pending `emittedGlobals` counts are added together, and the last explicitly provided hydration manifest is used. Every caller resolves to the same fully coordinated runtime.

`globalThis.MasterCSSRuntime` keeps the constructor name and `globalThis.masterCSSRuntime` exposes the readonly facade.

## Related docs

- [General installation](https://rc.css.master.co/guide/installation)
- [Using CDNs](https://rc.css.master.co/guide/installation/cdn)
- [Runtime rendering](https://rc.css.master.co/guide/rendering-modes#runtime-rendering)
