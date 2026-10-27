import { resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export interface MasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  pruneNativeCSS?: boolean
  scanner?: MasterCSSScannerConfiguration
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
}

export interface ResolvedMasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  pruneNativeCSS?: boolean
  scanner?: MasterCSSScannerConfiguration
  injectRuntime?: boolean
  avoidFOUC?: boolean
}

export const defaultMasterCSSVitePluginOptions:
Readonly<ResolvedMasterCSSVitePluginOptions> = Object.freeze({
  enabled: true,
  mode: 'static',
  pruneNativeCSS: false,
  scanner: Object.freeze({}),
  injectRuntime: false,
  avoidFOUC: true
})

export function resolveMasterCSSVitePluginOptions(
  options: MasterCSSVitePluginOptions = {}
): ResolvedMasterCSSVitePluginOptions {
  const mode = options.mode ?? 'static'
  const runtime = resolveIntegrationRuntime(mode, options.runtime)
  return {
    enabled: options.enabled ?? true,
    mode,
    pruneNativeCSS: options.pruneNativeCSS ?? false,
    scanner: options.scanner ?? {},
    injectRuntime: runtime.enabled,
    avoidFOUC: runtime.avoidFOUC ?? true
  }
}
