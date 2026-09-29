import { chromium } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import { resolve } from 'node:path'
import Color from 'colorjs.io'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'

export const naturalColorNames = ['sand', 'taupe', 'olive', 'sage', 'moss', 'petrol', 'copper', 'terracotta'] as const
export const colorLevels = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100] as const
const variables = new Map(flattenMasterCSSManifestVariables((preset as unknown as MasterCSSManifest).variables).map(variable => [variable.name, variable]))

// Palette measurements use fixed authored colors; adaptive values are computed by the browser below.
export function resolveColor(name: string): Color {
  const variable = variables.get(name)
  const value = variable?.values[0]?.value
  if (variable?.values.length !== 1 || !value?.startsWith('oklch(')) throw new Error(`Expected a fixed palette color: ${name}`)
  return new Color(value)
}

export function mapToSRGB(color: Color) {
  return color.clone().toGamut({ space: 'srgb', method: 'css' })
}

export async function auditNaturalColors() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const surfaces = ['base', 'inset', 'raised', 'floating']
  let computed: Record<string, { text: string, base: string, surfaces: Record<string, string> }>
  try {
    const classes = [...naturalColorNames.flatMap(name => [`text-${name}`, `bg-${name}`]), ...surfaces.map(name => `bg-surface-${name}`)]
    const rendered = renderClassNamesSync(classes, { manifest: preset as unknown as MasterCSSManifest })
    await page.setContent(`<style>${rendered.cssText}</style><div id="probe"></div>`)
    computed = await page.evaluate(({ families, surfaces }) => {
      const probe = document.querySelector<HTMLElement>('#probe')!
      const values: Record<string, { text: string, base: string, surfaces: Record<string, string> }> = {}
      for (const mode of ['light', 'dark']) for (const family of families) {
        probe.style.colorScheme = mode
        probe.className = `text-${family} bg-${family}`
        const text = getComputedStyle(probe).color, base = getComputedStyle(probe).backgroundColor
        const backgrounds: Record<string, string> = {}
        for (const surface of surfaces) {
          probe.className = `bg-surface-${surface}`
          backgrounds[surface] = getComputedStyle(probe).backgroundColor
        }
        values[`${family}:${mode}`] = { text, base, surfaces: backgrounds }
      }
      return values
    }, { families: [...naturalColorNames], surfaces })
  } finally { await browser.close() }
  return naturalColorNames.map(family => {
    const colors = colorLevels.map(level => resolveColor(`color-${family}-${level}`))
    const mapped = colors.map(mapToSRGB)
    const steps = colors.map((color, index) => ({
      level: colorLevels[index],
      value: String(variables.get(`color-${family}-${colorLevels[index]}`)!.values[0].value),
      srgb: mapped[index].to('srgb').toString({ format: 'hex' }),
      inP3: color.inGamut('p3', { epsilon: 0.000001 }),
      inSRGB: color.inGamut('srgb', { epsilon: 0.000001 }),
      mappingDelta: color.deltaEOK(mapped[index]),
      // Normalize by the numbered interval: endpoint intervals are five, not ten.
      deltaPerLevel: index ? color.deltaEOK(colors[index - 1]) / (colorLevels[index] - colorLevels[index - 1]) : null
    }))
    const modes = (['light', 'dark'] as const).map(mode => {
      const value = computed[`${family}:${mode}`]
      return { mode, base: value.base, text: value.text,
        contrast: Object.fromEntries(Object.entries(value.surfaces).map(([surface, background]) => [surface,
          Color.contrastWCAG21(mapToSRGB(new Color(value.text)), mapToSRGB(new Color(background)))
        ])) }
    })
    return { family, steps, modes }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.stdout.write(`${JSON.stringify(await auditNaturalColors(), null, 2)}\n`)
}
