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
<p align="center">React hooks and components for Master CSS</p>

<p align="center">
    <a aria-label="overview" href="https://github.com/master-co/css/tree/beta">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=212022&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
            <img alt="NPM Version" src="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
        </picture>
    </a>
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
    <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css.react?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css.react?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
            <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css.react?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
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
    <a aria-label="Github Actions" href="https://github.com/1aron/repo/actions/workflows/release.yml">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=beta&label=%20&message=twitter&color=212022&logo=githubactions&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=beta&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
            <img alt="Github release actions" src="https://img.shields.io/github/actions/workflow/status/master-co/css/release.yml?branch=beta&label=%20&message=twitter&color=f6f7f8&logo=githubactions&style=for-the-badge&logoColor=%23000">
        </picture>
    </a>
</p>

</div>

## Installation

```shell
npm install @master/css.react
```
Required `@master/css^2`

## Preparation
Let's say `./src/main.js` is the file where you manage the Master CSS.
```ts
import MasterCSS from '@master/css'
import { config } from './master.css'
export const css = new MasterCSS(config)
```

## Hooks

### `useScheme`
Hook `css.scheme` and `css.theme` changes.
```tsx
import { useScheme, useRendered } from '@master/css.react'
import { useCallback } from 'react'
import { css } from './main'

export default function ThemeButton() {
    const { scheme, setScheme, theme } = useScheme(css)
    const changeScheme = useCallback(({ target }) => {
        setScheme(target.value)
    }, [setScheme])
    const effected = useEffected()
    return (
        <button className="rel">
            {effected && theme}
            <select value={scheme} onChange={changeScheme} className="abs full opacity:0 cursor:pointer" >
                <option value="light">☀️ Light</option>
                <option value="dark">🌜 Dark</option>
                <option value="system">System</option>
            </select>
        </button>
    )
}
```
Use `setScheme` to change the theme scheme for Master CSS.

### `useEffected`
Hook side effects for binding `document`, `window`, `localStorage`, etc.
```tsx
import { useScheme, useEffected } from '@master/css.react'

export default function ThemeButton({ onChange, className }: any) {
    const effected = useEffected()
    return (
        {effected && localStorage.getItem('scheme')}
    )
}
```
Often used to prevent server-side use of the browser API result in a hydration error.

### `useBreakpoints` 🚧
```tsx
import { useBreakpoints } from '@master/css.react'
import { css } from './main'

export default function Home() {
    const at = useBreakpoints(css)
    return (
        <>
            {at('>=md') && '>=1024'}
            {at('<=md') && '<=1024'}
            {at('>md') && '>1024'}
            {at('<md') && '<1024'}
            {at('=md') && '=1024'}
        </>
    )
}
```

<br>

<a aria-label="overview" href="https://github.com/master-co/css/tree/beta">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=212022&style=for-the-badge">
        <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
        <img alt="NPM Version" src="https://img.shields.io/badge/%E2%AC%85%20back-%20?color=f6f7f8&style=for-the-badge">
    </picture>
</a>