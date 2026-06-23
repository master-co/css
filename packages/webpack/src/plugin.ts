import { CSSScanner, type ScannerOptions } from '@master/css-scanner'
import type { MasterCSSEmittedGlobals } from '@master/css'
import { toManifestJSON } from '@master/css-integration/manifest-module'
import { toBrowserManifestFacadeModule } from '@master/css-integration/manifest-facade'
import {
    toHashedManifestAssetFileName,
    toVirtualCSSModulePath,
    toVirtualDefaultManifestModulePath,
    toVirtualEmittedGlobalsModulePath
} from '@master/css-integration/node'
import { loadProjectManifest } from '@master/css-project/manifest'
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
import ScannerLifecyclePlugin from './plugins/scanner-lifecycle'
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
    on(...args: Parameters<CSSScanner['on']>): unknown
    init(customOptions?: ScannerOptions): Promise<unknown>
    reset(customOptions?: ScannerOptions): Promise<unknown>
    prepare(): Promise<unknown> | unknown
    getOptions(): ScannerOptions
    getPluginInitialized(): boolean
    setPluginInitialized(pluginInitialized: boolean): void
    getDefaultManifestDependencyPaths(): string[]
    getResetDependencyPaths(): string[]
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

    readonly scanner: CSSScanner
    pluginInitialized = false
    moduleContentByPath: Record<string, unknown> = {}
    manifestJSONAssets = new Map<string, string>()
    defaultManifestDependencies: string[] = []
    emittedGlobals: MasterCSSEmittedGlobals = {}
    resetReplayChain: Promise<unknown> = Promise.resolve()
    styleCSSSources: StyleCSSSources = new Map()

    constructor(
        customOptions: ScannerOptions = {},
        public cwd = process.cwd()
    ) {
        this.scanner = new CSSScanner(customOptions, cwd)
    }

    get customOptions() {
        return this.scanner.customOptions
    }

    set customOptions(customOptions: ScannerOptions) {
        this.scanner.customOptions = customOptions
    }

    get options() {
        return this.scanner.options
    }

    get css() {
        return this.scanner.css
    }

    get manifest() {
        return this.scanner.manifest
    }

    get slotCSSRule() {
        return this.scanner.slotCSSRule
    }

    get latentClasses() {
        return this.scanner.latentClasses
    }

    get validClasses() {
        return this.scanner.validClasses
    }

    get invalidClasses() {
        return this.scanner.invalidClasses
    }

    get nativeClassNames() {
        return this.scanner.nativeClassNames
    }

    get usedNativeClasses() {
        return this.scanner.usedNativeClasses
    }

    on(...args: Parameters<CSSScanner['on']>) {
        this.scanner.on(...args)
        return this
    }

    emit(...args: Parameters<CSSScanner['emit']>) {
        return this.scanner.emit(...args)
    }

    async init(customOptions: ScannerOptions = this.customOptions) {
        await this.scanner.init(customOptions)
        return this
    }

    async reset(customOptions: ScannerOptions = this.customOptions) {
        await this.scanner.reset(customOptions)
        return this
    }

    prepare() {
        return this.scanner.prepare()
    }

    scan(source: string, content: string) {
        return this.scanner.scan(source, content)
    }

    private async createDefaultManifestModule() {
        const result = await loadProjectManifest(this.cwd)
        this.scanner.customOptions = {
            ...this.scanner.customOptions,
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

    private getResetDependencyPaths() {
        return [...new Set([
            ...this.defaultManifestDependencies,
            ...Array.from(this.styleCSSSources.values()).flatMap((source) => source.dependencies),
            ...this.scanner.resetDependencies
        ])]
    }

    private getScannerClasses() {
        return [...new Set([
            ...(this.scanner.latentClasses || []),
            ...(this.scanner.validClasses || []),
            ...(this.scanner.usedNativeClasses || []),
            ...(this.options.safelist || [])
        ])]
    }

    private async createExtractedCSSResult(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        const result = await createExtractedCSSResult({
            scanner: this.scanner,
            styleCSSSources: this.styleCSSSources,
            classes: this.getScannerClasses(),
            projectDir: this.cwd,
            includeNativeCSS: options.includeNativeCSS,
            includeMasterBaseCSS: options.includeMasterBaseCSS
        })
        this.emittedGlobals = result.emittedGlobals
        return result
    }

    private async createEmittedGlobalsModule() {
        if (!this.scanner.initialized) {
            await this.init()
        }
        await this.createExtractedCSSResult()
        return toEmittedGlobalsModule(this.emittedGlobals)
    }

    private async createExtractedCSS(options: { includeNativeCSS?: boolean, includeMasterBaseCSS?: boolean } = {}) {
        return (await this.createExtractedCSSResult(options)).css
    }

    private async registerStyleCSSSource(modulePath: string, source: string) {
        await registerStylesheetCSSSource(this.scanner, this.styleCSSSources, modulePath, source, {
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
            this.scan(modulePath, content)
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
            getOptions: () => this.options,
            getPluginInitialized: () => this.pluginInitialized,
            setPluginInitialized: (pluginInitialized) => {
                this.pluginInitialized = pluginInitialized
            },
            getDefaultManifestDependencyPaths: () => this.getDefaultManifestDependencyPaths(),
            getResetDependencyPaths: () => this.getResetDependencyPaths(),
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
            ScannerLifecyclePlugin(context),
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
