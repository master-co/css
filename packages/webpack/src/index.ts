import { CSSExtractor, Options } from '@master/css-extractor'
import { loadConfig, resolveConfigPath, type ExploreConfigPath } from '@master/css-explore-config'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import log from '@techor/log'
import path from 'node:path'
import { MASTER_CSS_CONFIG_QUERY, VIRTUAL_CONFIG_DIR, VIRTUAL_CONFIG_ID } from './common'
import {
    stripMasterCSSConfigQuery,
    toConfigModule,
    toNativeConfigModule,
    toVirtualCSSConfigModulePath,
    toVirtualDefaultConfigModulePath
} from './utils/config-module'

const NAME = 'MasterCSSExtractorPlugin'
const EMPTY_CONFIG_MODULE = 'export default {};'

function isVirtualConfigModulePath(modulePath: string) {
    return modulePath.replace(/\\/g, '/').includes(`${VIRTUAL_CONFIG_DIR}/`)
}

function normalizePath(filePath: string) {
    return path.resolve(filePath).replace(/\\/g, '/')
}

function hasModifiedFile(modifiedFiles: ReadonlySet<string> | undefined, filePath: string) {
    if (!modifiedFiles) return false
    const normalizedFilePath = normalizePath(filePath)
    for (const eachModifiedFile of modifiedFiles) {
        if (normalizePath(eachModifiedFile) === normalizedFilePath) return true
    }
    return false
}

export class MasterCSSExtractorPlugin extends CSSExtractor {

    initialized = false
    moduleContentByPath: any = {}

    private resolveDefaultConfigPath(): ExploreConfigPath | undefined {
        if (typeof this.options.config === 'string') {
            return resolveConfigPath({
                name: this.options.config,
                cwd: this.cwd
            })
        }
    }

    private createDefaultConfigModule(resolvedConfig = this.resolveDefaultConfigPath()) {
        if (typeof this.options.config === 'object') {
            return toConfigModule(this.options.config)
        }
        if (!resolvedConfig) return EMPTY_CONFIG_MODULE
        if (resolvedConfig.extension === 'css') {
            return toConfigModule(loadConfig(resolvedConfig.path))
        }
        return toNativeConfigModule(resolvedConfig.path)
    }

    apply(compiler: Compiler) {
        let virtualModuleId = ''
        let virtualConfigModuleId = ''
        let virtualModule: VirtualModulesPlugin
        let resetReplayChain: Promise<unknown> = Promise.resolve()
        const writeVirtualCSSModule = () => {
            if (!virtualModule || !virtualModuleId) return
            virtualModule.writeModule(virtualModuleId, this.css.text)
        }
        const writeDefaultConfigModule = () => {
            if (!virtualModule || !virtualConfigModuleId) return
            virtualModule.writeModule(virtualConfigModuleId, this.createDefaultConfigModule())
        }
        const replayModuleContents = async () => {
            await Promise.all(
                Object.entries(this.moduleContentByPath)
                    .map(([modulePath, moduleContent]) =>
                        this.insert(modulePath, String(moduleContent))
                    )
            )
        }

        if (!this.initialized) {
            this
                .on('init', (options: Options) => {
                    options.include = []
                })
                .on('change', () => {
                    writeVirtualCSSModule()
                })
                .on('configChange', () => {
                    writeDefaultConfigModule()
                })
                .on('reset', () => {
                    writeDefaultConfigModule()
                    resetReplayChain = resetReplayChain
                        .then(replayModuleContents)
                        .then(writeVirtualCSSModule)
                        .catch((error: unknown) => {
                            console.error('[master-css.webpack] reset replay failed:', error)
                        })
                })
            this.init()
            /* update the Virtual CSS module after initialization */
            compiler.hooks.initialize.tap(NAME, async () => {
                await this.prepare()
                writeVirtualCSSModule()
                log``
            })
            compiler.hooks.watchRun.tapPromise(NAME, async (watchingCompiler) => {
                const resolvedConfig = this.resolveDefaultConfigPath()
                const modifiedFiles = (watchingCompiler as Compiler & { modifiedFiles?: ReadonlySet<string> }).modifiedFiles
                if (resolvedConfig?.extension === 'css' && hasModifiedFile(modifiedFiles, resolvedConfig.path)) {
                    await this.reset(this.options)
                    await resetReplayChain
                }
                await this.startWatch()
            })
            this.initialized = true
        }

        const compilerContext = compiler.context || this.cwd || process.cwd()
        virtualModuleId = 'node_modules/' + this.options.module?.replace('virtual:', '')
        virtualConfigModuleId = toVirtualDefaultConfigModulePath(compilerContext)
        virtualModule = new VirtualModulesPlugin({
            // can be fixed: `Module not found: Can't resolve 'virtual:master.css'`
            [virtualModuleId]: '',
            [virtualConfigModuleId]: EMPTY_CONFIG_MODULE
        })

        virtualModule.apply(compiler)

        compiler.hooks.normalModuleFactory.tap(NAME, (normalModuleFactory) => {
            normalModuleFactory.hooks.beforeResolve.tapAsync(NAME, (resolveData, callback) => {
                const request = resolveData.request
                if (request === VIRTUAL_CONFIG_ID) {
                    const resolvedConfig = this.resolveDefaultConfigPath()
                    virtualModule.writeModule(virtualConfigModuleId, this.createDefaultConfigModule(resolvedConfig))
                    if (resolvedConfig?.extension === 'css') {
                        resolveData.fileDependencies.add(resolvedConfig.path)
                    }
                    resolveData.request = virtualConfigModuleId
                    callback()
                    return
                }

                if (!request.endsWith(MASTER_CSS_CONFIG_QUERY)) {
                    callback()
                    return
                }

                const sourceRequest = stripMasterCSSConfigQuery(request)
                const resolver = normalModuleFactory.getResolver('normal')
                resolver.resolve(
                    resolveData.contextInfo,
                    resolveData.context,
                    sourceRequest,
                    {},
                    (error, resolvedPath) => {
                        if (error) {
                            callback(error)
                            return
                        }
                        if (!resolvedPath) {
                            callback()
                            return
                        }
                        try {
                            const virtualCSSConfigModuleId = toVirtualCSSConfigModulePath(compilerContext, resolvedPath)
                            virtualModule.writeModule(virtualCSSConfigModuleId, toConfigModule(loadConfig(resolvedPath)))
                            resolveData.fileDependencies.add(resolvedPath)
                            resolveData.request = virtualCSSConfigModuleId
                            callback()
                        } catch (error) {
                            callback(error as Error)
                        }
                    }
                )
            })
        })

        compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
            const resolvedConfig = this.resolveDefaultConfigPath()
            if (resolvedConfig?.extension === 'css') {
                compilation.fileDependencies.add(resolvedConfig.path)
            }
            // Per-module: only synchronously record source. `succeedModule` is a
            // SyncHook — async handlers attached via `.tap()` would be discarded
            // by tapable, and webpack would proceed to `emit` before any
            // `extractor.insert()` resolved (race that produced incomplete CSS).
            const pendingByPath = new Map<string, string>()
            compilation.hooks.succeedModule.tap(NAME, (module) => {
                // @ts-expect-error webpack internals
                const modulePath = module['resourceResolveData']?.['path'] || module['resource']
                if (!modulePath) return
                if (isVirtualConfigModulePath(modulePath)) return
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
                writeVirtualCSSModule()
            })
        })
    }
}

// exports.__esModule = true
