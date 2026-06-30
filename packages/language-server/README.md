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
<p align="center">Language Server for Master CSS</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-language-server">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-language-server?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-language-server?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-language-server?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
        </picture>
    </a>
    <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css-language-server">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-server?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-server?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
            <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-server?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
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
npm install @master/css-language-server
```

## Usage

```js
import CSSLanguageServer from '@master/css-language-server'

const languageServer = new CSSLanguageServer(connection, customSettings)
```

`CSSLanguageServer` wraps `@master/css-language-service` with LSP workspace lifecycle, completion, hover, document color, color presentation, semantic token, and directive formatting handlers.

Diagnostics are intentionally limited to language-server-owned behavior: CSS directive diagnostics, project manifest loading diagnostics, and optional basic class syntax diagnostics. Class policy rules such as sorting, canonical class preference, conflict detection, and raw-value approval are owned by `@master/eslint-plugin-css`.

## Semantic tokens

The language server supports full-document and active-position semantic tokens.

| `embeddedSyntaxHighlighting` | Behavior |
| --- | --- |
| `always` | Advertises the standard LSP `semanticTokensProvider` and handles `textDocument/semanticTokens/full`. |
| `active` | Uses the VS Code extension request for active class-context highlighting. |
| `off` | Disables embedded utility highlighting. |

CSS directive syntax is highlighted by the shared TextMate grammar. Server semantic tokens cover Master CSS class-list spans and directive class-list spans such as `@compose` and `@safelist`.

## Formatting

The server advertises `documentFormattingProvider` and `documentRangeFormattingProvider` when `formatDirectives` is enabled. Formatting returns directive-only edits for CSS, SCSS, and LESS documents, plus CSS-family `<style>` blocks in Vue, Svelte, and Astro documents.

Directive formatting normalizes safe directive spacing and repairs class-list important markers such as `bg:transparent !` to `bg:transparent!`. It does not run the compiler and does not change generated CSS output.

## Settings

```js
import { settings } from '@master/css-language-server'
```

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `workspaces` | `FastGlobPattern[] \| 'auto'` | `'auto'` | Workspace roots where independent language services are created. The root workspace is always included. |
| `verbose` | `boolean` | `false` | Print server logs. |
| `formatDirectives` | `boolean` | `true` | Enables LSP document and range formatting for Master CSS directives. |
| `diagnoseClassSyntax` | `boolean` | `false` | Enables basic class syntax diagnostics. ESLint remains the default owner for class policy diagnostics and sorting. |
| `embeddedSyntaxHighlighting` | `'active' \| 'always' \| 'off'` | `'active'` | Inherited language-service semantic token mode. |

With `workspaces: 'auto'`, the server creates workspaces from CSS files importing `@master/css`, CSS files containing the lightweight `@master entry;` marker, and `package.json` files that declare Master CSS package dependencies.
