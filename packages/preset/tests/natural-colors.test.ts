import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import { createDefaultManifestFromSourceFile } from '../scripts/generate-default-manifest'
import { createTestCSS } from './helpers/rust-engine'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const variables = flattenMasterCSSManifestVariables(manifest.variables)
const levels = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100]
// Base light/dark, then foreground light/dark. These are deliberately independent.
const families = {
  sand: [30, 40, 60, 30], taupe: [30, 40, 60, 30], olive: [50, 40, 60, 30],
  sage: [30, 40, 60, 30], moss: [50, 40, 60, 30], petrol: [60, 50, 60, 30],
  copper: [50, 40, 60, 30], terracotta: [50, 40, 70, 30]
}

describe('natural material colors', () => {
  for (const [family, aliases] of Object.entries(families)) {
    test(`${family} has thirteen fixed colors and both mode-aware aliases`, () => {
      const shades = variables.filter(variable => new RegExp(`^color-${family}-\\d+$`).test(variable.name ?? ''))
      expect(shades.map(variable => Number(variable.key.split('-').at(-1))).sort((a, b) => a - b)).toEqual(levels)
      for (const variable of shades) {
        expect(variable.namespace).toBe('color')
        expect(variable.modes).toBeUndefined()
        expect(variable.value).toMatch(/^oklch\(/)
      }
      for (const [index, prefix] of ['color', 'color-text'].entries()) {
        const light = `${family}-${aliases[index * 2]}`
        const dark = `${family}-${aliases[index * 2 + 1]}`
        expect(variables.find(variable => variable.name === `${prefix}-${family}`)).toMatchObject({
          namespace: prefix,
          key: family,
          modes: {
            light: { value: `var(--color-${light})` },
            dark: { value: `var(--color-${dark})` }
          },
          dependencies: [`color-${light}`, `color-${dark}`]
        })
      }
    })
  }

  test('the public theme entry includes every token from the internal color source', () => {
    const theme = createDefaultManifestFromSourceFile(fileURLToPath(import.meta.resolve('@master/css-preset/theme.css')))
    expect(flattenMasterCSSManifestVariables(theme.variables)).toEqual(variables)
  })

  test('fixed colors, text aliases, borders, gradients and alpha use the Rust engine', () => {
    const css = createTestCSS(manifest).ensureClassRules(
      'bg-sand-5', 'fg-taupe-70', 'text-terracotta', 'b:1px|solid|var(--color-moss-30)',
      'bg-petrol-60/.5', 'background-image:linear-gradient(var(--color-sand-5),var(--color-copper-30))'
    )
    expect(css.text).toContain('background-color:var(--color-sand-5)')
    expect(css.text).toContain('color:var(--color-taupe-70)')
    expect(css.text).toContain('color:var(--color-text-terracotta)')
    expect(css.text).toContain('--color-text-terracotta:var(--color-terracotta-70)')
    expect(css.text).toContain('--color-text-terracotta:var(--color-terracotta-30)')
    expect(css.text).toContain('border:1px solid var(--color-moss-30)')
    expect(css.text).toContain('color-mix(in oklab,var(--color-petrol-60) 50%,transparent)')
    expect(css.text).toContain('linear-gradient(var(--color-sand-5),var(--color-copper-30))')
    expect(css.text).not.toContain('--color-olive')
    expect(css.text).not.toContain('--color-sand-100')
    expect(css.text).not.toContain('@layer theme,')
  })

  test('every fixed shade is emitted on demand, including both endpoints', () => {
    for (const family of Object.keys(families)) {
      for (const level of levels) {
        const css = createTestCSS(manifest).ensureClassRules(`fg-${family}-${level}`)
        const name = `color-${family}-${level}`
        expect(css.text).toContain(`--${name}:${variables.find(variable => variable.name === name)!.value}`)
        expect(css.text).toContain(`color:var(--${name})`)
        expect([...css.text.matchAll(/--color-[a-z]+-\d+:/g)]).toHaveLength(1)
      }
    }
  })

  test('olive follows the preset while a literal retains the native CSS olive color', () => {
    const css = createTestCSS(manifest).ensureClassRules('fg-olive', 'bg-olive', 'fg:#808000', 'fg:olive')
    expect(css.text).toContain('color:var(--color-olive)')
    expect(css.text).toContain('background-color:var(--color-olive)')
    expect(css.text).toContain('--color-olive:var(--color-olive-50)')
    expect(css.text).toContain('--color-olive:var(--color-olive-40)')
    expect(css.text).toContain('color:#808000')
    expect(css.text).toContain('.fg\\:olive{color:olive}')
  })
})
