<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b><!-- name -->CSS<!----></b>
</p>
<p align="center"><!-- package.description -->A Virtual CSS language with enhanced syntax. ~13KB<!----></p>

[![MIT License](https://flat.badgen.net/github/license/master-co/css?color=yellow)](https://github.com/master-co/css/blob/main/LICENSE)
[![Latest Release](https://flat.badgen.net/npm/v/@master/css?icon=npm&label&color=yellow)](https://www.npmjs.com/package/@master/css)
[![Bundle Size](https://flat.badgen.net/bundlephobia/minzip/@master/css?icon=packagephobia&label&color=yellow)](https://bundlephobia.com/package/@master/css 'gzip bundle size (including dependencies)')
[![Package Size](https://flat.badgen.net/badgesize/brotli/https://cdn.jsdelivr.net/npm/@master/css?icon=jsdelivr&label&color=yellow)](https://unpkg.com/@master/css 'brotli package size (without dependencies)')
[![Documentation](https://flat.badgen.net/badge/icon/Documentation?icon=awesome&label&color=yellow)](https://css.master.co)
[![Github](https://flat.badgen.net/badge/icon/master-co%2Fcss?icon=github&label&color=yellow)](https://github.com/master-co/css)
[![Discord](https://flat.badgen.net/badge/icon/discord?icon=discord&label&color=yellow)](https://discord.gg/sZNKpAAAw6)
[![CI](https://flat.badgen.net/github/status/master-co/css/main/ci/circleci?icon=circleci)](https://circleci.com/gh/master-co/workflows/css/tree/main)

</div>

![image](https://raw.githubusercontent.com/master-co/css-language-service/alpha/images/cover.jpg)

- Visit [css.master.co](https://css.master.co) for full documentation.
- Browse our [discussion community](https://github.com/master-co/css/discussions).
- Join our [discord channel](https://discord.gg/sZNKpAAAw6).
- Follow our [twitter](https://twitter.com/mastercorg).

##### On this page

- [Features](#features)
- [Why Master CSS](#why-master-css)
- [Quick Start](#quick-start)
- [Developer Tools](#developer-tools)
- [Inspiration](#inspiration)
- [Related](#related)

# Features
Let's have a quick overview of the **groundbreaking features** of Master CSS:

- 🔥 A whole new **CSS language** instead of utilities/libraries.
- 🔓 Write CSS properties, functions, selectors and even media queries directly in `class="..."`.
- 🧠 Automatically generate corresponding CSS rules based on class names.
- 💖 With enhanced CSS syntax, you can **build UIs with less code**.
- ⚡️ Directly use **performant JIT in production**. **~13KB**
- 🧬 [An enhanced and structured CSS syntax](https://docs.master.co/css/syntax-tutorial) for class names.
- 🌈 [A forerunner to syntax highlighting](https://docs.master.co/css/why-master-css#a-forerunner-to-syntax-highlighting) for class names.
- ✨ [Hybrid Rendering](https://docs.master.co/css/hybrid-rendering) that allows you to **pre-generate CSS from HTML on the server side**, and then continue to **use JIT on the client side**.
- ✨ [Group Styles](https://docs.master.co/css/syntax-tutorial#group-styles) that allows you to extract the same selectors and media query styles and make it short.
- ✨ [Reactive Styles](https://docs.master.co/css/syntax-tutorial#style-an-element-based-on-target-state) that allows you to style an element based on parent/sibling state.

To learn more, check out the [documentation](https://docs.master.co/css/why-master-css).

# [Why Master CSS](https://docs.master.co/css/why-master-css)
A brief introduction starts by giving you an understanding of **markup-driven CSS**.

😐 Traditional
```html
<style>
    .home-section {
        background-color: blue;
        padding: 2rem;
        text-align: center;
    }

    .home-section:hover {
        background-color: red;
    }

    @media (min-width: 1024px) {
        .home-section {
            padding: 3rem;
        }
    }
</style>

<section class="home-section">...</section>
```
🤩 Now, refactor it with a whole new CSS language to make it easier. ↓ 86% code
```html
<section class="bg:blue bg:red:hover p:32 p:48@md text:center">...</section>
```
To learn more, check out the [Why Master CSS](https://docs.master.co/css/why-master-css) documentation.

# Quick Start
This is a quick start guide, check out the [full setup guide](https://docs.master.co/css/setup) to integrate with your build tools and frameworks.

```shell
npm install @master/css
```
```js
import '@master/css';
```
or use a CDN
```html
<script src="https://cdn.master.co/css"></script>
```
Now, start styling HTML with Master CSS. 🎉
```html
<h1 class="font:40 font:heavy italic m:50 text:center">Hello World</h1>
```
To learn more, check out the [Syntax tutorial](https://docs.master.co/css/syntax-tutorial) documentation.

# Developer Tools
- [Master CSS Language Service](https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service) - A Visual Studio Code extension for Master CSS. Provides code-completion and syntax highlighting.

# Inspiration
Some of our core concepts and designs are inspired by these giants.
- __Language__ - Master is a language, but it was originally inspired by [ACSS](https://acss.io/)'s concept of atomic classes.
- __Virtual CSS__ - Difference algorithms, virtual models, etc. are inspired by  [Virtual DOM](https://reactjs.org/docs/faq-internals.html).

# Related
- [@master/normal.css](https://github.com/master-co/normal.css) - Normalize browser's styles. ~1KB
- [@master/keyframes.css](https://github.com/master-co/keyframes.css) - Simple and useful CSS keyframes. ~0.4KB
- [@master/style-element.react](https://github.com/master-co/style-element.react) - Quickly create styled React elements with conditional class names. ~800B