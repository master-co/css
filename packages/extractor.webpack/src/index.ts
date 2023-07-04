import CSSExtractor, { Options } from '@master/css-extractor'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import log from '@techor/log'

const NAME = 'MasterCSSExtractorPlugin'

export class CSSExtractorPlugin extends CSSExtractor {

    initialized = false
    moduleContentByPath = {}

    apply(compiler: Compiler) {
        if (!this.initialized) {
            this
                .on('init', (options: Options) => {
                    options.include = []
                })
                .on('change', () => {
                    virtualModule.writeModule(virtualModuleId, this.css.text)
                })
                .on('reset', () => {
                    for (const modulePath in this.moduleContentByPath) {
                        const moduleContent = this.moduleContentByPath[modulePath]
                        this.insert(modulePath, moduleContent)
                    }
                })
            this.init()
            /* update the Virtual CSS module after initialization */
            compiler.hooks.initialize.tap(NAME, async () => {
                await this.prepare()
                log``
            })
            compiler.hooks.watchRun.tapPromise(NAME, async () => {
                await this.startWatch()
            })
            this.initialized = true
        }

        const virtualModuleId = 'node_modules/' + this.options.module
        const virtualModule = new VirtualModulesPlugin()

        virtualModule.apply(compiler)

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