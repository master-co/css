import {
  isMasterCSSRenderingMode,
  MASTER_CSS_RENDERING_MODES,
  type MasterCSSRenderingMode
} from '@master/css-schema/integration'

export function isRenderingMode(value: unknown): value is MasterCSSRenderingMode {
  return isMasterCSSRenderingMode(value)
}

export function formatRenderingModes() {
  return MASTER_CSS_RENDERING_MODES.join(', ')
}

export function resolveRenderingMode(value: unknown): MasterCSSRenderingMode | undefined {
  if (value === undefined) return undefined
  if (isRenderingMode(value)) return value
  throw new Error(`Invalid rendering mode "${String(value)}". Supported modes: ${formatRenderingModes()}.`)
}
