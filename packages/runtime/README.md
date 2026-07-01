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
import { CSSRuntime } from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'

CSSRuntime.create({ manifest, emittedGlobals }).observe()
```

## CDN IIFE

Use the CDN runtime when a page only needs the default preset and zero configuration:

```html
<link rel="preload" as="style" href="https://cdn.master.co/css@rc/base.css">
<link rel="modulepreload" as="json" crossorigin href="https://cdn.master.co/css-runtime@rc/default-manifest.json">
<link rel="stylesheet" href="https://cdn.master.co/css@rc/base.css">
<script src="https://cdn.master.co/css-runtime@rc"></script>
```

The IIFE imports `default-manifest.json` next to the runtime script as a JSON module, starts automatically, and registers the document runtime as `globalThis.masterCSSRuntime`. The CDN must serve the manifest with `application/json`, and the browser must support JSON modules and import attributes. It does not read global options or custom manifests. Use ESM `CSSRuntime.create({ manifest, emittedGlobals }).observe()` for custom theme tokens, utilities, modes, emitted globals, or hydration inputs.

## API

### `CSSRuntime`

```ts
import CSSRuntime from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'

const cssRuntime = CSSRuntime.create({ manifest })
cssRuntime.observe()
```

`CSSRuntime` runs in the browser and extends the manifest-driven `MasterCSS` engine. Use `CSSRuntime.create({ manifest })` when the runtime should reuse an existing runtime for the same root.

| API | Type | Description |
| --- | --- | --- |
| `CSSRuntime.instances` | `WeakMap<Document \| ShadowRoot, CSSRuntime>` | Runtime instances keyed by root. |
| `CSSRuntime.create(options)` | `CSSRuntime` | Creates or reuses a registered runtime for `options.root`. |
| `cssRuntime.root` | `Document \| ShadowRoot` | Observed root. |
| `cssRuntime.host` | `Element` | Root host, usually `root.host` or `document.documentElement`. |
| `cssRuntime.container` | `HTMLElement \| ShadowRoot` | Container for `style#master-css`. |
| `cssRuntime.observing` | `boolean` | `true` after `observe()`, `false` after `disconnect()`. |
| `cssRuntime.classCounts` | `Map<string, number>` | Active DOM class usage counts. This is the source of truth for observed DOM usage. |
| `cssRuntime.classUtilities` | `Map<string, Utility[]>` | Generated rule cache. It can include retained mutation rules that are no longer active in the DOM. |
| `cssRuntime.retainedClassNames` | `Set<string>` | Mutation-removed class names whose generated rules are temporarily retained in CSSOM. |
| `register()` | `this` | Registers this runtime in `CSSRuntime.instances`. |
| `unregister()` | `this` | Removes this runtime from `CSSRuntime.instances`. |
| `needsHydrationManifest()` | `boolean` | Returns `true` when an external hydration manifest should be loaded before observation. |
| `loadHydrationManifest()` | `Promise<this>` | Reads inline hydration data or imports the external hydration manifest URL from `style#master-css`. |
| `setHydrationManifest(manifest?)` | `this` | Sets the hydration manifest used by progressive hydration. |
| `observe()` | `this` | Observes class attribute changes. |
| `ensureClassRules(...classNames)` | `this` | Synchronously ensures generated rules exist for class names. Use this to warm rules before DOM insertion. |
| `deleteClassRules(...classNames)` | `void` | Synchronously deletes generated rules for class names. |
| `flushRetainedClassRules()` | `number` | Synchronously removes retained mutation rules that are no longer active and returns the removed class count. |
| `disconnect()` | `this \| undefined` | Cancels observation. |
| `refresh(manifest?)` | `this` | Refreshes with a complete `MasterCSSManifest`. |
| `reset()` | `this` | Clears rules and styles. |
| `destroy()` | `this` | Removes this runtime from `CSSRuntime.instances`. |

MutationObserver additions update `classCounts` immediately. Existing and retained generated rules are reused immediately, while first-time rules discovered by the observer are batched into the next pre-paint flush. MutationObserver removals also update `classCounts` immediately, but generated CSS rules may be retained briefly to avoid CSSOM deletion during interaction-heavy updates. Re-adding a retained class reuses the existing generated rule. Direct `cssRuntime.ensureClassRules(...)`, `cssRuntime.deleteClassRules(...)`, `refresh()`, `disconnect()`, and `destroy()` stay synchronous.

### Progressive Hydration

```ts
import { CSSRuntime } from '@master/css-runtime'
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'

const cssRuntime = CSSRuntime.create({
    manifest,
    emittedGlobals,
})
if (cssRuntime.needsHydrationManifest()) {
    await cssRuntime.loadHydrationManifest()
}
cssRuntime.observe()
```

`emittedGlobals` tells the runtime which variables and keyframes were already emitted by the project CSS entry, so future dynamic classes can reuse them without inserting duplicate global CSS.

## Related docs

- [General installation](https://rc.css.master.co/guide/installation)
- [Using CDNs](https://rc.css.master.co/guide/installation/cdn)
- [Runtime rendering](https://rc.css.master.co/guide/rendering-modes#runtime-rendering)
