import CSSBuilder, { Options } from '@master/css-builder'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import log from '@techor/log'

const NAME = 'MasterCSSPlugin'

export default class MasterCSSPlugin extends CSSBuilder {

    initialized = false
    moduleContentByPath: any = {}

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
        const virtualModule = new VirtualModulesPlugin({
            // can be fixed: `Module not found: Can't resolve '.virtual/master.css'`
            [virtualModuleId]: ''
        })

        virtualModule.apply(compiler)

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            compilation.hooks.succeedModule.tap(NAME, async (module) => {
                // @ts-expect-error
                const modulePath = module['resourceResolveData']?.['path'] || module['resource']
                if (modulePath) {
                    // @ts-expect-error
                    const moduleSource = module['_source']
                    const moduleContent = moduleSource?.source()
                    this.moduleContentByPath[modulePath] = moduleContent
                    await this.insert(modulePath, moduleContent)
                }
            })
        })
    }
}

exports.__esModule = true