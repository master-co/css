import { resolveIntegrationMode, resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type { MasterCSSIntegrationRuntimeOptions, MasterCSSRenderingMode } from '@master/css-schema/integration'
import type { MasterCSSVitePluginOptions } from '@master/css-vite'

export type MasterCSSAstroIntegrationOptions = MasterCSSVitePluginOptions

export interface ResolvedMasterCSSAstroIntegrationOptions
extends Omit<MasterCSSAstroIntegrationOptions, 'runtime'> {
  enabled: boolean
  mode: MasterCSSRenderingMode
  injectRuntime: boolean
  runtime: MasterCSSIntegrationRuntimeOptions
}

export function resolveMasterCSSAstroIntegrationOptions(
  options: MasterCSSAstroIntegrationOptions = {}
): ResolvedMasterCSSAstroIntegrationOptions {
  const mode = resolveIntegrationMode(options.mode)
  const runtime = resolveIntegrationRuntime(mode, options.runtime)
  return {
    ...options,
    enabled: options.enabled ?? true,
    mode,
    runtime,
    injectRuntime: runtime.enabled
  }
}
