const path = require('path')
const generateCSSTextFromChanges = require('./libs/generateCSSTextFromChanges')
const initCSS = require('./libs/initCSS')

const NAME = 'MasterCSSWebpackPlugin'

module.exports = class MasterCSSWebpackPlugin {
    apply(compiler) {
        const css = initCSS()
        const config = css.config

        compiler.hooks.compilation.tap(NAME, (compilation) => {
            // 增加額外的 `master.css` assets
            compilation.hooks.finishModules.tap(NAME, (modules) => {
                const classes = new Set()
                for (const eachModule of modules) {
                    const name = eachModule.resource
                    const ext = path.extname(name)
                    const source = eachModule._source._value
                    for (const classString of config.extract({ source, ext, name })) {
                        classes.add(classString)
                    }
                }
                if (classes.size) {
                    /* 變動的類名生成 CSS text */
                    const cssText = generateCSSTextFromChanges([...classes], css)
                    /* 根據 cssText 生成 `master.css` 並加入到 Webpack 的 assets 中 */
                    if (cssText) {
                        compilation.assets[config.output] = {
                            source() { return cssText },
                            size() { return cssText.length },
                        }
                    }
                }

            })
        })
    }
}
