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
<p align="center">Language Service for Master CSS</p>

<p align="center">
  <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
      <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
    </picture>
  </a>
  <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css-language-service">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css-language-service?color=212022&label=%20&logo=npm&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css-language-service?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
      <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css-language-service?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
    </picture>
  </a>
  <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css-language-service">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-service?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
      <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-service?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
      <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css-language-service?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
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
npm install @master/css-language-service
```

## Usage

```js
import CSSLanguageService from '@master/css-language-service'

const languageService = new CSSLanguageService(customSettings)
```

`CSSLanguageService` provides stateful completion, hover, color, color presentation, and semantic token features around the editor-neutral primitives in `@master/css-language`.

### Semantic tokens

```ts
const semanticTokens = languageService.renderSemanticTokens(textDocument)
```

Semantic tokens are generated with the project manifest, so custom variables, components, utilities, modes, and other manifest-dependent tokens can be classified after the caller loads the manifest.

Use `renderSemanticTokensAtPosition()` when a client wants active-only highlighting for the embedded class context at the current editor position.

```ts
const semanticTokens = languageService.renderSemanticTokensAtPosition(textDocument, position)
```

CSS directive syntax in CSS-family documents is highlighted by the shared TextMate grammar. Semantic tokens are only added for directive class-list spans such as bare `@compose` preludes and quoted `@safelist` strings.

### Directive formatting

```ts
const edits = languageService.formatDirectives(textDocument)
```

Directive formatting returns LSP text edits for Master CSS directive source. It supports CSS, SCSS, and LESS documents, plus CSS-family `<style>` blocks in Vue, Svelte, and Astro documents. The formatter repairs directive class-list important markers such as `bg:transparent !` to `bg:transparent!` and does not change compiler semantics or generated CSS.

Pass an LSP range as the second argument for range formatting:

```ts
const edits = languageService.formatDirectives(textDocument, range)
```

## Settings

```js
import { settings } from '@master/css-language-service'
```

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `includedLanguages` | `string[]` | Common web and template languages | Language IDs that receive language-service features. |
| `exclude` | `string[]` | `["**/.git/**", "**/node_modules/**", "**/.hg/**"]` | Glob patterns excluded from all features. |
| `classAttributes` | `string[]` | `["class", "className"]` | Quoted markup attributes that contain Master CSS class strings. |
| `classAttributeBindings` | `Record<string, [string, string] \| false>` | Framework binding defaults | Bound attributes such as `:class`, `[ngClass]`, and `class:list`. |
| `classFunctions` | `string[]` | Common class helpers | Functions and methods whose string arguments contain classes, such as `clsx()` and `classList.add()`. |
| `classDeclarations` | `string[]` | `[]` | Variable declarations or object properties whose string values contain classes. |
| `suggestSyntax` | `boolean` | `true` | Enables syntax suggestions. |
| `inspectSyntax` | `boolean` | `true` | Enables hover inspection and generated CSS previews. |
| `renderSyntaxColors` | `boolean` | `true` | Enables color rendering. |
| `editSyntaxColors` | `boolean` | `true` | Enables color editing. |
| `formatDirectives` | `boolean` | `true` | Enables Master CSS directive formatting. |
| `embeddedSyntaxHighlighting` | `'active' \| 'always' \| 'off'` | `'active'` | Controls embedded semantic token highlighting. |

Use `@master/css-language` directly for browser helpers, Shiki integration, TextMate grammar assets, and raw class-position scanning.
