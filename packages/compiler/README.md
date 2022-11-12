<br><br>
<div align="center">

<p align="center">
    <img src="https://raw.githubusercontent.com/master-co/package/document/images/logo-and-text.svg" alt="logo" width="142">
</p>
<p align="center">
    <b><!-- name -->CSS Compiler<!----></b>
</p>
<p align="center"><!-- package.description -->Compile Master CSS ahead of time with zero-configuration integration with build tools<!----></p>

[![MIT License](https://flat.badgen.net/github/license/master-co/css?color=yellow)](https://github.com/master-co/css-compiler/blob/main/LICENSE)
[![Latest Release](https://flat.badgen.net/npm/v/@master/css-compiler?icon=npm&label&color=yellow)](https://www.npmjs.com/package/@master/css-compiler)
[![Documentation](https://flat.badgen.net/badge/icon/Documentation?icon=awesome&label&color=yellow)](https://css.master.co)
[![Github](https://flat.badgen.net/badge/icon/master-co%2Fcss-compiler?icon=github&label&color=yellow)](https://github.com/master-co/css)
[![Discord](https://flat.badgen.net/badge/icon/discord?icon=discord&label&color=yellow)](https://discord.gg/sZNKpAAAw6)
[![CI](https://flat.badgen.net/github/status/master-co/css-compiler/main/ci/circleci?icon=circleci)](https://circleci.com/gh/master-co/workflows/css-compiler/tree/main)

</div>

##### On this page

- [Usage](#usage)
  - [`webpack.config.js`](#webpackconfigjs)
  - [`vite.config.js`](#viteconfigjs)
  - [`next.config.js`](#nextconfigjs)
- [Related](#related)

---

# Usage

## `webpack.config.js`
```js
const { MasterCSSWebpackPlugin } = require('@master/css-compiler')

module.exports = {
    plugins: [
        new MasterCSSWebpackPlugin()
    ]
};
```

## `vite.config.js`
```js
import { MasterCSSVitePlugin } from '@master/css-compiler'

export default defineConfig({
    plugins: [
        MasterCSSVitePlugin()
    ]
})
```

## `next.config.js`
```js
const { MasterCSSWebpackPlugin } = require('@master/css-compiler')

const nextConfig = {
    ...,
    webpack: (config) => {
        config.plugins.push(
            new MasterCSSWebpackPlugin({
                output: {
                    path: 'static/css'
                }
            })
        )
        return config
    }
}

module.exports = nextConfig
```

---

# Related
- [@master/css](https://github.com/master-co/css) - A Virtual CSS language with enhanced syntax. ( ~13KB )
- [@master/css.react](https://github.com/master-co/css.react) - React hooks for Master CSS