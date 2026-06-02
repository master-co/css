import { CSSExtractor, type Options } from '@master/css-extractor'
import { loadConfigModule } from '@master/css-configer/load'
import {
    resolveConfigPath,
    warnMissingConfig,
    type ExploreConfigPath
} from '@master/css-configer/path'
import {
    EMPTY_CONFIG_MODULE,
    toConfigModule,
    toVirtualDefaultConfigModulePath
} from '@master/css-configer/module'
import { createExtractedCSS, registerStyleCSSSource as registerExtractorStyleCSSSource, type StyleCSSSources } from '@master/css-extractor/style'
import { toVirtualCSSModulePath } from 'shared/css-virtual-module'
import type { Compiler } from 'webpack'
import type VirtualModulesPlugin from 'webpack-virtual-modules'
import { readFileSync } from 'node:fs'
import {
    cleanStyleRequest,
    hasMasterCSSImport,
    hasMasterShakeDirective,
    isMasterStyleSource,
    isStyleCSSRequest,
    resolveStyleCSSImportGraph
} from './utils/style-css'
import { normalizePath } from './utils/path'
import { ExtractorLifecyclePlugin } from './plugins/extractor-lifecycle'
import { VirtualModuleRegistryPlugin } from './plugins/virtual-modules'
import { ConfigVirtualModulePlugin } from './plugins/config-virtual-module'
import { VirtualCSSImportPlugin } from './plugins/virtual-css-import'
import { ConfigLoaderPlugin } from './plugins/config-loader'
import { UsageGraphPlugin } from './plugins/usage-graph'

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
    virtualModule?: VirtualModulesPlugin
    resetReplayChain: Promise<unknown>
    on(...args: Parameters<CSSExtractor['on']>): unknown
    init(customOptions?: Options): Promise<unknown>
    reset(customOptions?: Options): Promise<unknown>
    prepare(): Promise<unknown> | unknown
    startWatch(): Promise<unknown> | unknown
    getOptions(): Options
    getPluginInitialized(): boolean
    setPluginInitialized(pluginInitialized: boolean): void
    getDefaultConfigDependencies(): string[]
    setModuleContent(modulePath: string, moduleContent: unknown): void
    resolveDefaultConfigPath(): ExploreConfigPath | undefined
    warnMissingDefaultConfig(): void
    createDefaultConfigModule(resolvedConfig?: ExploreConfigPath): Promise<string>
    processModuleContents(
        entries: [string, string][],
        isGeneratedCSSModulePath: (modulePath: string) => boolean
    ): Promise<void>
    writeGeneratedCSSModule(): Promise<void>
    writeDefaultConfigModule(): Promise<void>
    replayModuleContents(): Promise<void>
    isGeneratedCSSModulePath(modulePath: string): boolean
}

export class MasterCSSPlugin {

    readonly extractor: CSSExtractor
    pluginInitialized = false
    moduleContentByPath: Record<string, unknown> = {}
    defaultConfigDependencies: string[] = []
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

    get resolvedConfigPath() {
        return this.extractor.resolvedConfigPath
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
            ...(this.extractor.latentClasses || []),
            ...(this.extractor.validClasses || []),
            ...(this.extractor.usedNativeClasses || []),
            ...(this.options.includeClasses || [])
        ])]
    }

    private async createExtractedCSS(options: { includeNativeCSS?: boolean } = {}) {
        return createExtractedCSS({
            extractor: this.extractor,
            styleCSSSources: this.styleCSSSources,
            classes: this.getExtractorClasses(),
            loadConfigMode: 'css',
            projectDir: this.cwd,
            includeNativeCSS: options.includeNativeCSS
        })
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
                if (
                    (hasMasterShakeDirective(source) || hasMasterCSSImport(source)) &&
                    isMasterStyleSource(resolveStyleCSSImportGraph(modulePath, source, this.cwd).source)
                ) {
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
            resetReplayChain: Promise.resolve(),
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
            getDefaultConfigDependencies: () => this.defaultConfigDependencies,
            setModuleContent: (modulePath, moduleContent) => {
                this.moduleContentByPath[modulePath] = moduleContent
            },
            resolveDefaultConfigPath: () => this.resolveDefaultConfigPath(),
            warnMissingDefaultConfig: () => this.warnMissingDefaultConfig(),
            createDefaultConfigModule: (resolvedConfig) => this.createDefaultConfigModule(resolvedConfig),
            processModuleContents: (entries, isGeneratedCSSModulePath) => this.processModuleContents(entries, isGeneratedCSSModulePath),
            writeGeneratedCSSModule: async () => {
                if (!context.virtualModule || !context.virtualCSSImportModuleId) return
                const cssText = await this.createExtractedCSS({ includeNativeCSS: false })
                context.virtualModule.writeModule(context.virtualCSSImportModuleId, cssText)
            },
            writeDefaultConfigModule: async () => {
                if (!context.virtualModule || !context.virtualConfigModuleId) return
                context.virtualModule.writeModule(context.virtualConfigModuleId, await this.createDefaultConfigModule())
            },
            replayModuleContents: async () => {
                const entries = Object.entries(this.moduleContentByPath)
                    .map(([modulePath, moduleContent]) => [modulePath, String(moduleContent)] as [string, string])
                await this.processModuleContents(entries, context.isGeneratedCSSModulePath)
            },
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
