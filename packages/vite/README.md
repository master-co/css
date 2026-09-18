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
<p align="center">Vite plugin for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-vite">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-vite?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-vite?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-vite?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install @master/css-vite
```

## Usage

```js
import masterCSS from '@master/css-vite'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    masterCSS()
  ]
}

export default config
```

Import the default stylesheet from the CSS entry your app already loads:

```css
@import '@master/css';
```

During development, `runtime` and `progressive` modes load the injected runtime
under Vite's resolved `base`, including nested HTML pages. The runtime preload
uses the same URL. Relative or empty bases follow Vite's development normalization.

## Client types
Add the client type reference when TypeScript source files import Master CSS virtual manifest, emittedGlobals, or generated CSS modules:

```ts
/// <reference types="vite/client" />
/// <reference types="@master/css/client" />
```

## Master CSS imports

In static mode, import the generated stylesheet from a source stylesheet.

```css
@import '@master/css';
```

Source stylesheets that import `@master/css` are treated as native CSS pruning roots by default. Ordinary CSS outside Master CSS directives is pruned against detected classes, and the import inserts generated Master CSS. Add `@preserve native;` when native CSS must be preserved.

## Production CSS asset names

When Vite uses an `assetFileNames` pattern containing `[hash]`, managed CSS participates in the asset hash before Vite generates HTML and JavaScript references. Changing the managed stylesheet therefore changes its URL; identical inputs produce stable output names. This also applies to CSS loaded by dynamic imports and builds with `cssCodeSplit: false`.

Custom `assetFileNames` callbacks receive the CSS entry at the naming stage, including its content-sensitive import URL when managed output is delivered as separate assets. Hash length and `hashCharacters` settings are honored. Vite can still include its own naming metadata and perform later output processing, so the filename hash is not a checksum of the final file on disk. Fixed filename patterns remain fixed and require the application's own cache invalidation policy.

Production builds retain managed stylesheet imports as separate CSS assets. Local
and external imports keep their order, media/supports conditions and layer scopes;
ordinary rules before or after the managed entry keep their positions. Deploy the
complete output directory, including the generated `master-css-*` CSS and resource
files. Additional CSS files are placed beside Vite's CSS entry so ordinary relative
resource URLs retain their base. Managed and Node-resolved package resources receive
content-sensitive filenames and preserve query strings and fragments.

Node-resolved package CSS imports retain native rules when project CSS is pruned.
Production CSS import resolution uses Vite's resolver, including string and regular
expression aliases, package import conditions, and custom plugins that resolve to
CSS files on disk. This also discovers entry markers and definitions through
aliased imports. Null-prefixed virtual `.css` modules supplied by plugin loaders
can also provide managed entries or imported definitions. Their original CSS is
retained before transforms, and imports preserve their conditions and layers;
graph-only loaded modules do not create extra unconditional entries. Virtual ID
query suffixes retain distinct source identities. Virtual
resource ownership and alias resolution for `@reference`
or resource URLs still require further integration. Build watch and development
HMR for virtual sources need separate validation; physical development entries
use graph delivery as described below.

Vite production builds preprocess Sass entries and imports using the configured
Sass options, aliases and partial dependencies. String or function `additionalData`
runs once per source in each build. CSS imports left by Sass retain their conditions
and source order in the compiler graph. Relative partial resources keep their
original owner, and changing a partial triggers a rebuild. CSS Modules retain Vite's
scoped class names and exports; raw text requests bypass stylesheet compilation.
Managed `?inline` imports return compiled CSS without injecting a stylesheet:

```js
import css from './style.css?inline'

const style = document.createElement('style')
style.textContent = css
document.head.append(style)
```

Each inline request has its own stylesheet output, including when another file is
loaded automatically. Safe local imports are expanded; imports that protect CSS
scope or external loading remain linked assets. Import-free strings can also be
used with `CSSStyleSheet.replaceSync()`. Asset URLs retain the emitted asset base
when the string is inserted into another document location. Inline CSS content
participates in hashed JavaScript filenames.

During an SSR build, inline CSS uses the configured public `base` for asset URLs.
With Vite’s default `ssrEmitAssets: false`, deploy the matching client build’s
assets. Enable `ssrEmitAssets` when the server build should also publish them.

Inline asset URLs also use Vite’s `experimental.renderBuiltUrl` callback. The
callback receives `hostType: "js"` for inline strings and `hostType: "css"` for
retained stylesheet files. JavaScript URLs can use runtime expressions; stylesheet
files use static URLs or relative-path decisions. URL mapping changes participate
in retained stylesheet filenames as well as the importing JavaScript hash.

Production Sass compiler diagnostics use Vite's preprocessing maps to identify
the original file or partial, including inline requests and Sass imported by CSS.
Unchanged tokens retain their original ranges. Sass expansion can provide only
the originating segment; diagnostics explain when an exact token range is
unavailable. Injected content or an `additionalData` callback without a usable map
can retain a clearly identified preprocessed location. Internal diagnostic maps
do not enable published source maps.

Production CSS Modules, including Sass modules, retain Vite's scoped names,
named/default exports, cross-file `composes`, global selectors and
`localsConvention`. Exported scoped names participate in native CSS usage so
the default pruning policy keeps their rules.

Production build-watch tracks resolved CSS Modules `composes` dependencies,
including nested compositions. Editing a composed file rebuilds its consumers;
correcting an invalid Master CSS composition in that file recovers the build.
When Vite provides no original location for composed CSS, diagnostics explicitly
identify the preprocessed location.

Development CSS and Sass modules retain their scoped exports and native rules.
Editing the module or a resolved `composes` dependency updates both its CSS and
exports through HMR, including modules that use local `@compose`.

During development, editing a CSS project entry updates ordinary stylesheet
imports and its `?inline` and `?raw` consumers. Inline requests export processed
CSS without injecting a stylesheet; raw requests retain the original source.
Sass stylesheets attached through a `?url` value update in place during development,
including paths under a configured base, aliases, and allowed files outside the project root.
For CSS and Sass Modules, `?inline` exports the scoped CSS without injecting it,
while `?raw` retains the authored source. Vite 8.2.2 rejects `?url` for
`.module.css` and `.module.scss` paths, even with `css.modules: false`.

Ordinary Sass `@use` and nested `@forward` partials update their stylesheet
consumers during development, including `?inline` and attached `?url` values.
Deleting a partial reports the Sass error; restoring it recovers the stylesheet
without reloading the page. Relative resources keep the partial’s directory as
their source location.
Server-side `?inline` consumers also receive updated Sass output. After restarting
the Vite dev server, connected pages reload and reconnect; stylesheet requests
and subsequent edits use the new server state. This also works in middleware
mode when Vite’s WebSocket connection is attached to the host HTTP server.
Closing one configured development environment leaves stylesheet loading and
updates available in the remaining environments. An initialized replacement can
stay idle while the other environments close, then load styles when needed.
With per-environment start/end hooks enabled, existing Sass partials continue
updating as other environments start.
The plugin array can also be reused across concurrent Vite roots. Each resolved
configuration keeps its own stylesheet, manifest, and rendering state; restarting
or closing one development server leaves the others available. Client and SSR
builds retain their own configured asset bases.

Pre-render and progressive builds and development CSS entries support qualified
local imports whose descendants retain external imports. The browser applies the
original layer, supports, and media conditions to the delivered child stylesheets.
Development entries serve retained child CSS and resources under the configured
base. Loading an entry normally and through SSR `?inline` shares its source identity.
In pre-render mode, changing the project manifest reloads the page to refresh
server-rendered rules; progressive mode applies the update through its runtime.
Native-only CSS edits do not require a manifest reload.
Editing a retained development CSS child or an image resource updates connected
pages without reloading them. Resource filenames can include percent-encoded
spaces, Unicode, `#`, `?`, and `%`, while separate query strings and fragments
retain their meaning. Resources respect the original file's `server.fs.deny`.
Previously published CSS and resource URLs retain their contents until their
server context closes, including URLs held by SSR inline CSS consumers. Closing
another root that uses the same plugin array, or closing the SSR environment,
leaves the remaining client's resource delivery available. Retained versions use
server memory and temporary files until that context closes.
Each development resource version uses the same captured bytes for its URL and
published contents, even when the source is replaced or deleted before the CSS
is delivered. Deleting a referenced resource reports a development compilation
error while previously published versions remain readable. Restoring the resource
updates connected pages and dismisses the error overlay without reloading them.
An initialized replacement environment can remain idle while the old environment,
client, and SSR environments close, then load new retained graphs and receive
child stylesheet updates. This works with either value of
`server.perEnvironmentStartEndDuringDev`.
Restarting a standalone or middleware development server releases the previous
context's resource copies. Connected pages reload and reconnect to new asset URLs;
subsequent child CSS and image edits update without another page reload.
Local stylesheets compile imported local rules and retain qualified child imports
and resources in development and production builds. This also applies when the
root and intermediate stylesheets contain only native CSS, and `@compose` appears
only in an imported descendant. These graphs remain local stylesheets rather than
becoming project entries or native CSS pruning roots.
CSS Modules keep the root module's scoped exports; SSR inline requests return
compiled CSS, and raw requests retain the authored source. Child CSS and resource
edits update connected development pages; CSS Module consumers need the HMR
handling described below to retain page state. Production inline
strings publish their retained assets as well. Local entries keep their positions
within the built stylesheet, and content-based asset names are independent of
asynchronous entry registration order.
Local CSS and Sass imported through `?url` deliver their compiled stylesheet
and retained child assets. When that URL is attached as a stylesheet link,
editing a retained CSS child or its image updates the styles without reloading
the page, including when only an imported descendant contains `@compose`.
CSS Modules that import local CSS files expose the imported classes through the
root module's exports, with the same scope as its own classes. Imports retain their
conditions and layers, and relative resources keep their original file's directory.
Shared inputs retain each importing root's scope; identical CSS files in different
directories retain their own resource paths. This applies in development and builds.
Imported SCSS and indented Sass files also keep the root module's scope when
different source files compile to identical CSS. Each file retains its own resource
directory, and processing the import graph does not repeat its `additionalData`
callback. String values and callbacks that return source maps are supported.
Consumers must accept CSS Module updates, directly or through their framework's
HMR handling, to apply changed exported names without reloading the page.
Relative CSS `@reference` directives emitted from Sass partials resolve from the
mapped partial's directory, including through CSS Modules. Referenced definitions
retain their own image and font bases.
Stylesheet URLs emitted for CSS Modules also support direct CSS requests through
`?direct` or a CSS Accept header. They retain Vite's base and original-file access
policy, including allowed directories and denied files. A supplied map that cannot identify an
original filesystem source produces an error.

During development, local CSS and Sass compositions retain their attempted CSS
reference dependencies after a compilation error. Creating a missing reference
retries its consumers; a failed initial page load reloads after compilation succeeds.
Deleting and restoring a reference after a successful load updates the stylesheet
through HMR. Once a local stylesheet removes a reference, later changes to that
reference no longer invalidate the stylesheet.
With default build-watch filters, creating a reference missing at startup retries
failed CSS and Sass compilations, including managed entries and pre-rendering.
Failed builds recheck dependency metadata and use an owned cache file to request
host rebuilds. Successful compilation stops these checks; closing the watcher
releases its recovery files. Custom watch filters that exclude the cache trigger
can still prevent recovery and require further integration.
Managed stylesheet entries also retain resource dependencies after a compilation
error. Manifest-loading errors remain visible until their dependencies are repaired.
Failed development transforms also recheck dependency metadata every 100 ms, so
changes missed while filesystem watches are being registered can recover. These
checks stop after successful compilation or environment closure and respect
Vite watch exclusions and disabled watching. Unchanged failures are not retried;
new compilation errors update the development error overlay.

Diagnostics for imported CSS and Sass use their original files and source maps,
including Sass partials and mapped `additionalData`. Imported Sass is preprocessed
once per prepared Module graph; temporary map data is removed before CSS delivery.
Interpolation can identify an originating segment without an exact token range.
When a callback changes source without supplying a map, diagnostics explicitly
identify a preprocessed location instead of inventing an original Sass position.
Root-relative public CSS URLs that already include Vite's `base` can fail during
Vite Modules preprocessing. Virtual sources and retained-graph Sass edge cases
still require further validation.

Missing CSS Modules composition recovery, other development request modes, other preprocessors
and user PostCSS transformations still require integration and validation.

For production graph delivery, an alias or custom resolver pointing to project
CSS follows the project's native CSS pruning policy. A bare-looking import name
alone does not make the file package CSS: the resolved file must belong to the
named package. Package export conditions may select another CSS file within that
package while retaining its native rules. `@preserve native;` explicitly keeps
project-native rules regardless of class usage.

In development, a missing or invalid project manifest keeps the server available to report the original error over HTTP. Fixing its watched CSS imports or references reloads the page, including failures before the first module request. Pre-rendering does not serve a previous manifest while the current one is invalid. Production builds still fail on manifest errors. Loaded manifest modules recover through Vite HMR and its existing acceptance boundaries. Closing an environment cancels its pending manifest recovery without discarding a renderer still used by another environment.

## Runtime input imports

The plugin exposes canonical project-level runtime input modules:

```ts
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
```

Use these virtual modules when application code should receive the same manifest graph and emittedGlobals global CSS state that the plugin discovered from the project CSS entry.

In production `runtime` mode, the plugin modulepreloads the emitted manifest JSON module when it injects its private runtime bootstrap. Applications that need manual startup should import `MasterCSSRuntime` from `@master/css-runtime` and use these virtual inputs; the bootstrap itself is intentionally not a public subpath.

## Options

Pass the `options` object to `masterCSS(options)`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enables the integration. Use `false` to disable it. |
| `mode` | `'runtime' \| 'static' \| 'progressive' \| 'pre-render'` | `'runtime'` | Integration rendering mode. |
| `scanner` | `MasterCSSScannerConfiguration` | `{}` | Class usage scanning configuration. |
| `runtime` | `boolean \| { enabled?: boolean; avoidFOUC?: boolean }` | `{ enabled: true, avoidFOUC: true }` | Runtime injection and FOUC behavior. |

See the [Vite installation guide](https://rc.css.master.co/guide/installation/vite) for a full project setup.
