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
<p align="center">Svelte and SvelteKit runtime integration for Master CSS</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css.svelte">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css.svelte?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css.svelte?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css.svelte?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install @master/css.svelte
```

`@master/css.svelte` provides the SvelteKit integration, server hook, and runtime provider for Svelte apps. It combines static or progressive CSS generation with `@master/css-runtime` hydration.

## Usage

### Vite plugin

```ts
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import masterCSS from '@master/css.svelte/vite'

export default defineConfig({
    plugins: [
        sveltekit(),
        masterCSS()
    ]
})
```

### Server hook

Export the server handle to inject streamed CSS before `</head>`.

```ts
export { default as handle } from '@master/css.svelte/hooks.server'
```

If the project already has a server `handle`, compose it with SvelteKit's `sequence()`.

### Stylesheet

```css
@import '@master/css';
```

## Runtime provider

The root entry is intended for projects using an official Master CSS integration:

```ts
import { CSSRuntimeRegistry, CSSRuntimeProvider } from '@master/css.svelte'
```

Use `@master/css.svelte/runtime-provider` when you only need the provider API without the registry's default virtual module dependencies.

### `<CSSRuntimeRegistry>`

```svelte
<script lang="ts">
    import { CSSRuntimeRegistry } from '@master/css.svelte'
</script>

<CSSRuntimeRegistry>
    <slot />
</CSSRuntimeRegistry>
```

The registry loads `virtual:master-css-manifest` and `virtual:master-css-emitted-globals` internally, so use it when the official integration should load the project-level manifest discovered from the CSS entry and the matching emittedGlobals global CSS state.

### `<CSSRuntimeProvider>`

Use the provider subpath when you need to pass a custom manifest or root:

```svelte
<script lang="ts">
    import { CSSRuntimeProvider } from '@master/css.svelte/runtime-provider'
    import manifest from './app.css?master-css-manifest'
</script>

<CSSRuntimeProvider {manifest}>
    <slot />
</CSSRuntimeProvider>
```

Provider props:

```ts
interface CSSRuntimeProviderProps {
    manifest: MasterCSSManifest
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
    root?: Document | ShadowRoot | null
}
```

`root` defaults to `document`. Pass a `ShadowRoot` when Svelte renders into a shadow tree and the runtime should observe only that tree.

### `getCSSRuntime()`

Access the runtime store provided by `CSSRuntimeProvider`.

```svelte
<script lang="ts">
    import { getCSSRuntime } from '@master/css.svelte/runtime-provider'

    const cssRuntime = getCSSRuntime()
</script>
```

The returned value is a `Writable<CSSRuntime | undefined>`. It is available to descendants of `CSSRuntimeProvider`.

See the [Svelte installation guide](https://rc.css.master.co/guide/installation/svelte) for a full project setup.
