import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export interface MasterCSSWebpackPluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
  scanner?: MasterCSSScannerConfiguration
}

export interface ResolvedMasterCSSWebpackPluginOptions {
  enabled: boolean
  mode: MasterCSSRenderingMode
  injectRuntime: boolean
  scanner: MasterCSSScannerConfiguration
}

export function resolveMasterCSSWebpackPluginOptions(
  options: MasterCSSWebpackPluginOptions = {}
): ResolvedMasterCSSWebpackPluginOptions {
  const runtime = typeof options.runtime === 'object'
    ? options.runtime
    : { enabled: options.runtime }
  return {
    enabled: options.enabled ?? true,
    mode: options.mode ?? 'runtime',
    injectRuntime: runtime.enabled ?? true,
    scanner: options.scanner ?? {}
  }
}

export function shouldInjectRuntime(options: ResolvedMasterCSSWebpackPluginOptions) {
  return options.injectRuntime && (options.mode === 'runtime' || options.mode === 'progressive')
}

export function shouldPreloadRuntime(options: ResolvedMasterCSSWebpackPluginOptions) {
  return options.injectRuntime && options.mode === 'runtime'
}
