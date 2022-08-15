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

- [Introduction](https://css.master.co)
- [Setup](https://docs.master.co/css/setup)
- [Why Master CSS](https://docs.master.co/css/why-master-css)
- [Github Discussions](https://github.com/master-co/css/discussions)
- [Join Master Discord](https://discord.gg/sZNKpAAAw6)

##### On this page

- [Quick Start](#quick-start)
  - [1. Download](#1-download)
  - [2. Import](#2-import)
  - [Hello World](#hello-world)
- [Original Design](#original-design)
- [Inspiration](#inspiration)
- [Related](#related)

# Quick Start
This is just a quick start guide, the official [documentation](https://docs.master.co/styles/setup) here.

## 1. Download
```shell
npm install @master/css
```
Or use a CDN
```html
<script src="https://cdn.jsdelivr.net/npm/@master/css"></script>
```

## 2. Import
```js
import '@master/css'
```

## Hello World
```html
<h1 class="font:40 font:heavy bg:blue:hover m:50 text:center@md">
    Hello World
</h1>
```
Next, learn the common [Syntax - Master CSS](https://docs.master.co/styles/syntax)!

# Original Design
- __Master CSS Syntax__: As a whole new language, Master created our own unique syntax.
- __Class Highlight__: Master is the first language to highlight class names in markup.
- __Hybrid Rendering__: Apply both JIT and AOT to CSS compilation. Similar to [Hydration](https://en.wikipedia.org/wiki/Hydration_(web_development)) technology.
- __Group Styles__ ─ the one of groundbreaking features that allows you to extract the same selectors and media query styles and make it short. Inspired by [SerKo](https://github.com/serkodev).
- __Reactive Styles__ ─ the one of groundbreaking features that allows you style an element based on parent/sibling state.
- __Arbitrary selectors and media queries__: Apply arbitrary selectors and media queries directly in class="", which is the most powerful and comprehensive language on the market.

# Inspiration
Some of our core concepts and designs are inspired by these giants.
- __Language__: Master is a language, but it was originally inspired by [ACSS](https://acss.io/)'s concept of atomic classes.
- __Virtual CSS__: Difference algorithms, virtual models, etc. are inspired by  [Virtual DOM](https://reactjs.org/docs/faq-internals.html).

# Related
- [Master CSS Language Service](https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service) - A Visual Studio Code extension for Master CSS. Provides code-completion and syntax highlighting.
- [@master/normal.css](https://github.com/master-co/normal.css) - Normalize browser's styles. ~1KB
- [@master/keyframes.css](https://github.com/master-co/keyframes.css) - Simple and useful CSS keyframes. ~0.4KB
- [@master/style-element.react](https://github.com/master-co/style-element.react) - Quickly create styled React elements with conditional class names.