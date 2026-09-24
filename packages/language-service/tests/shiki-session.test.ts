import { expect, it, vi } from 'vitest'
import { createHighlighter, type ShikiTransformer } from 'shiki'
import { createLanguageSessionSync } from '@master/css-tooling/language/node'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { transformerMasterCSS, type MasterCSSShikiOptions } from '../src/shiki'
import { createPresetManifest } from './helpers/create-preset-manifest'

function transformer(options: MasterCSSShikiOptions): ShikiTransformer {
  return transformerMasterCSS(options) as unknown as ShikiTransformer
}

it('batch classifies unique classes without requesting CSS inspections or disposing a caller session', async () => {
  const manifest = createPresetManifest()
  const session = createLanguageSessionSync({ manifest })
  const classify = vi.spyOn(session, 'classifyClassNames')
  const inspect = vi.spyOn(session, 'inspectClassName').mockImplementation(() => {
    throw new Error('Highlighting must not generate CSS previews')
  })
  const dispose = vi.spyOn(session, 'dispose')
  const highlighter = await createHighlighter({ langs: ['html'], themes: ['github-dark'] })
  try {
    highlighter.codeToHast('<div class="block block fg-red invalid"></div>', {
      lang: 'html', theme: 'github-dark', transformers: [transformer({ session })]
    })
    expect(classify).toHaveBeenCalledExactlyOnceWith(['block', 'fg-red', 'invalid'])
    expect(inspect).not.toHaveBeenCalled()
    expect(dispose).not.toHaveBeenCalled()
  } finally {
    session.dispose()
    highlighter.dispose()
  }
})

it('preserves complete HAST across host languages compared with full inspection classification', async () => {
  const manifest = createPresetManifest({
    utilities: [{ name: 'brand', layer: 'components', declarations: { display: 'block' } }]
  })
  const session = createLanguageSessionSync({ manifest })
  const full = createToolingSessionSync({ manifest })
  const legacy = {
    analyzeDocument: full.analyzeDocument.bind(full),
    classifyClassNames(classNames: readonly string[]) {
      const result = full.classifyClassNames(classNames)
      return { ...result, classes: result.classes.map(entry => ({
        ...entry, kind: full.inspectClassName(entry.className).kind
      })) }
    }
  }
  const highlighter = await createHighlighter({ langs: ['html', 'css', 'mdx', 'tsx'], themes: ['github-dark'] })
  const customTransformer: ShikiTransformer = {
    code(node) { node.properties['data-custom-transformer'] = 'preserved' }
  }
  const cases = [
    ['html', '<div class="brand block block fg-red:hover invalid"></div>'],
    ['tsx', '<div className="brand display:flex" />'],
    ['mdx', '# Example\n\n<div className="block fg-red" />'],
    ['css', '.x { @compose brand block fg-red:hover; }'],
    ['plaintext', 'brand block fg-red:hover invalid']
  ]
  try {
    for (const [lang, code] of cases) {
      const options = { lang, theme: 'github-dark' }
      const classList = lang === 'plaintext'
      expect(highlighter.codeToHast(code, {
        ...options, transformers: [transformer({ session, classList }), customTransformer]
      })).toEqual(highlighter.codeToHast(code, {
        ...options, transformers: [transformer({ session: legacy, classList }), customTransformer]
      }))
    }
  } finally {
    session.dispose()
    full.dispose()
    highlighter.dispose()
  }
})
