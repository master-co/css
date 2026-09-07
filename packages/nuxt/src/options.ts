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
