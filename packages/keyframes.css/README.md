<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b><!-- name -->@master/keyframes.css<!----></b>
</p>
<p align="center"><!-- package.description -->Simple and useful CSS keyframes. ~0.4KB<!----></p>
<p align="center">
<!-- badges.map((badge) => `\n[![${badge.alt}](${badge.src})](${badge.href})`).join('&nbsp;')-->

[![MIT License](https://flat.badgen.net/github/license/master-co/keyframes.css?color=yellow)](https://github.com/master-co/css/blob/main/LICENSE)
[![Latest Release](https://flat.badgen.net/npm/v/@master/keyframes.css?icon=npm&label&color=yellow)](https://www.npmjs.com/package/@master/keyframes.css)
[![Bundle Size](https://flat.badgen.net/bundlephobia/minzip/@master/keyframes.css?icon=packagephobia&label&color=yellow)](https://bundlephobia.com/package/@master/keyframes.css 'gzip bundle size (including dependencies)')
[![Package Size](https://flat.badgen.net/badgesize/brotli/https://cdn.jsdelivr.net/npm/@master/keyframes.css?icon=jsdelivr&label&color=yellow)](https://unpkg.com/@master/keyframes.css 'brotli package size (without dependencies)')
[![Github](https://flat.badgen.net/badge/icon/master-co%2Fkeyframes.css?icon=github&label&color=yellow)](https://github.com/master-co/keyframes.css)
[![CI](https://flat.badgen.net/github/status/master-co/keyframes.css/main/ci/circleci?icon=circleci)](https://circleci.com/gh/master-co/workflows/keyframes.css/tree/main)
<!-- -->
</p>
</div>

```css
@keyframes fade {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

...
```

###### CONTENTS

- [Documentation](#documentation)
- [Feature](#feature)
- [Install](#install)
- [Import](#import)
- [CDN](#cdn)
- [Related](#related)

# Documentation
[Animation - Master CSS](https://docs.master.co/css/animation)

# Feature
- fade
- ping
- flash
- heart
- jump
- pulse
- rotate
- shake
- zoom
- float

[View the source code](https://github.com/master-co/keyframes.css/tree/main/src)

# Install
```sh
npm install @master/keyframes.css
```

# Import
Import all keyframes at once.
```css
@import '@master/keyframes.css';
```
or separately:
```css
@import '@master/keyframes.css/fade';
@import '@master/keyframes.css/ping';
...
```

# CDN

[jsdelivr](https://www.jsdelivr.com/package/npm/@master/keyframes.css)
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@master/keyframes.css">
<!-- or -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@master/keyframes.css/fade.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@master/keyframes.css/ping.css">
...
```
[unpkg](https://unpkg.com/@master/keyframes.css)
```html
<link rel="stylesheet" href="https://unpkg.com/@master/keyframes.css">
<!-- or -->
<link rel="stylesheet" href="https://unpkg.com/@master/keyframes.css/fade.css">
<link rel="stylesheet" href="https://unpkg.com/@master/keyframes.css/ping.css">
...
```

# Related
- [@master/css](https://github.com/master-co/css) - A Virtual CSS language with enhanced syntax. ~13KB
- [@master/normal.css](https://github.com/master-co/normal.css) - Normalize browser's styles. ~1KB
