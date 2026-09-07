import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export interface MasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  scanner?: MasterCSSScannerConfiguration
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
}

export interface ResolvedMasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  scanner?: MasterCSSScannerConfiguration
  injectRuntime?: boolean
  avoidFOUC?: boolean
}

export const defaultMasterCSSVitePluginOptions:
Readonly<ResolvedMasterCSSVitePluginOptions> = Object.freeze({
  enabled: true,
  mode: 'runtime',
  scanner: Object.freeze({}),
  injectRuntime: true,
  avoidFOUC: true
})

export function resolveMasterCSSVitePluginOptions(
  options: MasterCSSVitePluginOptions = {}
): ResolvedMasterCSSVitePluginOptions {
  const runtime = typeof options.runtime === 'object'
    ? options.runtime
    : { enabled: options.runtime }
  return {
    enabled: options.enabled ?? true,
    mode: options.mode ?? 'runtime',
    scanner: options.scanner ?? {},
    injectRuntime: runtime.enabled ?? true,
    avoidFOUC: runtime.avoidFOUC ?? true
  }
}
