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
<p align="center">A markup-driven CSS language with enhanced syntax</p>

<p align="center">
    <a aria-label="GitHub release (latest by date including pre-releases)" href="https://github.com/master-co/css/releases">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=212022&label=&style=for-the-badge&logo=github&logoColor=fff">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github&logoColor=%23000">
            <img alt="NPM Version" src="https://img.shields.io/github/v/release/master-co/css?include_prereleases&color=f6f7f8&label=&style=for-the-badge&logo=github">
        </picture>
    </a>
    <a aria-label="NPM Package" href="https://www.npmjs.com/package/@master/css">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/npm/dm/@master/css?color=212022&label=%20&logo=npm&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/npm/dm/@master/css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
            <img alt="NPM package ( download / month )" src="https://img.shields.io/npm/dm/@master/css?color=f6f7f8&label=%20&logo=npm&style=for-the-badge">
        </picture>
    </a>
    <a aria-label="JSDelivr" href="https://www.jsdelivr.com/package/npm/@master/css">
        <picture>
            <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=212022&label=%20&logo=jsdelivr&style=for-the-badge">
            <source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
            <img alt="JSDelivr hits (npm scoped)" src="https://img.shields.io/jsdelivr/npm/hm/@master/css?color=f6f7f8&label=%20&logo=jsdelivr&style=for-the-badge">
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

## Documentation
Visit [beta.css.master.co](https://beta.css.master.co) to view the full documentation

## Getting Started
Check out the [official guides](https://beta.css.master.co/docs) to get started with Master CSS, or walk through the [examples](https://github.com/master-co/css/tree/beta/examples) for a quick overview of integrating with your framework.

## Compilation Modes
Master CSS provides various [compilation modes](https://beta.css.master.co/docs/compilation), allowing you to choose according to the characteristics and needs of different projects.

- [Progressive Rendering](https://beta.css.master.co/docs/compilation/progressive-rendering) - Scan the requested HTML on the server side, generate CSS rules, and enable runtime-rendering compilation on the browser side
- [Runtime Rendering](https://beta.css.master.co/docs/compilation/runtime-rendering) - Observe the DOM tree, manipulate CSS rules according to the changed class name, and synchronize to the running style sheet at runtime
- [Static Extraction](https://beta.css.master.co/docs/compilation/static-extraction) - Scan source files for class names at build time, extract class names, and generate CSS files/virtual modules, then import them in the entry file

## Ecosystem
We've built various Master CSS core functionality/integration packages:

- [CSS](https://github.com/master-co/css/tree/beta/packages/css) - The core of Master CSS, including the runtime engine

##### Frameworks
- [React](https://github.com/master-co/css/tree/beta/packages/react) - Integrate Master CSS the React way
- [Svelte](https://github.com/master-co/css/tree/beta/packages/svelte) - Integrate Master CSS the Svelte way
- [Vue](https://github.com/master-co/css/tree/beta/packages/vue) - Integrate Master CSS the Vue.js way

##### Progressive Rendering
- [Renderer](https://github.com/master-co/css/tree/beta/packages/renderer) - Pre-renders and injects HTML-required CSS
- [Nitro Server](https://github.com/master-co/css/tree/beta/packages/server.nitro) - Integrate Master CSS Pre-rendering the Nitro way

##### Static Extraction
- [Extractor](https://github.com/master-co/css/tree/beta/packages/extractor) - Master CSS static extractor for various raw text extraction.
- [Vite](https://github.com/master-co/css/tree/beta/packages/extractor.vite) - Integrate Master CSS Static Extraction in Vite way
- [Webpack](https://github.com/master-co/css/tree/beta/packages/extractor.webpack) - Integrate Master CSS Static Extraction in Webpack way

##### Validation
- [Validator](https://github.com/master-co/css/tree/beta/packages/validator) for Master CSS class syntax

##### Language
- [Server](https://github.com/master-co/css/tree/beta/packages/language-server) - The core of the Master CSS language server
- [Service](https://github.com/master-co/css/tree/beta/packages/language-service) - The core of the Master CSS language service
- [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service) - Master CSS Language Service for Visual Studio Code Extension

##### Others
- [Normal CSS](https://github.com/master-co/css/tree/beta/packages/normal.css) - Normalize the browser's styles
- [Theme Service](https://github.com/master-co/css/tree/beta/packages/theme-service) - A CSS theme-switching service for Master CSS
- [🚧 Class Variant](https://github.com/master-co/css/tree/beta/packages/class-variant) - Create reusable, extensible, and customizable style class variants
- 🚧 Resolve Class - Conditionally apply classes and trim it to a non-wrap string

## Community
The Master CSS community can be found here:

- [Discuss on GitHub](https://github.com/master-co/css/discussions) - Ask questions, voice ideas, and do any other discussion
- [Join our Discord Server](https://discord.com/invite/sZNKpAAAw6) - Casually chat with other people using the language <sup><sub>✓ 中文</sub></sup>

<sub>Our [《 Code of Conduct 》](https://github.com/master-co/css/blob/main/CODE_OF_CONDUCT.md) applies to all Master CSS community channels.</sub>

## Contributing
Please see our [CONTRIBUTING](https://github.com/master-co/css/blob/beta/.github/CONTRIBUTING.md) for workflow.

## Inspiration
Some of the core concepts and designs are inspired by these giants.
- The concept of enhanced syntax is inspired by [SASS](https://sass-lang.com/) and [TypeScript](https://www.typescriptlang.org/)
- The concept of Virtual CSS is inspired by the [Virtual DOM](https://reactjs.org/docs/faq-internals.html)
