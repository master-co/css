# @master/css.next

Next.js integration for Master CSS.

## Installation

```bash
npm install @master/css.next
```

## Usage

```js
import { withMasterCSS } from '@master/css.next'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
    /* your Next.js config */
})

export default nextConfig
```

## Modes

`@master/css.next` defaults to progressive rendering and supports these mode values:

| Mode | Description |
| --- | --- |
| `progressive` | Combines pre-rendered first-page CSS with the browser runtime for later client-side class changes. |
| `runtime` | Injects the browser runtime through the Next.js client instrumentation hook without adding the build adapter. |
| `pre-render` | Uses the Next.js Adapter API to render CSS into static and pre-rendered HTML outputs during `next build`. |
| `static` | Scans source files with `@master/css-scanner`, writes a generated stylesheet, and wires Master CSS stylesheet imports into Turbopack CSS processing. |
| `null` | Skips rendering modes while keeping the CSS manifest loaders available. |

Use `progressive` when route HTML should carry its first-render CSS and client-side class changes still need runtime coverage. Use `runtime` when CSS should be generated only in the browser. Use `pre-render` when build-rendered HTML should carry first-render CSS without runtime injection. Use `static` when classes are statically visible in source and should be emitted into a generated CSS asset.

## Static rendering

In static mode, import the generated stylesheet from your app stylesheet:

```css
@import '@master/css';

.main {
    background-color: var(--color-primary);
}

@theme {
    --color-primary: #ff0000;
}
```

Then enable static mode:

```js
import { withMasterCSS } from '@master/css.next'

/** @type {import('next').NextConfig} */
const nextConfig = await withMasterCSS({
    /* your Next.js config */
}, {
    mode: 'static'
})

export default nextConfig
```

Static mode uses source-glob scanning as the correctness baseline. A Turbopack CSS loader replaces `@import '@master/css'` with generated CSS. CSS files that import `@master/css` are treated as native CSS pruning roots by default; add `@preserve native;` when native CSS must be preserved.

## Client types

Add `@master/css-integration/client` to a project environment file when TypeScript imports Master CSS virtual modules.

```ts
/// <reference types="@master/css-integration/client" />
```

## Runtime input imports

The integration exposes canonical project-level runtime input modules:

```ts
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
```

Use these virtual modules when application code should receive the same manifest graph and emittedGlobals global CSS state discovered from the project CSS entry.

## Options

The `options` object is passed to `withMasterCSS(nextConfig, options)`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `'runtime' \| 'pre-render' \| 'static' \| 'progressive' \| null` | `'progressive'` | Next.js integration mode. Use `null` to skip rendering modes while keeping CSS manifest loaders. |
| `injectRuntime` | `boolean` | `true` | Include the Master CSS runtime through the Next.js client instrumentation hook in `runtime` and `progressive` modes. |
| `scannerOptions` | `ScannerOptions` | `{}` | Scanner options for static mode. |
| `buildReport` | `boolean \| string` | `false` | Write a build report with rendered files. `true` writes `.next/master-css-build-report.json`; a string is resolved from `distDir`. |
| `debug` | `boolean` | `false` | Log rendered output details during `next build`. |
| `adapterOrder` | `'master-first' \| 'external-first'` | `'master-first'` | Adapter execution order when composing with another Next adapter. |

See the [Next.js installation guide](https://rc.css.master.co/guide/installation/nextjs) for a full setup.
