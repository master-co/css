import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { registerOptions, type Options } from './options'

type WithAdapterPath<T extends NextConfig> = T & { adapterPath: string }

function resolveAdapterPath() {
    return fileURLToPath(new URL('./adapter.mjs', import.meta.url))
}

export function withMasterCSS<T extends NextConfig>(nextConfig: T, options: Options & { mode: null }): T
export function withMasterCSS<T extends NextConfig>(nextConfig?: T, options?: Options): WithAdapterPath<T>
export function withMasterCSS<T extends NextConfig>(nextConfig: T = {} as T, options: Options = {}): T | WithAdapterPath<T> {
    if (options.mode === null) return nextConfig

    const adapterPath = resolveAdapterPath()
    const existingAdapterPath = nextConfig.adapterPath
    if (existingAdapterPath && existingAdapterPath !== adapterPath) {
        throw new Error('[@master/css.next] Next.js only supports one adapterPath. Remove the existing adapterPath or create a custom adapter that composes both adapters.')
    }

    registerOptions(options)

    return {
        ...nextConfig,
        adapterPath
    }
}

export type { Options } from './options'
export { createAdapter, renderNextBuildOutputs } from './adapter'

export default withMasterCSS
