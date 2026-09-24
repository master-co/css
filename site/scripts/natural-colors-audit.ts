import { resolve } from 'node:path'
import Color from 'colorjs.io'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'

export const naturalColorNames = ['sand', 'taupe', 'olive', 'sage', 'moss', 'petrol', 'copper', 'terracotta'] as const
export const colorLevels = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100] as const
const variables = new Map(flattenMasterCSSManifestVariables((preset as unknown as MasterCSSManifest).variables).map(variable => [variable.name, variable]))

export function resolveColor(name: string, mode: 'light' | 'dark' = 'light', seen = new Set<string>()): Color {
  if (seen.has(name)) throw new Error(`Circular color reference: ${name}`)
  seen.add(name)
  const variable = variables.get(name)
  const value = variable?.modes?.[mode]?.value ?? variable?.value
  if (typeof value !== 'string') throw new Error(`Missing color: ${name} (${mode})`)
  const dependency = value.match(/^var\(--(.+)\)$/)?.[1]
  return dependency ? resolveColor(dependency, mode, seen) : new Color(value)
}

export function mapToSRGB(color: Color) {
  return color.clone().toGamut({ space: 'srgb', method: 'css' })
}

export function auditNaturalColors() {
  return naturalColorNames.map(family => {
    const colors = colorLevels.map(level => resolveColor(`color-${family}-${level}`))
    const mapped = colors.map(mapToSRGB)
    const steps = colors.map((color, index) => ({
      level: colorLevels[index],
      value: String(variables.get(`color-${family}-${colorLevels[index]}`)!.value),
      srgb: mapped[index].to('srgb').toString({ format: 'hex' }),
      inP3: color.inGamut('p3', { epsilon: 0.000001 }),
      inSRGB: color.inGamut('srgb', { epsilon: 0.000001 }),
      mappingDelta: color.deltaEOK(mapped[index]),
      // Normalize by the numbered interval: endpoint intervals are five, not ten.
      deltaPerLevel: index ? color.deltaEOK(colors[index - 1]) / (colorLevels[index] - colorLevels[index - 1]) : null
    }))
    const modes = (['light', 'dark'] as const).map(mode => ({
      mode,
      base: variables.get(`color-${family}`)!.modes![mode].value,
      text: variables.get(`color-text-${family}`)!.modes![mode].value,
      contrast: Object.fromEntries(['base', 'muted', 'raised', 'overlay'].map(surface => [surface,
        Color.contrastWCAG21(mapToSRGB(resolveColor(`color-text-${family}`, mode)), mapToSRGB(resolveColor(`color-surface-${surface}`, mode)))
      ]))
    }))
    return { family, steps, modes }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.stdout.write(`${JSON.stringify(auditNaturalColors(), null, 2)}\n`)
}
