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
<p align="center">Webpack plugin for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-webpack">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-webpack?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-webpack?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-webpack?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install @master/css-webpack
```

## Usage

```js
import MasterCSSPlugin from '@master/css-webpack'

export default {
  plugins: [
    new MasterCSSPlugin()
  ]
}
```

When `output.filename` is fixed, uses only a build-wide hash, or is a callback,
the injected runtime entry uses its own content-hashed file under `_master-css/`.
Application filenames retain their configured behavior. Chunk-specific templates
such as `[name].js` or `[contenthash].js` also apply to the runtime entry.

## Client types

Add the client type reference when TypeScript source files import `virtual:master-utilities.css`, `virtual:master-css-manifest`, `virtual:master-css-emitted-globals`, or `?master-css-manifest` modules:

```ts
/// <reference types="@master/css/client" />
```

## Stylesheet entry

Import the default stylesheet from your application CSS so the plugin can replace it with generated Master CSS:

```css
@import '@master/css';
```

The Webpack plugin uses `MasterCSSScanner` from `@master/css-tooling/scanner/node` for source scanning and writes generated CSS through virtual modules.

For production builds with `mode: 'static'` that emit CSS assets, the plugin
preserves imported stylesheet boundaries and emits the required CSS fragments
and resources beside the host CSS asset. Deploy these emitted files together.
Changes to imported CSS or resource contents participate in the entry CSS
content hash.
Each emitted resource uses the same captured bytes for its filename and contents.
Later builds read a fresh snapshot, including changes made during publication.

In production static watch builds, missing imported CSS or resources are
reported as compilation errors. Restoring those files triggers a new build.
Removing a managed stylesheet entry also releases its unused graph dependencies.
Watch builds reconcile the current module graph, including cached modules when
an import is restored. Shared resources and separately loaded project manifest
dependencies remain watched while they still have an active owner.
Each production static stylesheet keeps its own position in the host CSS chunk.
Separate entrypoints and lazy chunks receive their own native stylesheet graphs
and resources; lazy native styles take effect when their CSS chunk is loaded.

See the [Webpack installation guide](https://rc.css.master.co/guide/installation/webpack) for a complete project setup.
