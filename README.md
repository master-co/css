<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b><!-- name -->CSS<!----></b>
</p>
<p align="center"><!-- package.description -->A Virtual CSS language with enhanced syntax. ( ~13KB )<!----></p>

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
- [Why](https://docs.master.co/css/why)

# Quick Started
This is just a quick start guide, the full official [documentation](https://docs.master.co/styles/setup) here.
## Setup
The `normal.css` is an optional official package.
```bash
npm install @master/css @master/normal.css
```
import `@master/css` into your main js file
```js
import '@master/css'
```
import `@master/normal.css` into your global css file
```css
@import '@master/normal.css'
```
or use CDNs
```html
<link href="https://cdn.jsdelivr.net/npm/@master/normal.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@master/css"></script>
```

## Hello World
```html
<h1 class="font:40 font:heavy bg:blue:hover m:50 text:center@md">
    Hello World
</h1>
```

# Community
- [Github Discussions](https://github.com/master-co/css/discussions)
- [Join Master Discord](https://discord.gg/sZNKpAAAw6)

# Language Service

A [Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service) for [Master CSS](https://github.com/master-co/css). Provides code-completion and syntax highlighting.