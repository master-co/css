import { CSSExtractor, Options } from '@master/css-extractor'
import {
    loadConfigModule,
    resolveConfigPath,
    stripMasterCSSConfigQuery,
    toConfigModule,
    toVirtualCSSConfigModulePath,
    toVirtualDefaultConfigModulePath,
    MASTER_CSS_CONFIG_QUERY,
    VIRTUAL_CONFIG_DIR,
    VIRTUAL_CONFIG_ID,
    warnMissingConfig,
    type ExploreConfigPath
} from '@master/css-explore-config'
import { createExtractedCSS, registerStyleCSSSource as registerExtractorStyleCSSSource, type StyleCSSSources } from '@master/css-extractor/style'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import log from '@techor/log'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import {
    STYLE_CSS_REQUEST_RE,
    cleanStyleRequest,
    isMasterCSSModuleId,
    isMasterStyleSource,
    isStyleCSSRequest
} from './utils/style-css'

const NAME = 'MasterCSSPlugin'
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

function getResolveIssuer(resolveData: { context?: string, contextInfo?: { issuer?: string } }) {
    return resolveData.contextInfo?.issuer || resolveData.context || ''
}

export class MasterCSSPlugin extends CSSExtractor {

    pluginInitialized = false
    moduleContentByPath: any = {}
    defaultConfigDependencies: string[] = []
    styleCSSSources: StyleCSSSources = new Map()

    private resolveDefaultConfigPath(): ExploreConfigPath | undefined {
        if (typeof this.options.config === 'string') {
            return resolveConfigPath({
                name: this.options.config,
                cwd: this.cwd
            })
        }
    }

    private warnMissingDefaultConfig() {
        if (typeof this.options.config !== 'string') return
        if (this.resolveDefaultConfigPath()) return
        warnMissingConfig({
            integration: '@master/css.webpack',
            name: this.options.config,
            cwd: this.cwd
        })
    }

    private async createDefaultConfigModule(resolvedConfig = this.resolveDefaultConfigPath()) {
        if (typeof this.options.config === 'object') {
            return toConfigModule(this.options.config)
        }
        if (!resolvedConfig) return EMPTY_CONFIG_MODULE
        const result = await loadConfigModule(resolvedConfig.path)
        this.defaultConfigDependencies = result.dependencies
        return result.code
    }

    private getExtractorClasses() {
        return [...new Set([
            ...(this.latentClasses || []),
            ...(this.validClasses || []),
            ...(this.usedNativeClasses || []),
            ...(this.options.includeClasses || [])
        ])]
    }

    private async createExtractedCSS() {
        return createExtractedCSS({
            extractor: this,
            styleCSSSources: this.styleCSSSources,
            classes: this.getExtractorClasses(),
            loadConfigMode: 'css',
            projectDir: this.cwd
        })
    }

    private async registerStyleCSSSource(modulePath: string, source: string) {
        await registerExtractorStyleCSSSource(this, this.styleCSSSources, modulePath, source, {
            projectDir: this.cwd
        })
    }

    private readOriginalStyleSource(modulePath: string, fallback: string) {
        if (!isStyleCSSRequest(modulePath)) return fallback
        try {
            return readFileSync(cleanStyleRequest(modulePath), 'utf-8')
        } catch {
            return fallback
        }
    }

    private async processModuleContents(entries: [string, string][], isGeneratedCSSModulePath: (modulePath: string) => boolean) {
        const insertEntries: [string, string][] = []
        const styleEntries: [string, string][] = []

        for (const [modulePath, content] of entries) {
            if (isGeneratedCSSModulePath(modulePath)) continue
            const source = this.readOriginalStyleSource(modulePath, content)
            if (isStyleCSSRequest(modulePath)) {
                if (isMasterStyleSource(source)) {
                    styleEntries.push([modulePath, source])
                } else {
                    this.styleCSSSources.delete(cleanStyleRequest(modulePath))
                }
                continue
            }
            insertEntries.push([modulePath, content])
        }

        await Promise.all(styleEntries.map(([modulePath, content]) =>
            this.registerStyleCSSSource(modulePath, content)
        ))
        await Promise.all(insertEntries.map(([modulePath, content]) =>
            this.insert(modulePath, content)
        ))
    }

    apply(compiler: Compiler) {
        let virtualCSSImportModuleId = ''
        let virtualConfigModuleId = ''
        let virtualModule: VirtualModulesPlugin
        let resetReplayChain: Promise<unknown> = Promise.resolve()
        const isGeneratedCSSModulePath = (modulePath: string) => {
            const normalizedModulePath = normalizePath(modulePath)
            const normalizedGeneratedCSSImportModuleId = normalizePath(virtualCSSImportModuleId)
            return normalizedModulePath === normalizedGeneratedCSSImportModuleId
        }
        const writeGeneratedCSSModule = async () => {
            if (!virtualModule || !virtualCSSImportModuleId) return
            const cssText = await this.createExtractedCSS()
            virtualModule.writeModule(virtualCSSImportModuleId, cssText)
        }
        const writeDefaultConfigModule = async () => {
            if (!virtualModule || !virtualConfigModuleId) return
            virtualModule.writeModule(virtualConfigModuleId, await this.createDefaultConfigModule())
        }
        const replayModuleContents = async () => {
            const entries = Object.entries(this.moduleContentByPath)
                .map(([modulePath, moduleContent]) => [modulePath, String(moduleContent)] as [string, string])
            await this.processModuleContents(entries, isGeneratedCSSModulePath)
        }

        if (!this.pluginInitialized) {
            this
                .on('init', (options: Options) => {
                    options.include = []
                })
                .on('change', () => {
                    writeGeneratedCSSModule().catch((error: unknown) => {
                        console.error('[master-css.webpack] generated CSS module update failed:', error)
                    })
                })
                .on('configChange', () => {
                    writeDefaultConfigModule().catch((error: unknown) => {
                        console.error('[master-css.webpack] config module update failed:', error)
                    })
                })
                .on('reset', () => {
                    writeDefaultConfigModule().catch((error: unknown) => {
                        console.error('[master-css.webpack] config module update failed:', error)
                    })
                    resetReplayChain = resetReplayChain
                        .then(replayModuleContents)
                        .then(writeGeneratedCSSModule)
                        .catch((error: unknown) => {
                            console.error('[master-css.webpack] reset replay failed:', error)
                        })
                })
            void this.init()
            /* update the Virtual CSS module after initialization */
            compiler.hooks.beforeRun.tapPromise(NAME, async () => {
                await this.init()
                this.warnMissingDefaultConfig()
                await this.prepare()
                await writeGeneratedCSSModule()
                log``
            })
            compiler.hooks.watchRun.tapPromise(NAME, async (watchingCompiler) => {
                await this.init()
                this.warnMissingDefaultConfig()
                const resolvedConfig = this.resolveDefaultConfigPath()
                const modifiedFiles = (watchingCompiler as Compiler & { modifiedFiles?: ReadonlySet<string> }).modifiedFiles
                const defaultConfigDependencies = this.defaultConfigDependencies.length
                    ? this.defaultConfigDependencies
                    : resolvedConfig ? [resolvedConfig.path] : []
                if (defaultConfigDependencies.some((dependency) => hasModifiedFile(modifiedFiles, dependency))) {
                    await this.reset(this.options)
                    await resetReplayChain
                }
                await this.startWatch()
            })
            this.pluginInitialized = true
        }

        const compilerContext = compiler.context || this.cwd || process.cwd()
        virtualCSSImportModuleId = path.join(compilerContext, VIRTUAL_CONFIG_DIR, 'master-css-import.css')
        virtualConfigModuleId = toVirtualDefaultConfigModulePath(compilerContext)
        virtualModule = new VirtualModulesPlugin({
            [virtualCSSImportModuleId]: '',
            [virtualConfigModuleId]: EMPTY_CONFIG_MODULE
        })

        virtualModule.apply(compiler)

        compiler.hooks.normalModuleFactory.tap(NAME, (normalModuleFactory) => {
            normalModuleFactory.hooks.beforeResolve.tapAsync(NAME, (resolveData, callback) => {
                const request = resolveData.request
                if (request === VIRTUAL_CONFIG_ID) {
                    const resolvedConfig = this.resolveDefaultConfigPath()
                    this.createDefaultConfigModule(resolvedConfig)
                        .then((moduleContent) => {
                            virtualModule.writeModule(virtualConfigModuleId, moduleContent)
                            for (const dependency of this.defaultConfigDependencies) {
                                resolveData.fileDependencies.add(dependency)
                            }
                            resolveData.request = virtualConfigModuleId
                            callback()
                        })
                        .catch((error: Error) => callback(error))
                    return
                }

                if (isMasterCSSModuleId(request)) {
                    const issuer = getResolveIssuer(resolveData)
                    if (STYLE_CSS_REQUEST_RE.test(issuer)) {
                        resolveData.request = virtualCSSImportModuleId
                    }
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
                    async (error, resolvedPath) => {
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
                            const result = await loadConfigModule(resolvedPath)
                            virtualModule.writeModule(virtualCSSConfigModuleId, result.code)
                            for (const dependency of result.dependencies) {
                                resolveData.fileDependencies.add(dependency)
                            }
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
            if (resolvedConfig) {
                for (const dependency of this.defaultConfigDependencies.length ? this.defaultConfigDependencies : [resolvedConfig.path]) {
                    compilation.fileDependencies.add(dependency)
                }
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
                if (isGeneratedCSSModulePath(modulePath)) return
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
                await this.processModuleContents(entries, isGeneratedCSSModulePath)
                await writeGeneratedCSSModule()
            })
        })
    }
}

// exports.__esModule = true
