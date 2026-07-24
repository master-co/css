import { beforeAll, describe, expect, it } from 'vitest'
import { createPresetManifest } from './helpers/create-preset-manifest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../binding/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust language session', () => {
  it('discovers UTF-16 class contexts for markup, script, and CSS', () => {
    const session = createTestToolingSession(createPresetManifest())
    try {
      const html = session.analyzeDocument({
        source: '😀 <div class="fg:red block"></div>',
        languageId: 'html'
      })
      expect(html.classPositions.map(({ token }) => token)).toEqual(['fg:red', 'block'])
      expect(html.classPositions[0].range.start).toBe(15)

      const script = session.analyzeDocument({
        source: 'const x = clsx("block fg:red")',
        languageId: 'typescript'
      })
      expect(script.classPositions.map(({ token }) => token)).toEqual(['block', 'fg:red'])

      const css = session.analyzeDocument({
        source: '.x { @compose block fg:red; }',
        languageId: 'css'
      })
      expect(css.classPositions.map(({ token }) => token)).toEqual(['block', 'fg:red'])
    } finally {
      session.dispose()
    }
  })

  it('owns classification, inspection, completion metadata, and colors', () => {
    const session = createTestToolingSession(createPresetManifest())
    try {
      const classifications = session.classifyClassNames(['block', 'fg:red', 'unknown'])
      expect(classifications.classes.map(({ kind }) => kind)).toEqual(['semantic', 'declaration', 'unknown'])
      expect(session.inspectClassName('fg:red')).toMatchObject({ valid: true, key: 'fg', value: 'red' })
      expect(session.completionIndex().classEntries.length).toBeGreaterThan(0)
      expect(session.colorTokens([{ className: 'fg:#fff', start: 4 }]).tokens.length).toBeGreaterThan(0)
    } finally {
      session.dispose()
    }
  })
})
