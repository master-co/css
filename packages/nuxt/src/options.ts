import { resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type { MasterCSSIntegrationRuntimeOptions } from '@master/css-schema/integration'
import type { MasterCSSVitePluginOptions } from '@master/css-vite'

export type MasterCSSNuxtModuleOptions = MasterCSSVitePluginOptions

export interface ResolvedMasterCSSNuxtModuleOptions
extends Omit<MasterCSSNuxtModuleOptions, 'runtime'> {
  enabled: boolean
  mode: NonNullable<MasterCSSNuxtModuleOptions['mode']>
  runtime: MasterCSSIntegrationRuntimeOptions
  injectRuntime: boolean
}

export function resolveMasterCSSNuxtModuleOptions(
  options: MasterCSSNuxtModuleOptions = {}
): ResolvedMasterCSSNuxtModuleOptions {
  const mode = options.mode ?? 'static'
  const runtime = resolveIntegrationRuntime(mode, options.runtime)
  return {
    ...options,
    enabled: options.enabled ?? true,
    mode,
    runtime,
    injectRuntime: runtime.enabled
  }
}
