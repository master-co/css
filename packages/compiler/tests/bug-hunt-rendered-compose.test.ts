import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { compileRenderedStylesheet, compileStylesheet } from '../src/stylesheet/index-public'
const baseManifest = { version: 1 as const, utilities: [] }

test('rendered stylesheet includes lowered native compose declarations', async () => {
  const source = '@utilities{paint{padding:2rem}}.card{@compose paint;}'
  const options = { baseManifest, preserveNativeCSS: true }
  expect((await compileStylesheet('/tmp/compose.css', source, options)).css).toContain('padding:2rem')
  const rendered = await compileRenderedStylesheet('/tmp/compose.css', source, options)
  expect(rendered.css).toContain('.card{padding:2rem}')
  expect(rendered.css.match(/padding:2rem/g)).toHaveLength(1)
})
test('rendered stylesheet includes referenced compose without exporting reference definitions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'rendered-compose-'))
  try {
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:3rem}}')
    const result = await compileRenderedStylesheet(join(root, 'entry.css'), '@reference "./tokens.css";.card{@compose paint;}', { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(result.css).toContain('.card{padding:3rem}')
    expect(JSON.stringify(result.manifest)).not.toContain('paint')
    expect(result.dependencies).toContain(join(root, 'tokens.css'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('rendered stylesheet preserves native rules alongside lowered rules without duplication', async () => {
  const result = await compileRenderedStylesheet('/tmp/compose.css', '@utilities{paint{padding:2rem}}.plain{margin:1rem}.card{@compose paint;}', { baseManifest, preserveNativeCSS: true })
  expect(result.css).toMatch(/margin:\s*1rem/)
  expect(result.css).toContain('padding:2rem')
  expect(result.css.match(/margin:\s*1rem/g)).toHaveLength(1)
})
