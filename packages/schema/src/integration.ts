export const MASTER_CSS_RENDERING_MODES = [
  'runtime',
  'static',
  'prerender',
  'progressive'
] as const

export type MasterCSSRenderingMode = typeof MASTER_CSS_RENDERING_MODES[number]

/** @deprecated The 2.0.0 spelling of `prerender`; integrations resolve it to `prerender`. */
export type DeprecatedMasterCSSRenderingMode = 'pre-render'

/** A `mode` option value: a rendering mode or its deprecated spelling. */
export type MasterCSSRenderingModeOption = MasterCSSRenderingMode | DeprecatedMasterCSSRenderingMode

export interface MasterCSSIntegrationRuntimeOptions {
  enabled?: boolean
  avoidFOUC?: boolean
}

export interface MasterCSSIntegrationOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingModeOption
  pruneNativeCSS?: boolean
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
}

export function isMasterCSSRenderingMode(value: unknown): value is MasterCSSRenderingMode {
  return MASTER_CSS_RENDERING_MODES.includes(value as MasterCSSRenderingMode)
}
