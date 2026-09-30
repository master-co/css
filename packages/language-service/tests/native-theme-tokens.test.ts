import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'

test('native token values provide completion and hover without managed CSS', () => {
  const manifest: MasterCSSManifest = {
    version: 4, languageVersion: 11,
    variables: { color: [{ name: 'color-brand', key: 'brand', values: [{ path: [':root'], value: 'red', delivery: 'native' }] }] }
  }
  using service = new CSSLanguageService({ manifest })
  const document = createDoc('html', '<div class="bg-"></div>')
  const completions = service.suggestSyntax(document, document.positionAt(15), { triggerKind: 2, triggerCharacter: '-' })
  expect(completions?.map(item => item.label)).toContain('bg-brand')
  const hover = service.inspectSyntax(createDoc('html', '<div class="bg-brand"></div>'), { line: 0, character: 15 })
  expect(hover?.contents).toMatchObject({ value: expect.stringContaining('background-color: var(--color-brand)') })
  expect(hover?.contents).toMatchObject({ value: expect.not.stringContaining('--color-brand:') })
})
