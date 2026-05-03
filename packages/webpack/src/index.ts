import { CSSExtractor, Options } from '@master/css-extractor'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import log from '@techor/log'

const NAME = 'MasterCSSExtractorPlugin'

export class MasterCSSExtractorPlugin extends CSSExtractor {

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

        const virtualModuleId = 'node_modules/' + this.options.module?.replace('virtual:', '')
        const virtualModule = new VirtualModulesPlugin({
            // can be fixed: `Module not found: Can't resolve 'virtual:master.css'`
            [virtualModuleId]: ''
        })

        virtualModule.apply(compiler)

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            // Per-module: only synchronously record source. `succeedModule` is a
            // SyncHook — async handlers attached via `.tap()` would be discarded
            // by tapable, and webpack would proceed to `emit` before any
            // `extractor.insert()` resolved (race that produced incomplete CSS).
            const pendingByPath = new Map<string, string>()
            compilation.hooks.succeedModule.tap(NAME, (module) => {
                // @ts-expect-error webpack internals
                const modulePath = module['resourceResolveData']?.['path'] || module['resource']
                if (!modulePath) return
                // @ts-expect-error webpack internals
                const moduleContent = module['_source']?.source()
                if (moduleContent === undefined || moduleContent === null) return
                this.moduleContentByPath[modulePath] = moduleContent
                pendingByPath.set(modulePath, String(moduleContent))
            })
            // After the compilation has identified every module that succeeded
            // this pass, await all extractor inserts together. `finishModules`
            // is an AsyncSeriesHook so webpack will block on this promise
            // before processing assets / emitting — which is exactly the
            // ordering the original `tap(async ...)` was attempting (and
            // silently failing) to achieve.
            compilation.hooks.finishModules.tapPromise(NAME, async () => {
                if (!pendingByPath.size) return
                const entries = Array.from(pendingByPath.entries())
                pendingByPath.clear()
                await Promise.all(entries.map(([modulePath, content]) =>
                    this.insert(modulePath, content)
                ))
            })
        })
    }
}

// exports.__esModule = true