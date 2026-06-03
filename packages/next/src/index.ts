import { fileURLToPath } from 'node:url'
import { dirname, relative } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import type { NextConfig } from 'next'
import { createMasterCSSConfigEntryPattern } from '@master/css-configer/css'
import {
    EMPTY_CONFIG_MODULE,
    MASTER_CSS_CONFIG_QUERY,
    VIRTUAL_CONFIG_ID,
    toVirtualDefaultConfigModulePath
} from '@master/css-configer/module'
import { VIRTUAL_CSS_ID } from 'shared/css-virtual-module'
import {
    prepareNextExtract,
    resolveExtractOutputPath,
    resolveExtractStatePath,
} from './extract'
import { registerOptions, resolveOptions, type Options } from './options'

type WithAdapterPath<T extends NextConfig> = T & { adapterPath: string }
type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>
type TurbopackRuleConfigCollection = TurbopackRules[string]
const MASTER_CSS_CONFIG_RESOURCE_QUERY = new RegExp(MASTER_CSS_CONFIG_QUERY.slice(1))
const MASTER_CSS_VIRTUAL_CONFIG_PATH_PATTERN = /(?:^|[/\\])node_modules[/\\]\.master-css[/\\]master-css-config\.js$/
const MASTER_CSS_STYLE_CONTENT_PATTERN = createMasterCSSConfigEntryPattern()

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.mjs', import.meta.url))
}

function resolveCSSConfigLoaderPath() {
    return fileURLToPath(new URL('./css-config-loader.mjs', import.meta.url))
}

function resolveStyleCSSLoaderPath() {
    return fileURLToPath(new URL('./style-css-loader.mjs', import.meta.url))
}

function resolveExtractLoaderPath() {
    return fileURLToPath(new URL('./extract-loader.mjs', import.meta.url))
}

function resolveExtractCSSLoaderPath() {
    return fileURLToPath(new URL('./extract-css-loader.mjs', import.meta.url))
}

function resolveEmptyCSSPath() {
    return fileURLToPath(new URL('../empty.css', import.meta.url))
}

function ensureVirtualConfigPath(projectDir = process.cwd()) {
    const virtualConfigPath = toVirtualDefaultConfigModulePath(projectDir)
    mkdirSync(dirname(virtualConfigPath), { recursive: true })
    if (!existsSync(virtualConfigPath)) {
        writeFileSync(virtualConfigPath, EMPTY_CONFIG_MODULE)
    }
    return virtualConfigPath
}

function toTurbopackProjectPath(file: string, projectDir = process.cwd()) {
    const relativePath = relative(projectDir, file).replace(/\\/g, '/')
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

function toRuleArray(rule: TurbopackRuleConfigCollection | undefined) {
    return Array.isArray(rule) ? rule : rule ? [rule] : []
}

function applyMasterCSSWebpackConfig(
    config: WebpackConfig,
    cssConfigLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualConfigPath: string
) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
        test: MASTER_CSS_VIRTUAL_CONFIG_PATH_PATTERN,
        type: 'javascript/auto',
        use: [
            {
                loader: cssConfigLoaderPath,
                options: {
                    virtual: true
                }
            }
        ]
    })
    config.module.rules.push({
        resourceQuery: MASTER_CSS_CONFIG_RESOURCE_QUERY,
        type: 'javascript/auto',
        use: [
            {
                loader: cssConfigLoaderPath
            }
        ]
    })
    config.module.rules.push({
        test: /\.(css|scss|sass)$/,
        resourceQuery: {
            not: [MASTER_CSS_CONFIG_RESOURCE_QUERY]
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
        [VIRTUAL_CONFIG_ID]: virtualConfigPath
    }
    return config
}

function applyMasterCSSTurbopackConfig(
    nextConfig: NextConfig,
    cssConfigLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualConfigPath: string,
    includeStyleRule = true
) {
    const rules = nextConfig.turbopack?.rules || {}
    const configRules = rules['*']
    const masterCSSVirtualConfigRule = {
        condition: {
            path: MASTER_CSS_VIRTUAL_CONFIG_PATH_PATTERN
        },
        loaders: [
            {
                loader: cssConfigLoaderPath,
                options: {
                    virtual: true
                }
            }
        ],
        type: 'ecmascript' as const,
        as: '*.js'
    }
    const masterCSSConfigRule = {
        condition: {
            all: [
                { path: /\.css$/ },
                { query: MASTER_CSS_CONFIG_RESOURCE_QUERY }
            ]
        },
        loaders: [cssConfigLoaderPath],
        type: 'ecmascript' as const,
        as: '*.js'
    }
    const masterCSSStyleRule = {
        condition: {
            all: [
                { path: /\.(css|scss|sass)$/ },
                { content: MASTER_CSS_STYLE_CONTENT_PATTERN },
                { not: { query: MASTER_CSS_CONFIG_RESOURCE_QUERY } }
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
            [VIRTUAL_CONFIG_ID]: virtualConfigPath
        },
        rules: {
            ...rules,
            '*': [
                masterCSSVirtualConfigRule,
                masterCSSConfigRule,
                ...(includeStyleRule ? [masterCSSStyleRule] : []),
                ...toRuleArray(configRules)
            ]
        } satisfies TurbopackRules
    }
}

function createExtractSourceRule(path: RegExp, as: string, type: 'typescript' | 'ecmascript') {
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

function applyMasterCSSExtractTurbopackConfig(
    nextConfig: NextConfig,
    cssConfigLoaderPath: string,
    styleCSSLoaderPath: string,
    extractLoaderPath: string,
    extractCSSLoaderPath: string,
    virtualCSSPath: string,
    virtualConfigPath: string,
    statePath: string
) {
    const turbopackConfig = applyMasterCSSTurbopackConfig(nextConfig, cssConfigLoaderPath, styleCSSLoaderPath, virtualCSSPath, virtualConfigPath, false)
    const rules = turbopackConfig.rules || {}
    const starRules = toRuleArray(rules['*'])
    const extractLoader = {
        loader: extractLoaderPath,
        options: {
            statePath
        }
    }
    const sourceRules = [
        createExtractSourceRule(/\.tsx$/, '*.tsx', 'typescript'),
        createExtractSourceRule(/\.ts$/, '*.ts', 'typescript'),
        createExtractSourceRule(/\.mts$/, '*.mts', 'typescript'),
        createExtractSourceRule(/\.cts$/, '*.cts', 'typescript'),
        createExtractSourceRule(/\.jsx$/, '*.jsx', 'ecmascript'),
        createExtractSourceRule(/\.js$/, '*.js', 'ecmascript'),
        createExtractSourceRule(/\.mjs$/, '*.mjs', 'ecmascript'),
        createExtractSourceRule(/\.cjs$/, '*.cjs', 'ecmascript')
    ].map((rule) => ({
        ...rule,
        loaders: [extractLoader]
    }))
    const cssImportRule = {
        condition: {
            all: [
                { not: 'foreign' as const },
                { path: /\.(css|scss|sass)$/ },
                { content: createMasterCSSConfigEntryPattern() },
                { not: { query: MASTER_CSS_CONFIG_RESOURCE_QUERY } }
            ]
        },
        loaders: [
            {
                loader: extractCSSLoaderPath,
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

function createConfigWithCSSConfigLoader<T extends NextConfig>(
    nextConfig: T,
    cssConfigLoaderPath: string,
    styleCSSLoaderPath: string,
    virtualCSSPath: string,
    webpackVirtualConfigPath: string,
    turbopackVirtualConfigPath: string
) {
    const userWebpack = nextConfig.webpack
    return {
        ...nextConfig,
        turbopack: applyMasterCSSTurbopackConfig(nextConfig, cssConfigLoaderPath, styleCSSLoaderPath, virtualCSSPath, turbopackVirtualConfigPath),
        webpack(config: WebpackConfig, context: WebpackContext) {
            const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
            return applyMasterCSSWebpackConfig(resolvedConfig, cssConfigLoaderPath, styleCSSLoaderPath, virtualCSSPath, webpackVirtualConfigPath)
        }
    } as T
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null }): T
export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: 'extract' }): Promise<T>
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> | Promise<T> {
    const resolvedOptions = resolveOptions(options)
    const cssConfigLoaderPath = resolveCSSConfigLoaderPath()
    const styleCSSLoaderPath = resolveStyleCSSLoaderPath()
    const projectDir = process.cwd()
    const virtualConfigPath = ensureVirtualConfigPath(projectDir)
    const turbopackVirtualConfigPath = toTurbopackProjectPath(virtualConfigPath, projectDir)
    registerOptions(options)

    if (resolvedOptions.mode === 'extract') {
        return prepareNextExtract(options, {
            watch: process.env.NODE_ENV === 'development'
        }).then((setup) => {
            if (!setup) return nextConfig
            const outputPath = resolveExtractOutputPath(setup.projectDir)
            const statePath = resolveExtractStatePath(outputPath)
            return {
                ...nextConfig,
                turbopack: applyMasterCSSExtractTurbopackConfig(
                    nextConfig,
                    cssConfigLoaderPath,
                    styleCSSLoaderPath,
                    resolveExtractLoaderPath(),
                    resolveExtractCSSLoaderPath(),
                    outputPath,
                    turbopackVirtualConfigPath,
                    statePath
                )
            } as T
        })
    }

    const nextConfigWithCSSConfigLoader = createConfigWithCSSConfigLoader(
        nextConfig,
        cssConfigLoaderPath,
        styleCSSLoaderPath,
        resolveEmptyCSSPath(),
        virtualConfigPath,
        turbopackVirtualConfigPath
    )

    if (options.mode === null) return nextConfigWithCSSConfigLoader

    const adapterPath = resolveAdapterPath()
    const existingAdapterPath = nextConfig.adapterPath
    if (existingAdapterPath && existingAdapterPath !== adapterPath) {
        throw new Error('[@master/css.next] Next.js only supports one adapterPath. Remove the existing adapterPath or create a custom adapter that composes both adapters.')
    }

    return {
        ...nextConfigWithCSSConfigLoader,
        adapterPath
    } as WithAdapterPath<T>
}

export type { Options } from './options'
export { createAdapter, renderNextBuildOutputs } from './adapter'

export default withMasterCSS
