import CSSExtractor, { Options } from '@master/css-extractor'
import type { Compiler, Module } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import log from '@techor/log'

const NAME = 'MasterCSSExtractorPlugin'

export class CSSExtractorPlugin extends CSSExtractor {

    initialized = false
    moduleContentByPath = {}

    apply(compiler: Compiler) {
        const getLatestCSSText = () => {
            return (compiler.watchMode ? `/*${this.hotModuleEvent}*/` : '') + this.css.text
        }
        if (!this.initialized) {
            this
                .on('init', (options: Options) => {
                    options.include = []
                })
                .on('change', () => {
                    virtualModule.writeModule(virtualModuleId, getLatestCSSText())
                })
                .on('reset', () => {
                    for (const modulePath in this.moduleContentByPath) {
                        const moduleContent = this.moduleContentByPath[modulePath]
                        this.insert(modulePath, moduleContent)
                    }
                })
            this.init()

            compiler.hooks.watchRun.tapPromise(NAME, async () => {
                await this.startWatch()
                // update after watch ready
                virtualModule.writeModule(virtualModuleId, getLatestCSSText())
            })

            this.initialized = true
        }

        const virtualModuleId = 'node_modules/' + this.options.module
        const resolveVirtualModulePath = path.resolve(compiler.context, virtualModuleId)
        /** prevent multiple plugin instances to one virtual id */
        const virtualModule = new VirtualModulesPlugin({
            [virtualModuleId]: ''
        })

        if (!compiler.options.resolve)
            compiler.options.resolve = {}

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            [this.options.module]: resolveVirtualModulePath
        }
        virtualModule.apply(compiler)
        /* update the Virtual CSS module after initialization */
        compiler.hooks.initialize.tap(NAME, async () => {
            await this.prepare()
            log``
        })
        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            compilation.hooks.succeedModule.tap(NAME, async (module) => {
                const modulePath = module['resourceResolveData']?.['path'] || module['resource']
                if (modulePath) {
                    const moduleSource = module['_source']
                    const moduleContent = moduleSource?.source()
                    this.moduleContentByPath[modulePath] = moduleContent
                    await this.insert(modulePath, moduleContent)
                }
            })
        })
    }
}