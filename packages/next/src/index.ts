import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, relative, resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { NextConfig } from 'next'
import { createMasterCSSPlanEntryPattern } from '@master/css-plan/css'
import {
    MASTER_CSS_PLAN_QUERY,
    VIRTUAL_PLAN_ID,
    createVirtualDefaultPlanModulePathPattern,
} from '@master/css-integration/plan-module'
import { VIRTUAL_CSS_ID } from '@master/css-integration/style-module'
import {
    VIRTUAL_PRELOADED_ID,
} from '@master/css-integration/preloaded-module'
import {
    ensureVirtualPlanModulePath,
    ensureVirtualPreloadedModulePath
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
const MASTER_CSS_PLAN_RESOURCE_QUERY = new RegExp(MASTER_CSS_PLAN_QUERY.slice(1))
const MASTER_CSS_PLAN_IMPORT_CONTENT_PATTERN = new RegExp(`\\${MASTER_CSS_PLAN_QUERY}`)
const MASTER_CSS_VIRTUAL_PLAN_PATH_PATTERN = createVirtualDefaultPlanModulePathPattern()
const MASTER_CSS_STYLE_CONTENT_PATTERN = new RegExp(`${createMasterCSSPlanEntryPattern().source}|@(compose|at)\\b`)
const MASTER_CSS_REACT_PACKAGE_NAME = '@master/css.react'
const COMPOSED_ADAPTER_FILE = 'master-css-next-adapter.mjs'

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.mjs', import.meta.url))
}

function resolveComposedAdapterPath(projectDir = process.cwd()) {
    return resolve(projectDir, 'node_modules/.master-css', COMPOSED_ADAPTER_FILE)
}

function resolveCSSPlanLoaderPath() {
    return fileURLToPath(new URL('./css-plan-loader.mjs', import.meta.url))
}

function resolveCSSPlanImportLoaderPath() {
    return fileURLToPath(new URL('./css-plan-import-loader.mjs', import.meta.url))
}

function resolveStyleCSSLoaderPath() {
    return fileURLToPath(new URL('./style-css-loader.mjs', import.meta.url))
}

function resolveStaticLoaderPath() {
    return fileURLToPath(new URL('./static-loader.mjs', import.meta.url))
}

function resolveStaticCSSLoaderPath() {
    return fileURLToPath(new URL('./static-css-loader.mjs', import.meta.url))
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
    mkdirSync(dirname(composedAdapterPath), { recursive: true })
    writeFileSync(
        composedAdapterPath,
        createComposedAdapterSource(masterAdapterPath, externalAdapterPath, adapterOrder)
    )
    return composedAdapterPath
}

function ensureVirtualPlanPath(projectDir = process.cwd()) {
    return ensureVirtualPlanModulePath(projectDir)
}

function ensureVirtualPreloadedPath(projectDir = process.cwd()) {
    return ensureVirtualPreloadedModulePath(projectDir)
}

function toTurbopackProjectPath(file: string, projectDir = process.cwd()) {
    const relativePath = relative(projectDir, file).replace(/\\/g, '/')
    return relativePath.startsWith('./') || relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}

function toRuleArray(rule: TurbopackRuleConfigCollection | undefined) {
    return Array.isArray(rule) ? rule : rule ? [rule] : []
}

function withTranspilePackage<T extends NextConfig>(nextConfig: T, packageName: string) {
    const transpilePackages = nextConfig.transpilePackages || []
    if (transpilePackages.includes(packageName)) return nextConfig
    return {
        ...nextConfig,
        transpilePackages: [
            ...transpilePackages,
            packageName
        ]
    } as T
}

function applyMasterCSSWebpackConfig(
    config: WebpackConfig,
    cssPlanLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualPlanPath: string,
    virtualPreloadedPath: string
) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
        test: MASTER_CSS_VIRTUAL_PLAN_PATH_PATTERN,
        type: 'json',
        use: [
            {
                loader: cssPlanLoaderPath,
                options: {
                    virtual: true
                }
            }
        ]
    })
    config.module.rules.push({
        resourceQuery: MASTER_CSS_PLAN_RESOURCE_QUERY,
        type: 'json',
        use: [
            {
                loader: cssPlanLoaderPath
            }
        ]
    })
    config.module.rules.push({
        test: /\.(css|scss|sass)$/,
        resourceQuery: {
            not: [
                MASTER_CSS_PLAN_RESOURCE_QUERY
            ]
        },
        use: [
            {
                loader: styleCSSLoaderPath
            }
        ]
    })
    config.resolve ??= {}
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        [VIRTUAL_CSS_ID]: virtualCSSPath,
        [VIRTUAL_PLAN_ID]: virtualPlanPath,
        [VIRTUAL_PRELOADED_ID]: virtualPreloadedPath
    }
    return config
}

function applyMasterCSSTurbopackConfig(
    nextConfig: NextConfig,
    cssPlanLoaderPath: string,
    cssPlanImportLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualPlanPath: string,
    virtualPreloadedPath: string,
    projectDir: string,
    includeStyleRule = true
) {
    const rules = nextConfig.turbopack?.rules || {}
    const configRules = rules['*']
    const configImportSourceRules = createCSSPlanImportSourceRules(cssPlanImportLoaderPath, projectDir)
    const masterCSSVirtualPlanRule = {
        condition: {
            path: MASTER_CSS_VIRTUAL_PLAN_PATH_PATTERN
        },
        loaders: [
            {
                loader: cssPlanLoaderPath,
                options: {
                    virtual: true
                }
            }
        ],
        type: 'json' as never,
        as: '*.json'
    }
    const masterCSSPlanRule = {
        condition: {
            all: [
                { path: /\.css$/ },
                { query: MASTER_CSS_PLAN_RESOURCE_QUERY }
            ]
        },
        loaders: [cssPlanLoaderPath],
        type: 'json' as never,
        as: '*.json'
    }
    const masterCSSStyleRule = {
        condition: {
            all: [
                { path: /\.(css|scss|sass)$/ },
                { content: MASTER_CSS_STYLE_CONTENT_PATTERN },
                { not: { query: MASTER_CSS_PLAN_RESOURCE_QUERY } }
            ]
        },
        loaders: [styleCSSLoaderPath],
        type: 'css' as const,
        as: '*.css'
    }
    return {
        ...nextConfig.turbopack,
        resolveAlias: {
            ...nextConfig.turbopack?.resolveAlias,
            [VIRTUAL_CSS_ID]: virtualCSSPath,
            [VIRTUAL_PLAN_ID]: virtualPlanPath,
            [VIRTUAL_PRELOADED_ID]: virtualPreloadedPath
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
                masterCSSVirtualPlanRule,
                masterCSSPlanRule,
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

function createCSSPlanImportSourceRules(cssPlanImportLoaderPath: string, projectDir: string) {
    const loader = {
        loader: cssPlanImportLoaderPath,
        options: {
            projectDir
        }
    }
    const sourceRules = [
        ['*.js', 'ecmascript'],
        ['*.mjs', 'ecmascript'],
        ['*.cjs', 'ecmascript'],
        ['*.ts', 'typescript']
    ] as const
    return sourceRules.map(([glob, type]) => [glob, {
        condition: {
            all: [
                { not: 'foreign' as const },
                { content: MASTER_CSS_PLAN_IMPORT_CONTENT_PATTERN }
            ]
        },
        type,
        loaders: [loader]
    }] as const)
}

function applyMasterCSSStaticTurbopackConfig(
    nextConfig: NextConfig,
    cssPlanLoaderPath: string,
    cssPlanImportLoaderPath: string,
    styleCSSLoaderPath: string,
    staticLoaderPath: string,
    staticCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualPlanPath: string,
    virtualPreloadedPath: string,
    projectDir: string,
    statePath: string
) {
    const turbopackConfig = applyMasterCSSTurbopackConfig(nextConfig, cssPlanLoaderPath, cssPlanImportLoaderPath, styleCSSLoaderPath, virtualCSSPath, virtualPlanPath, virtualPreloadedPath, projectDir, false)
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
        createStaticSourceRule(/\.mjs$/, '*.mjs', 'ecmascript'),
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
                { content: createMasterCSSPlanEntryPattern() },
                { not: { query: MASTER_CSS_PLAN_RESOURCE_QUERY } }
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

function createNextConfigWithCSSPlanLoader<T extends NextConfig>(
    nextConfig: T,
    cssPlanLoaderPath: string,
    cssPlanImportLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    webpackVirtualPlanPath: string,
    turbopackVirtualPlanPath: string,
    webpackVirtualPreloadedPath: string,
    turbopackVirtualPreloadedPath: string,
    projectDir: string
) {
    const userWebpack = nextConfig.webpack
    return {
        ...nextConfig,
        turbopack: applyMasterCSSTurbopackConfig(nextConfig, cssPlanLoaderPath, cssPlanImportLoaderPath, styleCSSLoaderPath, virtualCSSPath, turbopackVirtualPlanPath, turbopackVirtualPreloadedPath, projectDir),
        webpack(config: WebpackConfig, context: WebpackContext) {
            const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
            return applyMasterCSSWebpackConfig(resolvedConfig, cssPlanLoaderPath, styleCSSLoaderPath, virtualCSSPath, webpackVirtualPlanPath, webpackVirtualPreloadedPath)
        }
    } as T
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null }): T
export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: 'static' }): Promise<T>
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> | Promise<T> {
    const projectDir = process.cwd()
    nextConfig = withTranspilePackage(nextConfig, MASTER_CSS_REACT_PACKAGE_NAME)
    const resolvedOptions = resolveOptions(options)
    const cssPlanLoaderPath = resolveCSSPlanLoaderPath()
    const cssPlanImportLoaderPath = resolveCSSPlanImportLoaderPath()
    const styleCSSLoaderPath = resolveStyleCSSLoaderPath()
    const virtualPlanPath = ensureVirtualPlanPath(projectDir)
    const virtualPreloadedPath = ensureVirtualPreloadedPath(projectDir)
    const turbopackVirtualPlanPath = toTurbopackProjectPath(virtualPlanPath, projectDir)
    const turbopackVirtualPreloadedPath = toTurbopackProjectPath(virtualPreloadedPath, projectDir)
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
                    cssPlanLoaderPath,
                    cssPlanImportLoaderPath,
                    styleCSSLoaderPath,
                    resolveStaticLoaderPath(),
                    resolveStaticCSSLoaderPath(),
                    turbopackVirtualCSSPath,
                    turbopackVirtualPlanPath,
                    turbopackVirtualPreloadedPath,
                    setup.projectDir,
                    statePath
                )
            } as T
        })
    }

    const nextConfigWithCSSPlanLoader = createNextConfigWithCSSPlanLoader(
        nextConfig,
        cssPlanLoaderPath,
        cssPlanImportLoaderPath,
        styleCSSLoaderPath,
        resolveEmptyCSSPath(),
        virtualPlanPath,
        turbopackVirtualPlanPath,
        virtualPreloadedPath,
        turbopackVirtualPreloadedPath,
        projectDir
    )

    if (options.mode === null) return nextConfigWithCSSPlanLoader

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
        ...nextConfigWithCSSPlanLoader,
        adapterPath: nextAdapterPath
    } as WithAdapterPath<T>
}

export type { Options } from './options'
export { createAdapter, createComposedAdapter, renderNextBuildOutputs } from './adapter'

export default withMasterCSS
