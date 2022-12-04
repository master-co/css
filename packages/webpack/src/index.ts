import MasterCSSCompiler from '@master/css.compiler'
import type { Compiler } from 'webpack'

const NAME = 'MasterCSSWebpackPlugin'

export default class MasterCSSWebpackPlugin extends MasterCSSCompiler {

    async apply(compiler: Compiler) {
        await this.initializing
        const { webpack } = compiler
        const { Template, RuntimeGlobals, RuntimeModule } = webpack
        const { RawSource } = webpack.sources
        const { Compilation } = webpack
        const outputHref = this.outputHref

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            const enabledChunks = new WeakSet()
            const handler = (chunk, set) => {
                if (enabledChunks.has(chunk))
                    return
                enabledChunks.add(chunk)
                set.add(RuntimeGlobals.publicPath)
                compilation.addRuntimeModule(chunk, new CssLoadingRuntimeModule(set))
            }
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.ensureChunkHandlers)
                .tap(NAME, handler)
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
                .tap(NAME, handler)

            class CssLoadingRuntimeModule extends RuntimeModule {

                runtimeRequirements: Set<string>

                constructor(runtimeRequirements: Set<string>) {
                    super('master-css-loading', 10)

                    this.runtimeRequirements = runtimeRequirements
                }

                generate() {
                    const { runtimeRequirements } = this
                    const withHmr = runtimeRequirements.has(RuntimeGlobals.hmrDownloadUpdateHandlers)
                    if (!withHmr)
                        return ''

                    return Template.asString([
                        Date.now().toString(),
                        `const link = document.querySelector('[href*=\\'${outputHref}\\'][rel=stylesheet]')`,
                        'if (link) {',
                        Template.indent([
                            'link.href = link.href.replace(/ts=[0-9]+/, \'ts=\' + Date.now())'
                        ]),
                        '}'
                    ])
                }
            }
        })

        compiler.hooks.compilation.tap(NAME, (compilation) => {
            // 增加額外的 `master.css` assets
            compilation.hooks.finishModules.tap(NAME, (modules) => {
                const { modifiedFiles, watching } = compiler
                const eachExtractions: string[] = []

                for (const eachModule of modules) {
                    const name = eachModule['resource']
                    // 從記憶體或快取取得當前 module 的原始碼
                    const content = eachModule['_source']?.source()
                    // 在 watch 模式下僅處理當下變更的檔案
                    if (watching && modifiedFiles?.size && (!modifiedFiles.has(this.userConfigPath) && !modifiedFiles.has(name))) { continue }
                    eachExtractions.push(...this.extract({ name, content }))
                }

                if (eachExtractions.length) {
                    const originalCssText = this.css.text
                    /* 比對提取物並插入 CSS 規則 */
                    this.insert(eachExtractions)
                    /* 根據 cssText 生成 `master.css` 並加入到 Webpack 的 assets 中 */
                    const cssText = this.css.text
                    if (cssText !== originalCssText) {
                        const newSource = new RawSource(cssText)
                        if (compilation.getAsset(this.outputPath)) {
                            compilation.updateAsset(this.outputPath, newSource)
                        } else {
                            compilation.emitAsset(this.outputPath, newSource)
                        }
                    }
                }
            })

            compilation.hooks.processAssets.tap({
                name: NAME,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            }, () => {
                compilation.chunks.forEach((chunk) => {
                    chunk.files.add(this.outputPath)
                })
            })
        })

        compiler.hooks.afterCompile.tap(NAME, async (compilation) => {
            compilation.fileDependencies.add(this.userConfigPath)
        })

        compiler.hooks.watchRun.tap(NAME, async (compiler) => {
            if (compiler.modifiedFiles?.has(this.userConfigPath)) {
                await this.reload()
            }
        })
    }
}
