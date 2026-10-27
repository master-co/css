import { resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export interface MasterCSSWebpackPluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  pruneNativeCSS?: boolean
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
  scanner?: MasterCSSScannerConfiguration
}

export interface ResolvedMasterCSSWebpackPluginOptions {
  enabled: boolean
  mode: MasterCSSRenderingMode
  pruneNativeCSS: boolean
  injectRuntime: boolean
  scanner: MasterCSSScannerConfiguration
}

export function resolveMasterCSSWebpackPluginOptions(
  options: MasterCSSWebpackPluginOptions = {}
): ResolvedMasterCSSWebpackPluginOptions {
  const mode = options.mode ?? 'static'
  const runtime = resolveIntegrationRuntime(mode, options.runtime)
  return {
    enabled: options.enabled ?? true,
    mode,
    pruneNativeCSS: options.pruneNativeCSS ?? false,
    injectRuntime: runtime.enabled,
    scanner: options.scanner ?? {}
  }
}

export function shouldInjectRuntime(options: ResolvedMasterCSSWebpackPluginOptions) {
  return options.injectRuntime && (options.mode === 'runtime' || options.mode === 'progressive')
}

export function shouldPreloadRuntime(options: ResolvedMasterCSSWebpackPluginOptions) {
  return options.injectRuntime && options.mode === 'runtime'
}
