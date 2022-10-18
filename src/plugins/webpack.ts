const MasterCSSExtractor = require('../extractor')

const NAME = 'MasterCSSWebpackPlugin'

export default class MasterCSSWebpackPlugin {

    aot

    constructor(options) {
        this.aot = new MasterCSSExtractor(options)
    }

    apply(compiler) {
        const { webpack } = compiler;
        const { RawSource } = webpack.sources;
        compiler.hooks.compilation.tap(NAME, (compilation) => {
            // 增加額外的 `master.css` assets
            compilation.hooks.finishModules.tap(NAME, (modules) => {
                const { modifiedFiles, watching } = compiler
                const eachExtractions = []

                for (const eachModule of modules) {
                    const name = eachModule.resource
                    // 從記憶體或快取取得當前 module 的原始碼
                    const source = eachModule._source?.source();
                    // 在 watch 模式下僅處理當下變更的檔案
                    if (watching && modifiedFiles?.size && !modifiedFiles.has(name)) { continue }
                    eachExtractions.push(...this.extractor.extract({ name, source }))
                }

                if (eachExtractions.length) {
                    /* 比對提取物並插入 CSS 規則 */
                    this.extractor.insert(eachExtractions)
                    /* 根據 cssText 生成 `master.css` 並加入到 Webpack 的 assets 中 */
                    const cssText = this.extractor.css.text
                    if (cssText) {
                        const newSource = new RawSource(cssText)
                        if (compilation.getAsset(this.extractor.options.output)) {
                            compilation.updateAsset(this.extractor.options.output, newSource);
                        } else {
                            compilation.emitAsset(this.extractor.options.output, newSource);
                        }
                    }
                }
            })
        })
    }
}
