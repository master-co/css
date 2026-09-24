import { expect, test } from 'vitest'
import { createCompiler } from '../src/index'
import { compileManifestFileSync } from '../src/node'
import { compileRenderedStylesheet } from '../src/stylesheet/index'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding} inline graph preserves qualified native compose and original output maps`, async () => {
    using compiler = await createCompiler({ binding })
    for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen']) {
      const entry = `@import "./child.css"${qualifier};@utilities{paint{padding:2rem}}/* 😀 */\n.after{margin:1px}`
      const child = '/* child */\n.card{@compose paint;}\n.card{padding:3rem}'
      const request = { graph: { entry: '/entry.css', files: { '/entry.css': entry, '/child.css': child }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] }, urls: { '/entry.css': '/entry.css', '/child.css': '/child.css' }, baseManifest: { version: 1 as const, languageVersion: 2 as const, utilities: [] }, inlineImports: true }
      const result = compiler.compileStylesheets(request)
      expect(result.css).not.toContain('@import')
      expect(result.manifest.utilities?.some(utility => utility.name === 'paint')).toBe(true)
      const sheet = result.stylesheets.find(sheet => sheet.id === '/entry.css')!
      for (const [needle, file, source, original] of [['.card', '/child.css', child, '.card'], ['padding:2rem', '/child.css', child, 'paint;'], ['.after', '/entry.css', entry, '.after']]) {
        expect(sheet.outputMappings.find(mapping => mapping.generatedStart === sheet.css.indexOf(needle))?.source).toMatchObject({ file, range: { start: source.indexOf(original) } })
      }
    }
  })
}

test('Node manifest files and references reject qualified global definitions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-inline-reference-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    writeFileSync(child, '@utilities{paint{padding:2rem}}')
    for (const qualifier of [' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) screen']) {
      writeFileSync(entry, `@import "./child.css"${qualifier};`)
      expect(() => compileManifestFileSync(entry, { baseManifest: { version: 1, languageVersion: 2, utilities: [] } })).toThrow(/Qualified import.*global @utilities/)
      await expect(compileRenderedStylesheet(join(root, 'card.css'), '@reference "./entry.css";.card{@compose paint;}', { projectDir: root, baseManifest: { version: 1, languageVersion: 2, utilities: [] } })).rejects.toThrow(/Qualified import.*global @utilities/)

    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
