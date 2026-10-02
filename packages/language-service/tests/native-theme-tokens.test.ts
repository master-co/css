import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'

test('inline tokens provide completion and substituted hover without token output', () => {
  const manifest: MasterCSSManifest = {
    version: 6, languageVersion: 16,
    mixins: [{ name: '--bg', parameters: [{ name: '--color' }], body: [{ type: 'declaration', property: 'background-color', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--color' }] }] }] }],
    variables: { color: [{ name: 'color-brand', key: 'brand', values: [{ path: [':root,:host'], value: 'red', inline: true }] }] }
  , utilities: [{"name":"bg","parameters":[{"name":"--color"}],"body":[{"type":"declaration" as const,"property":"background-color","value":[{"type":"function" as const,"name":"var","value":[{"type":"text" as const,"value":"--color"}]}]}],"kind":"function" as const},{"name":"bg","parameters":[{"name":"--color"}],"body":[{"type":"declaration" as const,"property":"background-color","value":[{"type":"function" as const,"name":"var","value":[{"type":"text" as const,"value":"--color"}]}]}],"kind":"token" as const}] }
  using service = new CSSLanguageService({ manifest })
  const document = createDoc('html', '<div class="bg-"></div>')
  const completions = service.suggestSyntax(document, document.positionAt(15), { triggerKind: 2, triggerCharacter: '-' })
  expect(completions?.map(item => item.label)).toContain('bg-brand')
  const hover = service.inspectSyntax(createDoc('html', '<div class="bg-brand"></div>'), { line: 0, character: 15 })
  expect(hover?.contents).toMatchObject({ value: expect.stringContaining('background-color: red') })
  expect(hover?.contents).toMatchObject({ value: expect.not.stringContaining('--color-brand:') })
})
