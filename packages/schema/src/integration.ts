export const MASTER_CSS_RENDERING_MODES = [
  'runtime',
  'static',
  'pre-render',
  'progressive'
] as const

export type MasterCSSRenderingMode = typeof MASTER_CSS_RENDERING_MODES[number]

export interface MasterCSSIntegrationRuntimeOptions {
  enabled?: boolean
  avoidFOUC?: boolean
}

export interface MasterCSSIntegrationOptions {
  enabled?: boolean
  mode?: MasterCSSRenderingMode
  runtime?: boolean | MasterCSSIntegrationRuntimeOptions
}

export function isMasterCSSRenderingMode(value: unknown): value is MasterCSSRenderingMode {
  return MASTER_CSS_RENDERING_MODES.includes(value as MasterCSSRenderingMode)
}
