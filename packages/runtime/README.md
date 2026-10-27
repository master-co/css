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

Initialize the runtime with the project's runtime program and emitted global CSS state provided by an official integration:

```js
import { MasterCSSRuntime } from '@master/css-runtime'
import program from 'virtual:master-css-program'
import emittedGlobals from 'virtual:master-css-emitted-globals'

const cssRuntime = await MasterCSSRuntime.start({ program, emittedGlobals })
cssRuntime.observe()
```

The runtime program is the project manifest compiled for the browser engine. Integrations compile it at build time; other Node build steps can call `compileRuntimeProgram(manifest)` from `@master/css/node`. Browsers cannot compile manifests.

Apps that only use the default preset and have no Master CSS bundler integration can import its program from the runtime package:

```js
import { MasterCSSRuntime } from '@master/css-runtime'

const cssRuntime = await MasterCSSRuntime.start({
  program: () => import('@master/css-runtime/default-program').then(module => module.defaultProgram)
})
cssRuntime.observe()
```

## CDN IIFE

Use the CDN runtime when a page only needs the default preset and zero configuration:

```html
<link rel="preload" as="style" href="https://cdn.jsdelivr.net/npm/@master/css-preset@rc/src/base.css">
<link rel="preload" as="fetch" crossorigin href="https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/default-program.bin">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@master/css-preset@rc/src/base.css">
<script src="https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/global.min.js"></script>
```

The IIFE starts automatically and registers the document runtime as `globalThis.masterCSSRuntime`. The bundle includes the JavaScript engine. When its engine starts, it fetches `default-program.bin` next to the runtime script, the default preset compiled for the engine. The CDN must serve it with CORS headers, and a Content Security Policy must allow fetching it (`connect-src`); no Wasm is loaded, so `wasm-unsafe-eval` is not needed. The `@rc` URLs follow published packages and may lag unreleased source changes; keep the runtime and preset on compatible versions. The IIFE does not read global options or custom programs. Use ESM `await MasterCSSRuntime.start({ program, emittedGlobals })` for custom inputs.

## API

### `MasterCSSRuntime`

```ts
import { MasterCSSRuntime } from '@master/css-runtime'
import program from 'virtual:master-css-program'

const cssRuntime = await MasterCSSRuntime.start({ program })
cssRuntime.observe()
```

`MasterCSSRuntime` is the DOM/CSSOM host around an engine session; browsers execute the runtime program with the JavaScript engine, whose CSS output matches the Rust engine. Public state is available only through `snapshot()` and the readonly global facade.

| API | Type | Description |
| --- | --- | --- |
| `MasterCSSRuntime.start(options)` | `Promise<MasterCSSRuntime>` | Initializes or reuses the runtime for `options.root`. |
| `ready()` | `Promise<this>` | Starts the engine if it is deferred and resolves when it is ready; rejects when engine startup fails, or with `RUNTIME_DISPOSED` after `dispose()`. |
| `observe()` | `this` | Observes class attribute changes. |
| `disconnect()` | `this` | Stops observation and clears non-hydrated runtime state. A pending engine startup continues. |
| `refresh(program?, emittedGlobals?)` | `this` | Replaces the runtime program and, when provided, the emitted global CSS state; without a program it re-executes the current one. A deferred or failed runtime starts its engine from the new inputs; during engine startup the refresh is applied once the engine is ready. |
| `ensureClassRules(classNames)` | `MasterCSSEngineTransition` | Synchronously ensures rules for a readonly class-name collection. |
| `deleteClassRules(classNames)` | `MasterCSSEngineTransition` | Synchronously deletes rules for a readonly class-name collection, bypassing retention. |
| `snapshot()` | `MasterCSSRuntimeSnapshot` | Returns frozen class rules, usage counts, layers, CSS text, binding, engine state, and hydration state. |
| `binding` | `'js' \| 'native' \| 'wasm' \| undefined` | The engine binding: `'js'` in browsers; `undefined` until the engine is ready. |
| `dispose()` | `void` | Idempotently releases observation, CSSOM state, and the binding session, and cancels a pending engine startup. |

| Option | Description |
| --- | --- |
| `program` | The runtime program as a `Uint8Array` or `ArrayBuffer`, or `() => Promise<Uint8Array \| ArrayBuffer>` to load it only when the engine starts. Required. |
| `emittedGlobals` | Variables and keyframes already emitted by the project CSS entry. |
| `hydrationManifest` | Explicit page hydration data. Without it, `start()` reads inline or external hydration data from the document. |
| `root` | The `Document` or `ShadowRoot` to observe; defaults to `document`. |
| `engine` | `'eager'` starts the engine during `start()`. `'deferred'` waits for the first class that the page hydration manifest does not cover. Defaults to `'deferred'` when `style#master-css` has a valid, non-empty hydration manifest, and `'eager'` otherwise. |
| `enginePrefetch` | `'none'` (default) starts a deferred engine only when it is needed. `'idle'` starts it during browser idle time, including the engine module and runtime program downloads, so later uncovered classes do not wait. |
| `binding` | `'auto'` (default), `'wasm'`, or `'native'`. Browsers execute programs with the JavaScript engine and reject `'wasm'` and `'native'`, which run in Node. |
| `startupTimeoutMs` | Fails hydration data loading or engine startup that takes longer than this with `RUNTIME_STARTUP_TIMEOUT`. |
| `onDiagnostic` | Receives startup and engine startup diagnostics. |

### Progressive hydration

```ts
import { MasterCSSRuntime } from '@master/css-runtime'

const cssRuntime = await MasterCSSRuntime.start({
  program: () => import('virtual:master-css-program').then(module => module.default),
})
cssRuntime.observe()
```

`start()` resolves explicit, inline, or external hydration data before returning. When `style#master-css` has a valid, non-empty hydration manifest, the engine is deferred: `start()` does not load the engine module or the project manifest, and the runtime leaves the pre-rendered CSSOM untouched while it tracks class usage. The hydration manifest's `classNames` lists every server-rendered class, including ordinary authored CSS classes that generate no Master CSS rules, and classes that project selectors reference without generating rules, such as a `dark` mode class a page script adds. The first connected class outside that list starts the engine. The runtime then replays the listed classes in the engine, verifies the pre-rendered CSS against its output, generates the uncovered classes, and releases hydrated classes that are no longer connected. A page whose classes are all pre-rendered never downloads the engine.

`snapshot().engine` reports `'deferred'`, `'loading'`, `'ready'`, or `'failed'`. While the engine is deferred or loading, `ensureClassRules()` and `deleteClassRules()` throw `RUNTIME_ENGINE_NOT_READY` and start the engine; call `await cssRuntime.ready()` before using them. Until the engine is ready, `snapshot().classRules` lists connected classes with their usage counts and no rules, `cssText` comes from `style#master-css`, and no layers are reported. If engine startup fails, `onDiagnostic` receives the failure, pre-rendered CSS stays in place, and classes outside the hydration manifest remain unstyled. Rule APIs keep throwing `RUNTIME_ENGINE_NOT_READY` without restarting the engine; `refresh()` or a new `start()` retries.

`emittedGlobals` tells the runtime which variables and keyframes were already emitted by the project CSS entry, so future dynamic classes can reuse them without inserting duplicate global CSS. These counts are cumulative for the lifetime of the runtime and cannot be unregistered.

Concurrent `start()` calls for the same root share one startup. The first call's program, binding, engine options, timeout, and diagnostic callback remain authoritative; pending `emittedGlobals` counts are added together, and the last explicitly provided hydration manifest is used. Every caller resolves to the same fully coordinated runtime.

`globalThis.MasterCSSRuntime` keeps the constructor name and `globalThis.masterCSSRuntime` exposes the readonly facade, including `ready()`.

## Related docs

- [General installation](https://rc.css.master.co/guide/installation)
- [Using CDNs](https://rc.css.master.co/guide/installation/cdn)
- [Runtime rendering](https://rc.css.master.co/guide/rendering-modes#runtime-rendering)
