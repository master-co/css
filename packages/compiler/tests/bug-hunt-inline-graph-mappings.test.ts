import { expect, test } from 'vitest'
import { createCompiler } from '../src/index'
import { compileManifestFileSync } from '../src/node'
import { compileRenderedStylesheet } from '../src/stylesheet/index'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding} inline graph preserves qualified child definitions and original output maps`, async () => {
    using compiler = await createCompiler({ binding })
    for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen']) {
      const entry = `@import "./child.css"${qualifier};/* 😀 */\n.after{margin:1px}`
      const child = '@utilities{paint{padding:2rem}}\n.card{@compose paint;}\n.card{padding:3rem}'
      const request = { graph: { entry: '/entry.css', files: { '/entry.css': entry, '/child.css': child }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] }, urls: { '/entry.css': '/entry.css', '/child.css': '/child.css' }, baseManifest: { version: 1 as const, utilities: [] }, inlineImports: true }
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

test('Node manifest files and their references retain qualified child definitions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-inline-reference-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    writeFileSync(child, '@utilities{paint{padding:2rem}}')
    for (const qualifier of [' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) screen']) {
      writeFileSync(entry, `@import "./child.css"${qualifier};`)
      const file = compileManifestFileSync(entry, { baseManifest: { version: 1, utilities: [] } })
      expect(file.manifest.utilities?.some(utility => utility.name === 'paint')).toBe(true)
      const rendered = await compileRenderedStylesheet(join(root, 'card.css'), '@reference "./entry.css";.card{@compose paint;}', { projectDir: root, baseManifest: { version: 1, utilities: [] } })
      expect(rendered.css).toContain('.card{padding:2rem}')
      expect(rendered.dependencies).toEqual(expect.arrayContaining([entry, child]))
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
