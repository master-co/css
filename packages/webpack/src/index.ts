import MasterCSSCompiler from '@master/css.compiler'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import fs from 'fs'

const NAME = 'MasterCSSWebpackPlugin'

export class MasterCSSWebpackPlugin extends MasterCSSCompiler {

    apply(compiler: Compiler) {
        const { webpack } = compiler
        const { Template, RuntimeGlobals, RuntimeModule } = webpack
        const cssCompiler = this

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
        const updateCSS = () => virtualModules.writeModule(
            'node_modules/master.css',
            (compiler.watchMode ? `/*${this.moduleHMREvent}*/` : '') + this.css.text
        )

        compiler.hooks.initialize.tap(NAME, async () => {
            await this.init()
            updateCSS()
        })

        compiler.hooks.watchRun.tapPromise(NAME, async () => {
            compiler.modifiedFiles?.forEach((modifiedFilePath) => {
                this.insert(modifiedFilePath, fs.readFileSync(modifiedFilePath).toString())
                updateCSS()
            })
        })

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            const enabledChunks = new WeakSet()

            const handleRuntime = (chunk, set) => {
                if (enabledChunks.has(chunk))
                    return
                enabledChunks.add(chunk)
                set.add(RuntimeGlobals.publicPath)
                compilation.addRuntimeModule(chunk, new class MasterCSSRuntimeModule extends RuntimeModule {
                    runtimeRequirements: Set<string>
                    constructor(runtimeRequirements: Set<string>) {
                        super('master-css-runtime', 10)
                        this.runtimeRequirements = runtimeRequirements
                    }
                    generate() {
                        const { runtimeRequirements } = this
                        const withHmr = runtimeRequirements.has(RuntimeGlobals.hmrDownloadUpdateHandlers)
                        if (!withHmr)
                            return ''
                        /** 解決 npm run dev 後首次 HMR 未正確更新並重載的問題 */
                        updateCSS()
                        return Template.asString([
                            `
                                if (typeof document !== 'undefined') {
                                    const style = Array.from(document.querySelectorAll('style')).find((eachStyle) => eachStyle.textContent.startsWith('/*${cssCompiler.moduleHMREvent}*/'))
                                    console.log(style)
                                    if (style) style.textContent = '${cssCompiler.css.text}'
                                }
                            `,
                        ])
                    }
                }(set))
            }

            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.ensureChunkHandlers)
                .tap(NAME, handleRuntime)

            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
                .tap(NAME, handleRuntime)
        })

        compiler.hooks.afterCompile.tap(NAME, async (compilation) => {
            if (this.hasCustomConfig)
                compilation.fileDependencies.add(this.customConfigPath)
        })

    }
}
