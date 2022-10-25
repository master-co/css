<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b>Package</b>
</p>
<p align="center">A tool-ready open source package template 🛠 + 📦</p>

<!-- Badges -->
<!-- [![MIT License](https://flat.badgen.net/github/license/master-co/package?color=yellow)](https://github.com/master-co/package/blob/main/LICENSE)
[![Latest Release](https://flat.badgen.net/npm/v/@master/package?icon=npm&label&color=yellow)](https://www.npmjs.com/package/@master/package)
[![Bundle Size](https://flat.badgen.net/bundlephobia/minzip/@master/package?icon=packagephobia&label&color=yellow)](https://bundlephobia.com/package/@master/package 'gzip bundle size (including dependencies)')
[![Package Size](https://flat.badgen.net/badgesize/brotli/https://cdn.jsdelivr.net/npm/@master/package?icon=jsdelivr&label&color=yellow)](https://unpkg.com/@master/package 'brotli package size (without dependencies)')
[![Documentation](https://flat.badgen.net/badge/icon/Documentation?icon=awesome&label&color=yellow)](https://package.master.co)
[![Github](https://flat.badgen.net/badge/icon/master-co%2Fpackage?icon=github&label&color=yellow)](https://github.com/master-co/package)
[![Discord](https://flat.badgen.net/badge/icon/discord?icon=discord&label&color=yellow)](https://discord.gg/sZNKpAAAw6)
[![CI](https://flat.badgen.net/github/status/master-co/package/main/ci/circleci?icon=circleci)](https://circleci.com/gh/master-co/workflows/package/tree/main) -->

[Scripts](#scripts)・[Toolchain](#toolchain)

</div>


---

# Scripts
| Script       | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `build:iife` | Build and output the IIFE format bundle for Browser                |
| `build:cjs`  | Build and output the CommonJS format bundle for Node               |
| `build:esm`  | Build and output ECMAScript modules and declarations               |
| `build:css`  | Build and output CSS                                               |
| `dev:iife`   | Watch your source code for changes and `build:iife`                |
| `dev:cjs`    | Watch your source code for changes and `build:cjs`                 |
| `dev:esm`    | Watch your source code for changes and `build:esm`                 |
| `prod`       | Build and output archives in all Javascript formats for production |
| `test`       | Test all of your JavaScript codes                                  |
| `lint`       | Find and fix problems in your JavaScript code                      |

---

# Features

[esbuild](https://esbuild.github.io) +
[tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html) +
[swc.rs](https://swc.rs) +
[jest](https://jestjs.io) +
[semantic-release](https://semantic-release.gitbook.io)

##### Output & Bundle
- ✅ **ESM** ( ECMAScript modules ) —— `tsc`
  - ⛑ More reliable than `esbuild`
- ✅ **CJS**, Node ( CommonJS modules ) —— `esbuild`
- ✅ **IIFE**, Browser ( Immediately-invoked function expression ) —— `esbuild`
- ✅ **[CSS](https://esbuild.github.io/content-types/#css-from-js)** —— `esbuild`

##### Optimization
- ✅ **Minification** —— `esbuild`
- ✅ **Tree Shaking** of ES6 modules —— `tsc` & `sideEffects: false`

##### Language & Type
- ✅ **TypeScript** —— `esbuild` & `tsc`
- ✅ **Type Declaration** —— `tsc`

##### Development
- ✅ **Source Maps** —— `esbuild` & `tsc`

##### Test
- ✅ **Javascript Test** —— `jest` & `swc`
  - ⚡️ `@swc/jest` faster than `esbuild-jest`

##### Linting & Coding Style
- ✅ **Find problems in your JavaScript code** —— `eslint`

##### Version & Release
- ✅ **Version Management** - `semantic-release`
- ✅ **Release** - `github` & `npm`
