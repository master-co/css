import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { createMasterStyleCSSPattern } from '@master/css-extractor/style'
import { MASTER_CSS_CONFIG_QUERY } from 'shared/css-config-module'
import {
    prepareNextExtract,
    resolveExtractOutputPath,
    resolveExtractStatePath,
} from './extract'
import { registerOptions, resolveOptions, type Options } from './options'
import { warnMissingNextConfig } from './config-warning'

type WithAdapterPath<T extends NextConfig> = T & { adapterPath: string }
type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>
type TurbopackRuleConfigCollection = TurbopackRules[string]
const MASTER_CSS_CONFIG_RESOURCE_QUERY = new RegExp(MASTER_CSS_CONFIG_QUERY.slice(1))

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.mjs', import.meta.url))
}

function resolveCSSConfigLoaderPath() {
    return fileURLToPath(new URL('./css-config-loader.mjs', import.meta.url))
}

function resolveExtractLoaderPath() {
    return fileURLToPath(new URL('./extract-loader.mjs', import.meta.url))
}

function resolveExtractCSSLoaderPath() {
    return fileURLToPath(new URL('./extract-css-loader.mjs', import.meta.url))
}

function toRuleArray(rule: TurbopackRuleConfigCollection | undefined) {
    return Array.isArray(rule) ? rule : rule ? [rule] : []
}

function applyMasterCSSWebpackConfig(config: WebpackConfig, loaderPath: string) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
        resourceQuery: MASTER_CSS_CONFIG_RESOURCE_QUERY,
        type: 'javascript/auto',
        use: [
            {
                loader: loaderPath
            }
        ]
    })
    return config
}

function applyMasterCSSTurbopackConfig(nextConfig: NextConfig, loaderPath: string) {
    const rules = nextConfig.turbopack?.rules || {}
    const configRules = rules['*']
    const masterCSSConfigRule = {
        condition: {
            all: [
                { path: /\.css$/ },
                { query: MASTER_CSS_CONFIG_RESOURCE_QUERY }
            ]
        },
        loaders: [loaderPath],
        type: 'ecmascript' as const,
        as: '*.js'
    }
    return {
        ...nextConfig.turbopack,
        rules: {
            ...rules,
            '*': [
                masterCSSConfigRule,
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
    extractLoaderPath: string,
    extractCSSLoaderPath: string,
    statePath: string
) {
    const turbopackConfig = applyMasterCSSTurbopackConfig(nextConfig, cssConfigLoaderPath)
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
                { content: createMasterStyleCSSPattern() },
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

function createConfigWithCSSConfigLoader<T extends NextConfig>(nextConfig: T, cssConfigLoaderPath: string) {
    const userWebpack = nextConfig.webpack
    return {
        ...nextConfig,
        turbopack: applyMasterCSSTurbopackConfig(nextConfig, cssConfigLoaderPath),
        webpack(config: WebpackConfig, context: WebpackContext) {
            const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
            return applyMasterCSSWebpackConfig(resolvedConfig, cssConfigLoaderPath)
        }
    }
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null }): T
export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: 'extract' }): Promise<T>
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> | Promise<T> {
    const resolvedOptions = resolveOptions(options)
    const cssConfigLoaderPath = resolveCSSConfigLoaderPath()
    warnMissingNextConfig(process.cwd(), resolvedOptions.config)

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
                    resolveExtractLoaderPath(),
                    resolveExtractCSSLoaderPath(),
                    statePath
                )
            }
        })
    }

    const nextConfigWithCSSConfigLoader = createConfigWithCSSConfigLoader(nextConfig, cssConfigLoaderPath)

    if (options.mode === null) return nextConfigWithCSSConfigLoader

    const adapterPath = resolveAdapterPath()
    const existingAdapterPath = nextConfig.adapterPath
    if (existingAdapterPath && existingAdapterPath !== adapterPath) {
        throw new Error('[@master/css.next] Next.js only supports one adapterPath. Remove the existing adapterPath or create a custom adapter that composes both adapters.')
    }

    registerOptions(options)

    return {
        ...nextConfigWithCSSConfigLoader,
        adapterPath
    }
}

export type { Options } from './options'
export { createAdapter, renderNextBuildOutputs } from './adapter'

export default withMasterCSS
