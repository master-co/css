<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b><!-- name -->CSS React<!----></b>
</p>
<p align="center"><!-- package.description -->React hooks for Master CSS<!----></p>

[![MIT License](https://flat.badgen.net/github/license/master-co/css.react?color=yellow)](https://github.com/master-co/css.react/blob/main/LICENSE)
[![Latest Release](https://flat.badgen.net/npm/v/@master/css.react?icon=npm&label&color=yellow)](https://www.npmjs.com/package/@master/css.react)
[![Bundle Size](https://flat.badgen.net/bundlephobia/minzip/@master/css.react?icon=packagephobia&label&color=yellow)](https://bundlephobia.com/package/@master/css.react 'gzip bundle size (including dependencies)')
[![Package Size](https://flat.badgen.net/badgesize/brotli/https://cdn.jsdelivr.net/npm/@master/css.react?icon=jsdelivr&label&color=yellow)](https://unpkg.com/@master/css.react 'brotli package size (without dependencies)')
[![Documentation](https://flat.badgen.net/badge/icon/Documentation?icon=awesome&label&color=yellow)](https://css.master.co)
[![Github](https://flat.badgen.net/badge/icon/master-co%2Fcss.react?icon=github&label&color=yellow)](https://github.com/master-co/css.react)
[![Discord](https://flat.badgen.net/badge/icon/discord?icon=discord&label&color=yellow)](https://discord.gg/sZNKpAAAw6)
[![CI](https://flat.badgen.net/github/status/master-co/css.react/main/ci/circleci?icon=circleci)](https://circleci.com/gh/master-co/workflows/css/tree/main)

</div>

##### On this page
- [Installation](#installation)
- [Preparation](#preparation)
- [Hooks](#hooks)
  - [`useScheme`](#usescheme)
  - [`useEffected`](#useeffected)
  - [`useBreakpoints` 🚧](#usebreakpoints-)
- [Related](#related)

---

# Installation

```shell
npm install @master/css.react
```
`@master/css` requires `>=2`

---

# Preparation
Let's say `./src/master.js` is the file where you manage the Master CSS.
```ts
import MasterCSS from '@master/css'
import config from './master.css'
export const css = new MasterCSS({ config })
```

---

# Hooks

## `useScheme`
Hook `css.scheme` and `css.theme` changes.
```tsx
import { useScheme, useRendered } from '@master/css.react'
import { useCallback } from 'react'
import { css } from './master'

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

## `useEffected`
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

## `useBreakpoints` 🚧
```tsx
import { useBreakpoints } from '@master/css.react'
import { css } from './master'

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

---

# Related
- [@master/css](https://github.com/master-co/css) - A Virtual CSS language with enhanced syntax. ( ~13KB )
- [@master/style-element.react](https://github.com/master-co/style-element.react) - Quickly create styled React elements with conditional class names. ~800B