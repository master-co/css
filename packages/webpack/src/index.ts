import MasterCSSCompiler from '@master/css.compiler'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'

const NAME = 'MasterCSSWebpackPlugin'

export default class MasterCSSWebpackPlugin extends MasterCSSCompiler {

    apply(compiler: Compiler) {
        const { webpack } = compiler
        const { Template, RuntimeGlobals, RuntimeModule } = webpack

        if (!compiler.options.resolve)
            compiler.options.resolve = {}

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            [this.moduleId]: path.resolve(compiler.context, 'node_modules', this.moduleId)
        }
        const virtualModules = new VirtualModulesPlugin({
            ['node_modules/master.css']: ''
        })
        virtualModules.apply(compiler)
        const updateCSS = () => virtualModules.writeModule('node_modules/master.css', this.css.text)

        // npm run build
        compiler.hooks.beforeRun.tapPromise(NAME, async () => {
            await this.init()
            updateCSS()
        })

        // npm run serve
        compiler.hooks.watchRun.tapPromise(NAME, async () => {
            await this.init()
            updateCSS()
        })

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            const enabledChunks = new WeakSet()
            const handler = (chunk, set) => {
                if (enabledChunks.has(chunk))
                    return
                enabledChunks.add(chunk)
                set.add(RuntimeGlobals.publicPath)
                // compilation.addRuntimeModule(chunk, new CssLoadingRuntimeModule(set))
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
                        `const link = document.querySelector('[href*=\\'${publicURL}\\'][rel=stylesheet]')`,
                        'if (link) {',
                        Template.indent([
                            'link.href = link.href.replace(/ts=[0-9]+/, \'ts=\' + Date.now())'
                        ]),
                        '}'
                    ])
                }
            }

            compilation.hooks.succeedModule.tap(NAME, (eachModule) => {
                const { modifiedFiles, watching } = compiler
                const name = eachModule['resource']
                // 在 watch 模式下僅處理當下變更的檔案
                if (watching && modifiedFiles?.size && (!modifiedFiles.has(this.customConfigPath) && !modifiedFiles.has(name))) {
                    return
                }
                // 從記憶體或快取取得當前 module 的原始碼
                const content = eachModule['_source']?.source()
                if (content) {
                    this.extract(name, content)
                    updateCSS()
                }
            })
        })

        compiler.hooks.afterCompile.tap(NAME, async (compilation) => {
            if (this.hasCustomConfig)
                compilation.fileDependencies.add(this.customConfigPath)
        })

    }
}
