import { CSSExtractor, type Options } from '@master/css-extractor'
import type { MasterCSSPreloaded } from '@master/css'
import {
    toConfigModule,
    toVirtualDefaultConfigModulePath
} from '@master/css-integration/config-module'
import { loadProjectConfig } from '@master/css-configer/load'
import {
    cleanStyleRequest,
    createExtractedCSSResult,
    isStyleCSSRequest,
    registerStyleCSSSource as registerExtractorStyleCSSSource,
    resolveMasterStyleSource,
    type StyleCSSSources
} from '@master/css-extractor/style'
import { toVirtualCSSModulePath } from '@master/css-integration/style-module'
import {
    toPreloadedModule,
    toVirtualPreloadedModulePath,
} from '@master/css-integration/preloaded-module'
import type { Compiler } from 'webpack'
import type VirtualModulesPlugin from 'webpack-virtual-modules'
import { readFileSync } from 'node:fs'
import { normalizePath } from './utils/path'
import ExtractorLifecyclePlugin from './plugins/extractor-lifecycle'
import VirtualModuleRegistryPlugin from './plugins/virtual-modules'
import ConfigVirtualModulePlugin from './plugins/config-virtual-module'
import VirtualCSSImportPlugin from './plugins/virtual-css-import'
import ConfigLoaderPlugin from './plugins/config-loader'
import UsageGraphPlugin from './plugins/usage-graph'
import StyleEntryPlugin from './plugins/style-entry'

const NAME = 'MasterCSSPlugin'

export interface WebpackSubPlugin {
    apply(compiler: Compiler): void
}

export interface MasterCSSWebpackContext {
    name: string
    cwd: string
    compilerContext: string
    virtualCSSImportModuleId: string
    virtualConfigModuleId: string
    virtualPreloadedModuleId: string
    virtualModule?: VirtualModulesPlugin
    on(...args: Parameters<CSSExtractor['on']>): unknown
    init(customOptions?: Options): Promise<unknown>
    reset(customOptions?: Options): Promise<unknown>
    prepare(): Promise<unknown> | unknown
    startWatch(): Promise<unknown> | unknown
    getOptions(): Options
    getPluginInitialized(): boolean
    setPluginInitialized(pluginInitialized: boolean): void
    getDefaultConfigDependencyPaths(): string[]
    setModuleContent(modulePath: string, moduleContent: unknown): void
    createDefaultConfigModule(): Promise<string>
    createPreloadedModule(): Promise<string>
    processModuleContents(
        entries: [string, string][],
        isGeneratedCSSModulePath: (modulePath: string) => boolean
    ): Promise<void>
    writeGeneratedCSSModule(): Promise<void>
    writeDefaultConfigModule(): Promise<void>
    writePreloadedModule(): Promise<void>
    replayModuleContents(): Promise<void>
    queueResetReplay(): Promise<unknown>
    waitForResetReplay(): Promise<unknown>
    isGeneratedCSSModulePath(modulePath: string): boolean
}

export class MasterCSSPlugin {

    readonly extractor: CSSExtractor
    pluginInitialized = false
    moduleContentByPath: Record<string, unknown> = {}
    defaultConfigDependencies: string[] = []
    preloaded: MasterCSSPreloaded = {}
    resetReplayChain: Promise<unknown> = Promise.resolve()
    styleCSSSources: StyleCSSSources = new Map()

    constructor(
        customOptions: Options = {},
        public cwd = process.cwd()
    ) {
        this.extractor = new CSSExtractor(customOptions, cwd)
    }

    get customOptions() {
        return this.extractor.customOptions
    }

    set customOptions(customOptions: Options) {
        this.extractor.customOptions = customOptions
    }

    get options() {
        return this.extractor.options
    }

    get css() {
        return this.extractor.css
    }

    get config() {
        return this.extractor.config
    }

    get slotCSSRule() {
        return this.extractor.slotCSSRule
    }

    get latentClasses() {
        return this.extractor.latentClasses
    }

    get validClasses() {
        return this.extractor.validClasses
    }

    get invalidClasses() {
        return this.extractor.invalidClasses
    }

    get nativeClassNames() {
        return this.extractor.nativeClassNames
    }

    get usedNativeClasses() {
        return this.extractor.usedNativeClasses
    }

    on(...args: Parameters<CSSExtractor['on']>) {
        this.extractor.on(...args)
        return this
    }

    emit(...args: Parameters<CSSExtractor['emit']>) {
        return this.extractor.emit(...args)
    }

    async init(customOptions: Options = this.customOptions) {
        await this.extractor.init(customOptions)
        return this
    }

    async reset(customOptions: Options = this.customOptions) {
        await this.extractor.reset(customOptions)
        return this
    }

    prepare() {
        return this.extractor.prepare()
    }

    startWatch() {
        return this.extractor.startWatch()
    }

    insert(source: string, content: string) {
        return this.extractor.insert(source, content)
    }

    private async createDefaultConfigModule() {
        const result = await loadProjectConfig(this.cwd, {
            config: this.customOptions.config
        })
        this.defaultConfigDependencies = result.dependencies
        return toConfigModule(result.config)
    }

    private getDefaultConfigDependencyPaths() {
        return this.defaultConfigDependencies
    }

    private getExtractorClasses() {
        return [...new Set([
            ...(this.extractor.latentClasses || []),
            ...(this.extractor.validClasses || []),
            ...(this.extractor.usedNativeClasses || []),
            ...(this.options.includeClasses || [])
        ])]
    }

    private async createExtractedCSSResult(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        const result = await createExtractedCSSResult({
            extractor: this.extractor,
            styleCSSSources: this.styleCSSSources,
            classes: this.getExtractorClasses(),
            projectDir: this.cwd,
            includeNativeCSS: options.includeNativeCSS,
            includeMasterBaseCSS: options.includeMasterBaseCSS
        })
        this.preloaded = result.preloaded
        return result
    }

    private async createPreloadedModule() {
        if (!this.extractor.initialized) {
            await this.init()
        }
        await this.createExtractedCSSResult()
        return toPreloadedModule(this.preloaded)
    }

    private async createExtractedCSS(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        return (await this.createExtractedCSSResult(options)).css
    }

    private async registerStyleCSSSource(modulePath: string, source: string) {
        await registerExtractorStyleCSSSource(this.extractor, this.styleCSSSources, modulePath, source, {
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
                if (resolveMasterStyleSource(modulePath, source, this.cwd)) {
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

    private createContext(compiler: Compiler): MasterCSSWebpackContext {
        const compilerContext = compiler.context || this.cwd || process.cwd()
        const context: MasterCSSWebpackContext = {
            name: NAME,
            cwd: this.cwd,
            compilerContext,
            virtualCSSImportModuleId: toVirtualCSSModulePath(compilerContext),
            virtualConfigModuleId: toVirtualDefaultConfigModulePath(compilerContext),
            virtualPreloadedModuleId: toVirtualPreloadedModulePath(compilerContext),
            on: (...args) => this.on(...args),
            init: (customOptions = this.customOptions) => this.init(customOptions),
            reset: (customOptions = this.customOptions) => this.reset(customOptions),
            prepare: () => this.prepare(),
            startWatch: () => this.startWatch(),
            getOptions: () => this.options,
            getPluginInitialized: () => this.pluginInitialized,
            setPluginInitialized: (pluginInitialized) => {
                this.pluginInitialized = pluginInitialized
            },
            getDefaultConfigDependencyPaths: () => this.getDefaultConfigDependencyPaths(),
            setModuleContent: (modulePath, moduleContent) => {
                this.moduleContentByPath[modulePath] = moduleContent
            },
            createDefaultConfigModule: () => this.createDefaultConfigModule(),
            createPreloadedModule: () => this.createPreloadedModule(),
            processModuleContents: (entries, isGeneratedCSSModulePath) => this.processModuleContents(entries, isGeneratedCSSModulePath),
            writeGeneratedCSSModule: async () => {
                if (!context.virtualModule || !context.virtualCSSImportModuleId) return
                const result = await this.createExtractedCSSResult({
                    includeNativeCSS: false,
                    includeMasterBaseCSS: false
                })
                context.virtualModule.writeModule(context.virtualCSSImportModuleId, result.css)
                await context.writePreloadedModule()
            },
            writeDefaultConfigModule: async () => {
                if (!context.virtualModule || !context.virtualConfigModuleId) return
                context.virtualModule.writeModule(context.virtualConfigModuleId, await this.createDefaultConfigModule())
            },
            writePreloadedModule: async () => {
                if (!context.virtualModule || !context.virtualPreloadedModuleId) return
                context.virtualModule.writeModule(context.virtualPreloadedModuleId, toPreloadedModule(this.preloaded))
            },
            replayModuleContents: async () => {
                const entries = Object.entries(this.moduleContentByPath)
                    .map(([modulePath, moduleContent]) => [modulePath, String(moduleContent)] as [string, string])
                await this.processModuleContents(entries, context.isGeneratedCSSModulePath)
            },
            queueResetReplay: () => {
                this.resetReplayChain = this.resetReplayChain
                    .then(context.replayModuleContents)
                    .then(context.writeGeneratedCSSModule)
                    .catch((error: unknown) => {
                        console.error('[master-css.webpack] reset replay failed:', error)
                    })
                return this.resetReplayChain
            },
            waitForResetReplay: () => this.resetReplayChain,
            isGeneratedCSSModulePath: (modulePath) => {
                const normalizedModulePath = normalizePath(modulePath)
                const normalizedGeneratedCSSImportModuleId = normalizePath(context.virtualCSSImportModuleId)
                return normalizedModulePath === normalizedGeneratedCSSImportModuleId
            }
        }

        return context
    }

    private createSubPlugins(context: MasterCSSWebpackContext): WebpackSubPlugin[] {
        return [
            ExtractorLifecyclePlugin(context),
            VirtualModuleRegistryPlugin(context),
            ConfigVirtualModulePlugin(context),
            VirtualCSSImportPlugin(context),
            ConfigLoaderPlugin(context),
            StyleEntryPlugin(context),
            UsageGraphPlugin(context)
        ]
    }

    apply(compiler: Compiler) {
        const context = this.createContext(compiler)
        for (const plugin of this.createSubPlugins(context)) {
            plugin.apply(compiler)
        }
    }
}
