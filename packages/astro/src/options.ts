import type { MasterCSSIntegrationRuntimeOptions } from '@master/css-schema/integration'
import type { MasterCSSVitePluginOptions } from '@master/css-vite'

export type MasterCSSAstroIntegrationOptions = MasterCSSVitePluginOptions

export interface ResolvedMasterCSSAstroIntegrationOptions
extends Omit<MasterCSSAstroIntegrationOptions, 'runtime'> {
  enabled: boolean
  mode: NonNullable<MasterCSSAstroIntegrationOptions['mode']>
  injectRuntime: boolean
  runtime: MasterCSSIntegrationRuntimeOptions
}

export function resolveMasterCSSAstroIntegrationOptions(
  options: MasterCSSAstroIntegrationOptions = {}
): ResolvedMasterCSSAstroIntegrationOptions {
  const runtime = typeof options.runtime === 'object'
    ? options.runtime
    : { enabled: options.runtime }
  return {
    ...options,
    enabled: options.enabled ?? true,
    mode: options.mode ?? 'progressive',
    runtime,
    injectRuntime: runtime.enabled ?? true
  }
}
