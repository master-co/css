import CSSExtractor, { Options } from '@master/css-extractor'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import log from '@techor/log'

const NAME = 'MasterCSSExtractorPlugin'

export class CSSExtractorPlugin extends CSSExtractor {
    initialized = false
    apply(compiler: Compiler) {
        if (!this.initialized) {
            this
                .on('init', (options: Options) => {
                    options.include = []
                })
                .on('change', () => {
                    virtualModule.writeModule(
                        virtualModuleId,
                        (compiler.watchMode ? `/*${this.hotModuleEvent}*/` : '') + this.css.text
                    )
                })
            this.init()
            /* prevent watch twice */
            compiler.hooks.watchRun.tap(NAME, async () => {
                await this.startWatch()
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

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const plugin = this

        virtualModule.apply(compiler)

        /* update the Virtual CSS module after initialization */
        compiler.hooks.initialize.tap(NAME, async () => {
            await this.prepare()
            log``
        })

        const moduleSources = {}

        compiler.hooks.compilation.tap(NAME, async (compilation) => {

            const insert = async (module) => {
                const modulePath = compilation.getModule(module)['resource']
                if (modulePath) {
                    const moduleSource = compilation.getModule(module)['_source']
                    const moduleContent = moduleSource?.source()
                    moduleSources[modulePath] = moduleSource
                    await this.insert(modulePath, moduleContent)
                }
            }

            compilation.hooks.succeedModule.tap(NAME, (module) => {
                insert(module)
            })

            if (compiler.watching)
                compilation.hooks.buildModule.tap(NAME, async (module) => {
                    const modulePath = compilation.getModule(module)['resource']
                    compiler.modifiedFiles?.forEach((eachModulePath) => {
                        if (modulePath === eachModulePath) {
                            insert(module)
                        }
                    })
                })
        })
    }
}