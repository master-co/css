import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import source from '../src/default-manifest.json' with { type: 'json' }

const variables = flattenMasterCSSManifestVariables((source as unknown as MasterCSSManifest).variables)

test('preserves all 390 fixed palette values', () => {
  const css = readFileSync(new URL('../src/colors.css', import.meta.url), 'utf8')
  const values = [...css.matchAll(/(--color-[a-z]+-\d+):\s*([^;]+);/g)].sort((a, b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0).map(([, name, value]) => `${name}:${value}`)
  expect(values).toHaveLength(390)
  expect(createHash('sha256').update(values.join('\n')).digest('hex')).toBe('9810149675128be47ecfac5b649bc9d99d0505b1afaa2477f75b49470dfa7223')
})

test('has exactly 45 adaptive semantic colors and 30 fixed hue aliases', () => {
  const adaptive = variables.filter(v => v.name?.startsWith('color-') && v.values.some(entry => entry.value.startsWith('light-dark(')))
  expect(adaptive).toHaveLength(45)
  const hues = variables.filter(v => v.namespace === 'color' && /^[a-z]+$/.test(v.key) && !['white', 'black', 'current'].includes(v.key))
  expect(hues).toHaveLength(30)
  for (const variable of [...adaptive, ...hues]) {
    expect(variable.values).toHaveLength(1)
    expect(variable.values[0].path).toEqual([':root,:host'])
    const references = [...variable.values[0].value.matchAll(/var\(--([\w-]+)\)/g)].map(match => match[1])
    expect(variable.dependencies || []).toEqual([...new Set(references)])
  }
})
