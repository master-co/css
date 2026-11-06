import { resolveIntegrationMode, resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type { MasterCSSIntegrationRuntimeOptions, MasterCSSRenderingMode } from '@master/css-schema/integration'
import type { MasterCSSVitePluginOptions } from '@master/css-vite'

export type MasterCSSNuxtModuleOptions = MasterCSSVitePluginOptions

export interface ResolvedMasterCSSNuxtModuleOptions
extends Omit<MasterCSSNuxtModuleOptions, 'runtime'> {
  enabled: boolean
  mode: MasterCSSRenderingMode
  runtime: MasterCSSIntegrationRuntimeOptions
  injectRuntime: boolean
}

export function resolveMasterCSSNuxtModuleOptions(
  options: MasterCSSNuxtModuleOptions = {}
): ResolvedMasterCSSNuxtModuleOptions {
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
