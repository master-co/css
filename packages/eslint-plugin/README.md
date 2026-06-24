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
<p align="center">An ESLint plugin enforcing a consistent coding style for Master CSS</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/eslint-plugin-css">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/eslint-plugin-css?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/eslint-plugin-css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/eslint-plugin-css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
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
npm install -D @master/eslint-plugin-css
```

The recommended config is also available through `@master/eslint-config-css`.

## Usage

Use ESLint flat configuration:

```js
import css from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.html'],
        languageOptions: {
            parser: htmlParser
        }
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser
        }
    },
    css,
    {
        rules: {
            '@master/css/no-invalid-classes': ['error', {
                disallowUnknownClass: true
            }]
        }
    }
]
```

## Rules

### `@master/css/sort-classes`

Sorts Master CSS classes into a consistent and logical order.

```js
export default [
    {
        rules: {
            '@master/css/sort-classes': 'warn'
        }
    }
]
```

### `@master/css/no-invalid-classes`

Disallows invalid Master CSS classes.

```js
export default [
    {
        rules: {
            '@master/css/no-invalid-classes': 'error'
        }
    }
]
```

Set `disallowUnknownClass: true` to reject classes that do not match the active manifest:

```js
export default [
    {
        rules: {
            '@master/css/no-invalid-classes': ['error', {
                disallowUnknownClass: true
            }]
        }
    }
]
```

### `@master/css/prefer-canonical-classes`

Prefers canonical Master CSS class forms, including semantic utilities, theme tokens, and property aliases.

```js
export default [
    {
        rules: {
            '@master/css/prefer-canonical-classes': 'warn'
        }
    }
]
```

For example, this rule can fix `text-align:center` to `text-center`, `font:16px` to `font:md`, and `margin:md` to `m:md`.

You can disable specific canonicalization families:

```js
export default [
    {
        rules: {
            '@master/css/prefer-canonical-classes': ['warn', {
                preferStaticUtilities: true,
                preferThemeTokens: true,
                preferPropertyAliases: true
            }]
        }
    }
]
```

### `@master/css/no-conflicting-classes`

Disallows classes that emit the same CSS declaration for the same variant.

```js
export default [
    {
        rules: {
            '@master/css/no-conflicting-classes': 'warn'
        }
    }
]
```

## Settings

Settings live under the `@master/css` settings key:

```js
export default [
    {
        settings: {
            '@master/css': {
                classAttributes: ['class', 'className'],
                classFunctions: ['clsx', 'classList.add'],
                classDeclarations: ['classes'],
                ignoredKeys: ['compoundVariants', 'defaultVariants'],
                manifest
            }
        }
    }
]
```

| Setting | Type | Description |
| --- | --- | --- |
| `classAttributes` | `string[]` | Element attributes containing class strings. |
| `classFunctions` | `string[]` | Function names whose arguments should be checked. |
| `classDeclarations` | `string[]` | Variable/member names whose declarations should be checked. |
| `ignoredKeys` | `string[]` | Object keys ignored during checking. Defaults include variant metadata keys. |
| `manifest` | `MasterCSSManifest` | Explicit compiled manifest. By default, ESLint loads the project CSS entry discovered from the current working directory. |

## Related docs

See the [code linting guide](https://rc.css.master.co/guide/code-linting) for setup guides across frameworks and editors.

## Credits
This plugin is heavily inspired by the awesome [eslint-plugin-tailwindcss](https://github.com/francoismassart/eslint-plugin-tailwindcss). We want to thank for their initial work, which served as the foundation for this project. While significant modifications have been made, the core ideas and concepts from A Plugin have been instrumental in developing this plugin.
