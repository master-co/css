import { describe, expect, test } from 'vitest'
import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import { defaultCSSLanguageRuntime, type CSSLanguageRuntime } from '@master/css-language'
import { createPresetManifest } from './helpers/create-preset-manifest'

function createRuntime(overrides: Partial<CSSLanguageRuntime> = {}): CSSLanguageRuntime {
  return {
    ...defaultCSSLanguageRuntime,
    defaultManifest: createPresetManifest({
      variables: [
        {
          namespace: 'color',
          key: 'runtime-brand',
          value: '#123456'
        }
      ],
      utilities: [
        {
          name: 'runtime-card',
          layer: 'components',
          declarations: {
            display: 'block'
          }
        }
      ]
    }),
    ...overrides
  }
}

describe('runtime injection', () => {
  test('uses the injected runtime default manifest for completions', () => {
    const service = new CSSLanguageService(undefined, { runtime: createRuntime() })
    const doc = createDoc('html', '<div class=""></div>')

    const completions = service.suggestSyntax(doc, doc.positionAt('<div class="'.length), {
      triggerKind: 1
    })

    expect(completions?.map(({ label }) => label)).toContain('runtime-card')
  })

  test('uses the injected runtime for hover CSS previews', () => {
    const service = new CSSLanguageService(undefined, { runtime: createRuntime() })
    const doc = createDoc('html', '<div class="runtime-card"></div>')

    const hover = service.inspectSyntax(doc, doc.positionAt('<div class="runtime'.length))

    expect(JSON.stringify(hover?.contents)).toContain('display')
    expect(JSON.stringify(hover?.contents)).toContain('block')
  })

  test('uses the injected runtime variables for document colors', async () => {
    const service = new CSSLanguageService(undefined, { runtime: createRuntime() })
    const doc = createDoc('html', '<div class="fg:runtime-brand"></div>')

    const colors = await service.renderSyntaxColors(doc)

    expect(colors?.length).toBeGreaterThan(0)
  })
})
