import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { registerOptions, type Options } from './options'

type WithAdapterPath<T extends NextConfig> = T & { adapterPath: string }
type WebpackConfig = Parameters<NonNullable<NextConfig['webpack']>>[0]
type WebpackContext = Parameters<NonNullable<NextConfig['webpack']>>[1]
type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.mjs', import.meta.url))
}

function resolveCSSConfigLoaderPath() {
    return fileURLToPath(new URL('./css-config-loader.mjs', import.meta.url))
}

function applyMasterCSSWebpackConfig(config: WebpackConfig, loaderPath: string) {
    config.module ??= {}
    config.module.rules ??= []
    config.module.rules.push({
        resourceQuery: /master-css-config/,
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
                { query: /master-css-config/ }
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
                ...(Array.isArray(configRules) ? configRules : configRules ? [configRules] : [])
            ]
        } satisfies TurbopackRules
    }
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null }): T
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> {
    const cssConfigLoaderPath = resolveCSSConfigLoaderPath()
    const userWebpack = nextConfig.webpack
    const nextConfigWithCSSConfigLoader = {
        ...nextConfig,
        turbopack: applyMasterCSSTurbopackConfig(nextConfig, cssConfigLoaderPath),
        webpack(config: WebpackConfig, context: WebpackContext) {
            const resolvedConfig = userWebpack ? userWebpack(config, context) || config : config
            return applyMasterCSSWebpackConfig(resolvedConfig, cssConfigLoaderPath)
        }
    }

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
