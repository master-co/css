import { CSSExtractor, type Options } from '@master/css-extractor'
import type { MasterCSSEmittedGlobals } from '@master/css'
import { toManifestJSON } from '@master/css-integration/manifest-module'
import { toBrowserManifestFacadeModule } from '@master/css-integration/manifest-facade'
import {
    toHashedManifestAssetFileName,
    toVirtualCSSModulePath,
    toVirtualDefaultManifestModulePath,
    toVirtualEmittedGlobalsModulePath
} from '@master/css-integration/node'
import { loadProjectManifest } from '@master/css-manifest/load'
import {
    cleanStyleRequest,
    createExtractedCSSResult,
    isStyleCSSRequest,
    registerStyleCSSSource as registerStylesheetCSSSource,
    resolveMasterStyleSource,
    type StyleCSSSources
} from '@master/css-stylesheet'
import { toEmittedGlobalsModule } from '@master/css-integration/emitted-globals-module'
import type { Compiler } from 'webpack'
import type VirtualModulesPlugin from 'webpack-virtual-modules'
import { readFileSync } from 'node:fs'
import { normalizePath } from './utils/path'
import ExtractorLifecyclePlugin from './plugins/extractor-lifecycle'
import VirtualModuleRegistryPlugin from './plugins/virtual-modules'
import ManifestVirtualModulePlugin from './plugins/manifest-virtual-module'
import ManifestJSONAssetsPlugin from './plugins/manifest-json-assets'
import VirtualCSSImportPlugin from './plugins/virtual-css-import'
import ManifestLoaderPlugin from './plugins/manifest-loader'
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
    virtualManifestModuleId: string
    virtualEmittedGlobalsModuleId: string
    virtualModule?: VirtualModulesPlugin
    on(...args: Parameters<CSSExtractor['on']>): unknown
    init(customOptions?: Options): Promise<unknown>
    reset(customOptions?: Options): Promise<unknown>
    prepare(): Promise<unknown> | unknown
    startWatch(): Promise<unknown> | unknown
    getOptions(): Options
    getPluginInitialized(): boolean
    setPluginInitialized(pluginInitialized: boolean): void
    getDefaultManifestDependencyPaths(): string[]
    setModuleContent(modulePath: string, moduleContent: unknown): void
    setManifestJSONAsset(assetFileName: string, json: string): void
    getManifestJSONAssets(): [string, string][]
    createDefaultManifestModule(): Promise<string>
    createEmittedGlobalsModule(): Promise<string>
    processModuleContents(
        entries: [string, string][],
        isGeneratedCSSModulePath: (modulePath: string) => boolean
    ): Promise<void>
    writeGeneratedCSSModule(): Promise<void>
    writeDefaultManifestModule(): Promise<void>
    writeEmittedGlobalsModule(): Promise<void>
    replayModuleContents(): Promise<void>
    queueResetReplay(): Promise<unknown>
    waitForResetReplay(): Promise<unknown>
    isGeneratedCSSModulePath(modulePath: string): boolean
}

export class MasterCSSPlugin {

    readonly extractor: CSSExtractor
    pluginInitialized = false
    moduleContentByPath: Record<string, unknown> = {}
    manifestJSONAssets = new Map<string, string>()
    defaultManifestDependencies: string[] = []
    emittedGlobals: MasterCSSEmittedGlobals = {}
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

    get manifest() {
        return this.extractor.manifest
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

    private async createDefaultManifestModule() {
        const result = await loadProjectManifest(this.cwd)
        this.extractor.customOptions = {
            ...this.extractor.customOptions,
            manifest: result.manifest
        }
        this.defaultManifestDependencies = result.dependencies
        const json = toManifestJSON(result.manifest)
        const assetFileName = toHashedManifestAssetFileName(json)
        this.manifestJSONAssets.set(assetFileName, json)
        return toBrowserManifestFacadeModule(`__webpack_public_path__ + ${JSON.stringify(assetFileName)}`)
    }

    private getDefaultManifestDependencyPaths() {
        return this.defaultManifestDependencies
    }

    private getExtractorClasses() {
        return [...new Set([
            ...(this.extractor.latentClasses || []),
            ...(this.extractor.validClasses || []),
            ...(this.extractor.usedNativeClasses || []),
            ...(this.options.safelist || [])
        ])]
    }

    private async createExtractedCSSResult(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        const result = await createExtractedCSSResult({
            state: this.extractor,
            styleCSSSources: this.styleCSSSources,
            classes: this.getExtractorClasses(),
            projectDir: this.cwd,
            includeNativeCSS: options.includeNativeCSS,
            includeMasterBaseCSS: options.includeMasterBaseCSS
        })
        this.emittedGlobals = result.emittedGlobals
        return result
    }

    private async createEmittedGlobalsModule() {
        if (!this.extractor.initialized) {
            await this.init()
        }
        await this.createExtractedCSSResult()
        return toEmittedGlobalsModule(this.emittedGlobals)
    }

    private async createExtractedCSS(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        return (await this.createExtractedCSSResult(options)).css
    }

    private async registerStyleCSSSource(modulePath: string, source: string) {
        await registerStylesheetCSSSource(this.extractor, this.styleCSSSources, modulePath, source, {
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
            virtualManifestModuleId: toVirtualDefaultManifestModulePath(compilerContext),
            virtualEmittedGlobalsModuleId: toVirtualEmittedGlobalsModulePath(compilerContext),
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
            getDefaultManifestDependencyPaths: () => this.getDefaultManifestDependencyPaths(),
            setModuleContent: (modulePath, moduleContent) => {
                this.moduleContentByPath[modulePath] = moduleContent
            },
            setManifestJSONAsset: (assetFileName, json) => {
                this.manifestJSONAssets.set(assetFileName, json)
            },
            getManifestJSONAssets: () => [...this.manifestJSONAssets],
            createDefaultManifestModule: () => this.createDefaultManifestModule(),
            createEmittedGlobalsModule: () => this.createEmittedGlobalsModule(),
            processModuleContents: (entries, isGeneratedCSSModulePath) => this.processModuleContents(entries, isGeneratedCSSModulePath),
            writeGeneratedCSSModule: async () => {
                if (!context.virtualModule || !context.virtualCSSImportModuleId) return
                const result = await this.createExtractedCSSResult({
                    includeNativeCSS: false,
                    includeMasterBaseCSS: false
                })
                context.virtualModule.writeModule(context.virtualCSSImportModuleId, result.css)
                await context.writeEmittedGlobalsModule()
            },
            writeDefaultManifestModule: async () => {
                if (!context.virtualModule || !context.virtualManifestModuleId) return
                context.virtualModule.writeModule(context.virtualManifestModuleId, await this.createDefaultManifestModule())
            },
            writeEmittedGlobalsModule: async () => {
                if (!context.virtualModule || !context.virtualEmittedGlobalsModuleId) return
                context.virtualModule.writeModule(context.virtualEmittedGlobalsModuleId, toEmittedGlobalsModule(this.emittedGlobals))
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
            ManifestVirtualModulePlugin(context),
            ManifestJSONAssetsPlugin(context),
            VirtualCSSImportPlugin(context),
            ManifestLoaderPlugin(context),
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
