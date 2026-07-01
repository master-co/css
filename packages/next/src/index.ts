import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { NextConfig } from 'next'
import { createMasterCSSManifestEntryPattern } from '@master/css-project/entries'
import {
    MASTER_CSS_MANIFEST_QUERY,
    VIRTUAL_MANIFEST_ID
} from '@master/css-integration/manifest-module'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import { VIRTUAL_EMITTED_GLOBALS_ID } from '@master/css-integration/emitted-globals-module'
import {
    createVirtualDefaultManifestModulePathPattern,
    ensureVirtualManifestModulePath,
    ensureVirtualEmittedGlobalsModulePath,
    ensureVirtualModuleFile,
    ensureVirtualModulePackageJSONPath
} from '@master/css-integration/node'
import {
    prepareNextStatic,
    resolveStaticOutputPath,
    resolveStaticStatePath,
} from './static'
import { registerOptions, resolveOptions, type Options } from './options'

type WithAdapterPath<T extends NextConfig> = T & { adapterPath: string }
type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>
type TurbopackRuleConfigCollection = TurbopackRules[string]
const MASTER_CSS_MANIFEST_RESOURCE_QUERY = new RegExp(MASTER_CSS_MANIFEST_QUERY.slice(1))
const MASTER_CSS_MANIFEST_IMPORT_CONTENT_PATTERN = new RegExp(`\\${MASTER_CSS_MANIFEST_QUERY}`)
const MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN = createVirtualDefaultManifestModulePathPattern()
const MASTER_CSS_STYLE_CONTENT_PATTERN = new RegExp(`${createMasterCSSManifestEntryPattern().source}|@(compose|at)\\b`)
const NEXT_INSTRUMENTATION_CLIENT_ID = 'private-next-instrumentation-client'
const MASTER_CSS_USER_INSTRUMENTATION_CLIENT_ID = 'private-next-master-css-user-instrumentation-client'
const NEXT_REQUIRE_INSTRUMENTATION_CLIENT_IDS = [
    '../lib/require-instrumentation-client',
    '../lib/require-instrumentation-client.js',
    'next/dist/lib/require-instrumentation-client',
    'next/dist/esm/lib/require-instrumentation-client'
]
const COMPOSED_ADAPTER_FILE = 'master-css-next-adapter.js'
const INSTRUMENTATION_CLIENT_FILE = 'master-css-next-instrumentation-client.cjs'
const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.js', import.meta.url))
}

function resolveComposedAdapterPath(projectDir = process.cwd()) {
    return resolve(projectDir, 'node_modules', '.master-css', COMPOSED_ADAPTER_FILE)
}

function resolveCSSManifestLoaderPath() {
    return fileURLToPath(new URL('./css-manifest-loader.js', import.meta.url))
}

function resolveCSSManifestImportLoaderPath() {
    return fileURLToPath(new URL('./css-manifest-import-loader.js', import.meta.url))
}

function resolveStyleCSSLoaderPath() {
    return fileURLToPath(new URL('./style-css-loader.js', import.meta.url))
}

function createInstrumentationClientSource() {
    return [
        `require('private-next-master-css-user-instrumentation-client')`,
        `const { CSSRuntime } = require('@master/css-runtime')`,
        `const masterCSSManifestModule = require('virtual:master-css-manifest')`,
        `const masterCSSEmittedGlobalsModule = require('virtual:master-css-emitted-globals')`,
        ``,
        `const state = (globalThis.__MASTER_CSS_NEXT_RUNTIME__ ??= {})`,
        ``,
        `async function resolveModuleDefault(module) {`,
        `    const resolvedModule = await module`,
        `    return resolvedModule?.default || resolvedModule`,
        `}`,
        ``,
        `function destroyRuntime() {`,
        `    state.runtime?.destroy()`,
        `    state.runtime = undefined`,
        `}`,
        ``,
        `function disposeRuntime() {`,
        `    state.hotRegistered = false`,
        `    state.startToken = {}`,
        `    destroyRuntime()`,
        `}`,
        ``,
        `async function startRuntime(manifestModule = masterCSSManifestModule, emittedGlobalsModule = masterCSSEmittedGlobalsModule) {`,
        `    if (typeof document === 'undefined') return`,
        `    const startToken = {}`,
        `    state.startToken = startToken`,
        `    destroyRuntime()`,
        `    const manifest = await resolveModuleDefault(manifestModule)`,
        `    const emittedGlobals = await resolveModuleDefault(emittedGlobalsModule)`,
        `    if (state.startToken !== startToken) return`,
        `    const nextRuntime = CSSRuntime.create({ manifest, emittedGlobals })`,
        `    state.runtime = nextRuntime`,
        `    if (nextRuntime.needsHydrationManifest()) {`,
        `        await nextRuntime.loadHydrationManifest()`,
        `    }`,
        `    if (state.startToken !== startToken) {`,
        `        nextRuntime.destroy()`,
        `        return`,
        `    }`,
        `    state.runtime = nextRuntime.observe()`,
        `}`,
        ``,
        `function startMasterCSSNextRuntime() {`,
        `    if (typeof document !== 'undefined') {`,
        `        void startRuntime()`,
        `    }`,
        `    const hot = module.hot`,
        `    if (hot && !state.hotRegistered) {`,
        `        state.hotRegistered = true`,
        `        hot.accept(() => {})`,
        `        hot.accept([`,
        `            'virtual:master-css-manifest',`,
        `            'virtual:master-css-emitted-globals'`,
        `        ], () => {`,
        `            const nextManifestModule = require('virtual:master-css-manifest')`,
        `            const nextEmittedGlobalsModule = require('virtual:master-css-emitted-globals')`,
        `            void startRuntime(`,
        `                nextManifestModule,`,
        `                nextEmittedGlobalsModule`,
        `            )`,
        `        })`,
        `        hot.dispose(disposeRuntime)`,
        `    }`,
        `}`,
        ``,
        `startMasterCSSNextRuntime()`,
        ``
    ].join('\n')
}

function ensureInstrumentationClientPath(projectDir = process.cwd()) {
    return ensureVirtualModuleFile(
        join(projectDir, 'node_modules', '.master-css', INSTRUMENTATION_CLIENT_FILE),
        createInstrumentationClientSource()
    )
}

function resolveEmptyModulePath() {
    return fileURLToPath(new URL('./empty.js', import.meta.url))
}

function resolveUserInstrumentationClientPath(projectDir: string) {
    if (resolve(projectDir) === PACKAGE_ROOT) return
    const names = [
        resolve(projectDir, 'src', 'instrumentation-client'),
        resolve(projectDir, 'instrumentation-client')
    ]
    const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
    for (const name of names) {
        for (const extension of extensions) {
            const file = `${name}${extension}`
            if (existsSync(file)) return file
        }
    }
}

function resolveStaticLoaderPath() {
    return fileURLToPath(new URL('./static-loader.js', import.meta.url))
}

function resolveStaticCSSLoaderPath() {
    return fileURLToPath(new URL('./static-css-loader.js', import.meta.url))
}

function resolveEmptyCSSPath() {
    return fileURLToPath(new URL('../empty.css', import.meta.url))
}

function createComposedAdapterSource(masterAdapterPath: string, externalAdapterPath: string, adapterOrder: string) {
    return [
        `import { createRequire } from 'node:module'`,
        `import { pathToFileURL } from 'node:url'`,
        `import { createAdapter, createComposedAdapter } from ${JSON.stringify(pathToFileURL(masterAdapterPath).href)}`,
        ``,
        `const require = createRequire(import.meta.url)`,
        `const externalAdapterPath = ${JSON.stringify(externalAdapterPath)}`,
        `const adapterOrder = ${JSON.stringify(adapterOrder)}`,
        ``,
        `async function loadExternalAdapter() {`,
        `    const resolvedAdapterPath = require.resolve(externalAdapterPath)`,
        `    return import(pathToFileURL(resolvedAdapterPath).href)`,
        `}`,
        ``,
        `export default createComposedAdapter(createAdapter(), loadExternalAdapter, { order: adapterOrder })`,
        ``
    ].join('\n')
}

function ensureComposedAdapterPath(projectDir: string, masterAdapterPath: string, externalAdapterPath: string, adapterOrder: string) {
    const composedAdapterPath = resolveComposedAdapterPath(projectDir)
    ensureVirtualModulePackageJSONPath(projectDir)
    mkdirSync(dirname(composedAdapterPath), { recursive: true })
    writeFileSync(
        composedAdapterPath,
        createComposedAdapterSource(masterAdapterPath, externalAdapterPath, adapterOrder)
    )
    return composedAdapterPath
}

function ensureVirtualManifestPath(projectDir = process.cwd()) {
    return ensureVirtualManifestModulePath(projectDir)
}

function ensureVirtualEmittedGlobalsPath(projectDir = process.cwd()) {
    return ensureVirtualEmittedGlobalsModulePath(projectDir)
}

function toTurbopackProjectPath(file: string, projectDir = process.cwd()) {
    const relativePath = relative(projectDir, file).replace(/\\/g, '/')
    return relativePath.startsWith('./') || relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

function toRuleArray(rule: TurbopackRuleConfigCollection | undefined) {
    return Array.isArray(rule) ? rule : rule ? [rule] : []
}

function applyMasterCSSWebpackConfig(
    config: WebpackConfig,
    cssManifestLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualManifestPath: string,
    virtualEmittedGlobalsPath: string,
    runtimeInstrumentationPath: string | undefined,
    projectDir: string
) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
        test: MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN,
        use: [
            {
                loader: cssManifestLoaderPath,
                options: {
                    virtual: true,
                    module: true,
                    external: true
                }
            }
        ]
    })
    config.module.rules.push({
        resourceQuery: MASTER_CSS_MANIFEST_RESOURCE_QUERY,
        use: [
            {
                loader: cssManifestLoaderPath,
                options: {
                    module: true,
                    external: true
                }
            }
        ]
    })
    config.module.rules.push({
        test: /\.(css|scss|sass)$/,
        resourceQuery: {
            not: [
                MASTER_CSS_MANIFEST_RESOURCE_QUERY
            ]
        },
        use: [
            {
                loader: styleCSSLoaderPath
            }
        ]
    })
    config.resolve ??= {}
    const aliases = config.resolve.alias || {}
    const userInstrumentationAlias = aliases[NEXT_INSTRUMENTATION_CLIENT_ID]
        || resolveUserInstrumentationClientPath(projectDir)
        || resolveEmptyModulePath()
    config.resolve.alias = {
        ...aliases,
        [VIRTUAL_CSS_ID]: virtualCSSPath,
        [VIRTUAL_MANIFEST_ID]: virtualManifestPath,
        [VIRTUAL_EMITTED_GLOBALS_ID]: virtualEmittedGlobalsPath,
        ...(runtimeInstrumentationPath
            ? {
                [MASTER_CSS_USER_INSTRUMENTATION_CLIENT_ID]: userInstrumentationAlias,
                [NEXT_INSTRUMENTATION_CLIENT_ID]: runtimeInstrumentationPath,
                ...Object.fromEntries(NEXT_REQUIRE_INSTRUMENTATION_CLIENT_IDS.map((id) => [id, runtimeInstrumentationPath]))
            }
            : {})
    }
    return config
}

function applyMasterCSSTurbopackConfig(
    nextConfig: NextConfig,
    cssManifestLoaderPath: string,
    cssManifestImportLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualManifestPath: string,
    virtualEmittedGlobalsPath: string,
    projectDir: string,
    runtimeInstrumentationPath?: string,
    includeStyleRule = true
) {
    const rules = nextConfig.turbopack?.rules || {}
    const configRules = rules['*']
    const configImportSourceRules = createCSSManifestImportSourceRules(cssManifestImportLoaderPath, projectDir)
    const resolveAlias = nextConfig.turbopack?.resolveAlias || {}
    const resolvedUserInstrumentationPath = resolveUserInstrumentationClientPath(projectDir) || resolveEmptyModulePath()
    const userInstrumentationAlias = resolveAlias[NEXT_INSTRUMENTATION_CLIENT_ID]
        || toTurbopackProjectPath(resolvedUserInstrumentationPath, projectDir)
    const turbopackRuntimeInstrumentationPath = runtimeInstrumentationPath
        ? toTurbopackProjectPath(runtimeInstrumentationPath, projectDir)
        : undefined
    const masterCSSVirtualManifestRule = {
        condition: {
            path: MASTER_CSS_VIRTUAL_MANIFEST_PATH_PATTERN
        },
        loaders: [
            {
                loader: cssManifestLoaderPath,
                options: {
                    virtual: true,
                    module: true,
                    external: true
                }
            }
        ],
        type: 'ecmascript' as const
    }
    const masterCSSManifestRule = {
        condition: {
            all: [
                { path: /\.css$/ },
                { query: MASTER_CSS_MANIFEST_RESOURCE_QUERY }
            ]
        },
        loaders: [
            {
                loader: cssManifestLoaderPath,
                options: {
                    module: true,
                    external: true
                }
            }
        ],
        type: 'ecmascript' as const,
        as: '*.js'
    }
    const masterCSSStyleRule = {
        condition: {
            all: [
                { path: /\.(css|scss|sass)$/ },
                { content: MASTER_CSS_STYLE_CONTENT_PATTERN },
                { not: { query: MASTER_CSS_MANIFEST_RESOURCE_QUERY } }
            ]
        },
        loaders: [styleCSSLoaderPath],
        type: 'css' as const,
        as: '*.css'
    }
    return {
        ...nextConfig.turbopack,
        resolveAlias: {
            ...resolveAlias,
            [VIRTUAL_CSS_ID]: virtualCSSPath,
            [VIRTUAL_MANIFEST_ID]: virtualManifestPath,
            [VIRTUAL_EMITTED_GLOBALS_ID]: virtualEmittedGlobalsPath,
            ...(turbopackRuntimeInstrumentationPath
                ? {
                    [MASTER_CSS_USER_INSTRUMENTATION_CLIENT_ID]: userInstrumentationAlias,
                    [NEXT_INSTRUMENTATION_CLIENT_ID]: turbopackRuntimeInstrumentationPath,
                    ...Object.fromEntries(NEXT_REQUIRE_INSTRUMENTATION_CLIENT_IDS.map((id) => [id, turbopackRuntimeInstrumentationPath]))
                }
                : {})
        },
        rules: {
            ...rules,
            ...Object.fromEntries(configImportSourceRules.map(([glob, rule]) => [
                glob,
                [
                    rule,
                    ...toRuleArray(rules[glob])
                ]
            ])),
            '*': [
                masterCSSVirtualManifestRule,
                masterCSSManifestRule,
                ...(includeStyleRule ? [masterCSSStyleRule] : []),
                ...toRuleArray(configRules)
            ]
        } satisfies TurbopackRules
    }
}

function createStaticSourceRule(path: RegExp, as: string, type: 'typescript' | 'ecmascript') {
    return {
        condition: {
            all: [
                { not: 'foreign' as const },
                { path }
            ]
        },
        as,
        type
    }
}

function createCSSManifestImportSourceRules(cssManifestImportLoaderPath: string, projectDir: string) {
    const loader = {
        loader: cssManifestImportLoaderPath,
        options: {
            projectDir
        }
    }
    const sourceRules = [
        ['*.js', 'ecmascript'],
        ['*.cjs', 'ecmascript'],
        ['*.ts', 'typescript']
    ] as const
    return sourceRules.map(([glob, type]) => [glob, {
        condition: {
            all: [
                { not: 'foreign' as const },
                { content: MASTER_CSS_MANIFEST_IMPORT_CONTENT_PATTERN }
            ]
        },
        type,
        loaders: [loader]
    }] as const)
}

function applyMasterCSSStaticTurbopackConfig(
    nextConfig: NextConfig,
    cssManifestLoaderPath: string,
    cssManifestImportLoaderPath: string,
    styleCSSLoaderPath: string,
    staticLoaderPath: string,
    staticCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualManifestPath: string,
    virtualEmittedGlobalsPath: string,
    projectDir: string,
    statePath: string
) {
    const turbopackConfig = applyMasterCSSTurbopackConfig(nextConfig, cssManifestLoaderPath, cssManifestImportLoaderPath, styleCSSLoaderPath, virtualCSSPath, virtualManifestPath, virtualEmittedGlobalsPath, projectDir, undefined, false)
    const rules = turbopackConfig.rules || {}
    const starRules = toRuleArray(rules['*'])
    const staticLoader = {
        loader: staticLoaderPath,
        options: {
            statePath
        }
    }
    const sourceRules = [
        createStaticSourceRule(/\.tsx$/, '*.tsx', 'typescript'),
        createStaticSourceRule(/\.ts$/, '*.ts', 'typescript'),
        createStaticSourceRule(/\.mts$/, '*.mts', 'typescript'),
        createStaticSourceRule(/\.cts$/, '*.cts', 'typescript'),
        createStaticSourceRule(/\.jsx$/, '*.jsx', 'ecmascript'),
        createStaticSourceRule(/\.js$/, '*.js', 'ecmascript'),
        createStaticSourceRule(/\.cjs$/, '*.cjs', 'ecmascript')
    ].map((rule) => ({
        ...rule,
        loaders: [staticLoader]
    }))
    const cssImportRule = {
        condition: {
            all: [
                { not: 'foreign' as const },
                { path: /\.(css|scss|sass)$/ },
                { content: createMasterCSSManifestEntryPattern() },
                { not: { query: MASTER_CSS_MANIFEST_RESOURCE_QUERY } }
            ]
        },
        loaders: [
            {
                loader: staticCSSLoaderPath,
                options: {
                    statePath
                }
            }
        ],
        type: 'css' as const,
        as: '*.css'
    }

    return {
        ...turbopackConfig,
        rules: {
            ...rules,
            '*': [
                ...sourceRules,
                cssImportRule,
                ...starRules
            ]
        } satisfies TurbopackRules
    }
}

function createNextConfigWithCSSManifestLoader<T extends NextConfig>(
    nextConfig: T,
    cssManifestLoaderPath: string,
    cssManifestImportLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    webpackVirtualManifestPath: string,
    turbopackVirtualManifestPath: string,
    webpackVirtualEmittedGlobalsPath: string,
    turbopackVirtualEmittedGlobalsPath: string,
    projectDir: string,
    runtimeInstrumentationPath?: string
) {
    const userWebpack = nextConfig.webpack
    return {
        ...nextConfig,
        turbopack: applyMasterCSSTurbopackConfig(nextConfig, cssManifestLoaderPath, cssManifestImportLoaderPath, styleCSSLoaderPath, virtualCSSPath, turbopackVirtualManifestPath, turbopackVirtualEmittedGlobalsPath, projectDir, runtimeInstrumentationPath),
        webpack(config: WebpackConfig, context: WebpackContext) {
            const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
            return applyMasterCSSWebpackConfig(resolvedConfig, cssManifestLoaderPath, styleCSSLoaderPath, virtualCSSPath, webpackVirtualManifestPath, webpackVirtualEmittedGlobalsPath, runtimeInstrumentationPath, projectDir)
        }
    } as T
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null | 'runtime' }): T
export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: 'static' }): Promise<T>
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> | Promise<T> {
    const projectDir = process.cwd()
    const resolvedOptions = resolveOptions(options)
    const cssManifestLoaderPath = resolveCSSManifestLoaderPath()
    const cssManifestImportLoaderPath = resolveCSSManifestImportLoaderPath()
    const styleCSSLoaderPath = resolveStyleCSSLoaderPath()
    const virtualManifestPath = ensureVirtualManifestPath(projectDir)
    const virtualEmittedGlobalsPath = ensureVirtualEmittedGlobalsPath(projectDir)
    const turbopackVirtualManifestPath = toTurbopackProjectPath(virtualManifestPath, projectDir)
    const turbopackVirtualEmittedGlobalsPath = toTurbopackProjectPath(virtualEmittedGlobalsPath, projectDir)
    const runtimeInstrumentationPath = resolvedOptions.injectRuntime && (resolvedOptions.mode === 'runtime' || resolvedOptions.mode === 'progressive')
        ? ensureInstrumentationClientPath(projectDir)
        : undefined
    registerOptions(options)

    if (resolvedOptions.mode === 'static') {
        return prepareNextStatic(options, {
            watch: process.env.NODE_ENV === 'development'
        }).then((setup) => {
            if (!setup) return nextConfig
            const outputPath = resolveStaticOutputPath(setup.projectDir)
            const statePath = resolveStaticStatePath(outputPath)
            const turbopackVirtualCSSPath = toTurbopackProjectPath(outputPath, setup.projectDir)
            return {
                ...nextConfig,
                turbopack: applyMasterCSSStaticTurbopackConfig(
                    nextConfig,
                    cssManifestLoaderPath,
                    cssManifestImportLoaderPath,
                    styleCSSLoaderPath,
                    resolveStaticLoaderPath(),
                    resolveStaticCSSLoaderPath(),
                    turbopackVirtualCSSPath,
                    turbopackVirtualManifestPath,
                    turbopackVirtualEmittedGlobalsPath,
                    setup.projectDir,
                    statePath
                )
            } as T
        })
    }

    const nextConfigWithCSSManifestLoader = createNextConfigWithCSSManifestLoader(
        nextConfig,
        cssManifestLoaderPath,
        cssManifestImportLoaderPath,
        styleCSSLoaderPath,
        resolveEmptyCSSPath(),
        virtualManifestPath,
        turbopackVirtualManifestPath,
        virtualEmittedGlobalsPath,
        turbopackVirtualEmittedGlobalsPath,
        projectDir,
        runtimeInstrumentationPath
    )

    if (resolvedOptions.mode === null || resolvedOptions.mode === 'runtime') return nextConfigWithCSSManifestLoader

    const adapterPath = resolveAdapterPath()
    const composedAdapterPath = resolveComposedAdapterPath(projectDir)
    const configuredAdapterPath = nextConfig.adapterPath
    const externalAdapterPath = configuredAdapterPath && configuredAdapterPath !== adapterPath && configuredAdapterPath !== composedAdapterPath
        ? configuredAdapterPath
        : process.env.NEXT_ADAPTER_PATH && process.env.NEXT_ADAPTER_PATH !== adapterPath && process.env.NEXT_ADAPTER_PATH !== composedAdapterPath
            ? process.env.NEXT_ADAPTER_PATH
            : undefined
    const nextAdapterPath = configuredAdapterPath === composedAdapterPath
        ? configuredAdapterPath
        : externalAdapterPath
            ? ensureComposedAdapterPath(projectDir, adapterPath, externalAdapterPath, resolvedOptions.adapterOrder)
            : adapterPath

    return {
        ...nextConfigWithCSSManifestLoader,
        adapterPath: nextAdapterPath
    } as WithAdapterPath<T>
}

export type { Options } from './options'
export { createAdapter, createComposedAdapter, renderNextBuildOutputs } from './adapter'

export default withMasterCSS
