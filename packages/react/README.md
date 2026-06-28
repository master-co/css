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
<p align="center">React runtime provider for Master CSS</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css.react">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css.react?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css.react?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css.react?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install @master/css.react
```

`@master/css.react` provides React runtime helpers around `@master/css-runtime`.

## Usage

The root entry is intended for projects using an official Master CSS integration:

```tsx
import { CSSRuntimeRegistry, CSSRuntimeProvider } from '@master/css.react'
```

Use `@master/css.react/runtime-provider` when you only need the provider API without the registry's default virtual module dependencies.

### `<CSSRuntimeRegistry>`

Use the registry with an official Master CSS integration:

```tsx
import { CSSRuntimeRegistry } from '@master/css.react'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <CSSRuntimeRegistry>
            {children}
        </CSSRuntimeRegistry>
    )
}
```

The registry loads `virtual:master-css-manifest` and `virtual:master-css-emitted-globals` internally, so use it when the official integration should load the project-level manifest discovered from the CSS entry and the matching emittedGlobals global CSS state.

### `<CSSRuntimeProvider>`

Use the provider subpath when you need to pass a custom manifest or root:

```tsx
import { CSSRuntimeProvider } from '@master/css.react/runtime-provider'
import manifest from './theme.css?master-css-manifest'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <CSSRuntimeProvider manifest={manifest}>
            {children}
        </CSSRuntimeProvider>
    )
}
```

The provider calls `CSSRuntime.create({ manifest, root, emittedGlobals })`, loads an external hydration manifest when needed, observes on mount, refreshes the runtime when `manifest` changes, recreates it when `root` changes, and destroys it on unmount.

### `CSSRuntimeProviderProps`

```ts
interface CSSRuntimeProviderProps {
    children?: ReactNode
    manifest: MasterCSSManifest
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
    root?: Document | ShadowRoot | null
}
```

### `useCSSRuntime()`

Access the runtime instance from components rendered inside `CSSRuntimeProvider`.

```tsx
import { useCSSRuntime } from '@master/css.react/runtime-provider'

export function Component() {
    const cssRuntime = useCSSRuntime()
}
```

See the [React installation guide](https://rc.css.master.co/guide/installation/react) for a full project setup.
