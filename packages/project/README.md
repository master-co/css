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
<p align="center">Utilities for loading and serializing Master CSS manifest CSS resources</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-project">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-project?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-project?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-project?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install @master/css-project
```

`@master/css-project` is the shared project manifest boundary for CLI commands, ESLint, language tooling, and build integrations such as Vite, Next.js, Webpack, and Nuxt.

It discovers project CSS entries and Master CSS workspace roots, then delegates CSS parsing, import graph resolution, and manifest compilation to `@master/css-compiler`. JavaScript and TypeScript config files are intentionally unsupported.

Project entry discovery only treats CSS files with top-level `@master entry;` or `@import '@master/css'` as entries. Imported `@settings`, `@theme`, and `@custom-variant` directives participate in the entry graph, but they are not independent project entries.

## Load project manifest

Use `loadProjectManifest()` when a tool should load the canonical project-level manifest for a directory.

```ts
import { loadProjectManifest, loadProjectManifestJSON } from '@master/css-project/manifest'

const result = await loadProjectManifest('/project')
const jsonResult = await loadProjectManifestJSON('/project')
```

`loadProjectManifest()` discovers project CSS entries unless explicit `entries` are passed. It returns the compiled manifest and dependency list. `loadProjectManifestJSON()` returns JSON source for virtual JSON modules and loader output.

```ts
import { loadProjectManifestSync, loadProjectManifestJSONSync } from '@master/css-project/manifest-sync'

const result = loadProjectManifestSync('/project')
const jsonResult = loadProjectManifestJSONSync('/project')
```

## Load explicit CSS resources

Use `loadManifest()` when the CSS resource path is already known and should be compiled directly.

```ts
import { loadManifest, loadManifestJSON } from '@master/css-project/manifest'

const result = await loadManifest('/project/src/index.css')
const jsonResult = await loadManifestJSON('/project/src/index.css')
```

`loadManifest()` and `loadManifestJSON()` only accept CSS resources. They do not search the workspace and do not load JavaScript or TypeScript config files.

```ts
import { loadManifestSync, loadManifestJSONSync } from '@master/css-project/manifest-sync'

const result = loadManifestSync('/project/src/index.css')
const jsonResult = loadManifestJSONSync('/project/src/index.css')
```

## Discover entries and workspaces

Use `@master/css-project/entries` when tooling needs the same project entry and workspace discovery rules without loading a manifest.

```ts
import {
    findCSSManifestEntryFiles,
    findMasterCSSWorkspaceDirectories,
    hasMasterCSSManifestEntrypoint,
} from '@master/css-project/entries'
```

`findCSSManifestEntryFiles(projectDir)` searches CSS files for entry markers. `findMasterCSSWorkspaceDirectories(rootDir)` creates workspace roots from discovered CSS entries and `package.json` files that declare Master CSS package dependencies.

## Manifest modules

The module utilities define the manifest import contract used by official integrations. They live in `@master/css-integration`; `@master/css-project` owns loading and discovery.

| API | Purpose |
| --- | --- |
| `VIRTUAL_MANIFEST_ID` | Default manifest JS facade module id, `virtual:master-css-manifest`. |
| `VIRTUAL_EMITTED_GLOBALS_ID` | Default emittedGlobals module id, `virtual:master-css-emitted-globals`. |
| `MASTER_CSS_MANIFEST_QUERY` | Query suffix, `?master-css-manifest`, used to compile one explicit CSS resource. |
| `toManifestJSON(manifest)` | Serializes a manifest object into normalized JSON source. |
| `toEmittedGlobalsModule(emittedGlobals)` | Serializes emittedGlobals variable and animation counts into an ESM default export. |
| `toVirtualDefaultManifestModulePath(context)` | Creates the virtual path for the default manifest module. |
| `toVirtualCSSManifestModulePath(context, file)` | Creates a virtual path for one explicit queried CSS resource. |

Use `virtual:master-css-manifest` and `virtual:master-css-emitted-globals` when application code should receive an integration's canonical project-level runtime inputs. Use `./index.css?master-css-manifest` only when the code intentionally compiles one explicit CSS resource through the active integration.
