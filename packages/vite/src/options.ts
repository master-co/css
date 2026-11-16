import { resolveIntegrationMode, resolveIntegrationRuntime } from '@master/css-internal/runtime-bootstrap'
import type {
  MasterCSSIntegrationRuntimeOptions,
  MasterCSSRenderingMode,
  MasterCSSRenderingModeOption
} from '@master/css-schema/integration'
import type { MasterCSSScannerConfiguration } from '@master/css-tooling/scanner/node'

export interface MasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingModeOption
  pruneNativeCSS?: boolean
  /**
   * Declares that every page loading a local stylesheet also loads a style
   * entry. The entries then emit the project theme variables and keyframes of
   * all local stylesheets once, in development and in builds. Leave it unset
   * when some page can load a local stylesheet without an entry: a build still
   * shares wherever its module graph proves the entry is there.
   */
  globalStyleEntry?: boolean
  scanner?: MasterCSSScannerConfiguration
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
}

export interface ResolvedMasterCSSVitePluginOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  pruneNativeCSS?: boolean
  globalStyleEntry?: boolean
  scanner?: MasterCSSScannerConfiguration
  injectRuntime?: boolean
  avoidFOUC?: boolean
}

export const defaultMasterCSSVitePluginOptions:
Readonly<ResolvedMasterCSSVitePluginOptions> = Object.freeze({
  enabled: true,
  mode: 'static',
  pruneNativeCSS: false,
  globalStyleEntry: false,
  scanner: Object.freeze({}),
  injectRuntime: false,
  avoidFOUC: true
})

export function resolveMasterCSSVitePluginOptions(
  options: MasterCSSVitePluginOptions = {}
): ResolvedMasterCSSVitePluginOptions {
  const mode = resolveIntegrationMode(options.mode)
  const runtime = resolveIntegrationRuntime(mode, options.runtime)
  return {
    enabled: options.enabled ?? true,
    mode,
    pruneNativeCSS: options.pruneNativeCSS ?? false,
    globalStyleEntry: options.globalStyleEntry ?? false,
    scanner: options.scanner ?? {},
    injectRuntime: runtime.enabled,
    avoidFOUC: runtime.avoidFOUC ?? true
  }
}
