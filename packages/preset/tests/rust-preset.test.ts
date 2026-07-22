import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadNativeBinding } from '@master/css-native'
import {
  flattenMasterCSSManifestVariables,
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }
import {
  createDefaultManifestFromSourceFile,
  createDefaultManifestJSONFromSourceFile
} from '../scripts/generate-default-manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust-owned default preset', () => {
  it('keeps the checked-in manifest equal to a fresh Rust compile', () => {
    const sourceFile = resolve(import.meta.dirname, '../src/index.css')
    expect(createDefaultManifestJSONFromSourceFile(sourceFile))
      .toBe(readFileSync(resolve(import.meta.dirname, '../src/default-manifest.json'), 'utf8'))
    expect(createDefaultManifestFromSourceFile(sourceFile)).toEqual(defaultManifest)
  })

  it('keeps design-token and utility contracts in the compiled manifest', () => {
    const variables = flattenMasterCSSManifestVariables(defaultManifest.variables)
    expect(variables.some(({ name }) => name === 'color-blue-60')).toBe(true)
    expect(variables.some(({ name }) => name === 'spacing-md')).toBe(true)
    expect(defaultManifest.animations?.fade).toBeDefined()
    expect(defaultManifest.utilities?.some(({ name }) => name === 'block')).toBe(true)
  })

  it('renders representative classes through the native Rust engine', () => {
    const binding = loadNativeBinding({ required: true })!.binding
    const engine = new binding.EngineSession(stringifyMasterCSSManifestJSON(defaultManifest))
    try {
      engine.ensureClassRules([
        'block',
        'fg:red-60',
        'surface:base',
        'grid-cols:3',
        'text:2xl'
      ])
      const snapshot = JSON.parse(engine.snapshot()) as { text: string }
      expect(snapshot.text).toContain('display:block')
      expect(snapshot.text).toContain('color:var(--color-red-60)')
      expect(snapshot.text).toContain('background-color:var(--color-surface-base)')
      expect(snapshot.text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
      expect(snapshot.text).toContain('font-size:var(--font-size-2xl)')
    } finally {
      engine.dispose()
    }
  })
})
