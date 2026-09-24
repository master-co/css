import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import Color from 'colorjs.io'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export const COLOR_LEVELS = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100] as const

export type ColorLevel = typeof COLOR_LEVELS[number]
export type ColorPalette = Record<string, Partial<Record<ColorLevel, string>>>

const colorLevelSet = new Set<number>(COLOR_LEVELS)

const palette = flattenMasterCSSManifestVariables(defaultManifest.variables).reduce<ColorPalette>((palette, variable) => {
  if (!variable.name || variable.namespace !== 'color' || variable.modes || typeof variable.value !== 'string') return palette

  const match = variable.name.match(/^color-(.+)-(\d+)$/)
  if (!match) return palette

  const [, colorName, levelText] = match
  const level = Number(levelText)
  if (!colorLevelSet.has(level)) return palette

  palette[colorName] ??= {}
  palette[colorName][level as ColorLevel] = variable.value
  return palette
}, {})

export const colorNames = Object.keys(palette)

export const colors = colorNames.flatMap((colorName) =>
  COLOR_LEVELS
    .filter((level) => palette[colorName][level])
    .map((level) => `${colorName}-${level}`)
)

export function getColor(colorName: string, level: ColorLevel) {
  const color = palette[colorName]?.[level]
  if (!color) throw new Error(`Unknown preset color token: color-${colorName}-${level}`)
  return color
}

export function getColorHex(colorName: string, level: ColorLevel) {
  return new Color(getColor(colorName, level)).to('srgb').toString({ format: 'hex' }).replace(/^#/, '')
}

export default palette
