import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { compileRenderedStylesheet, compileStylesheet } from '../src/stylesheet/index-public'
const baseManifest = { version: 1 as const, languageVersion: 3 as const, utilities: [] }

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
test('rendered import graph retains child reference ownership and dependencies', async () => {
  const root = mkdtempSync(join(tmpdir(), 'rendered-import-'))
  try {
    writeFileSync(join(root, 'child.css'), '@reference "./tokens.css";.card{@compose paint;}')
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:4rem}}')
    const result = await compileRenderedStylesheet(join(root, 'entry.css'), '@import "./child.css";.plain{margin:1rem}', { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(result.css).toContain('.card{padding:4rem}')
    expect(result.css).toMatch(/margin:\s*1rem/)
    expect(result.dependencies).toEqual(expect.arrayContaining([join(root, 'child.css'), join(root, 'tokens.css')]))
    expect(JSON.stringify(result.manifest)).not.toContain('paint')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('rendered missing references register before failure and recover', async () => {
  const root = mkdtempSync(join(tmpdir(), 'rendered-missing-'))
  try {
    const missing = join(root, 'tokens.css'), seen: string[] = []
    const options = { baseManifest, projectDir: root, preserveNativeCSS: true, onDependency: (file: string) => seen.push(file) }
    const source = '@reference "./tokens.css";.card{@compose paint;}'
    await expect(compileRenderedStylesheet(join(root, 'entry.css'), source, options)).rejects.toThrow()
    expect(seen).toContain(missing)
    writeFileSync(missing, '@utilities{paint{padding:5rem}}')
    expect((await compileRenderedStylesheet(join(root, 'entry.css'), source, options)).css).toContain('padding:5rem')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
test('rendered graph parser diagnostics retain imported file positions', async () => {
  const root = mkdtempSync(join(tmpdir(), 'rendered-diagnostic-'))
  try {
    const child = join(root, 'child.css')
    writeFileSync(child, '/* authored */\n.card{@compose "block";}')
    await expect(compileRenderedStylesheet(join(root, 'entry.css'), '@import "./child.css";', { baseManifest, projectDir: root })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: child, range: { start: expect.objectContaining({ line: 1 }), end: expect.objectContaining({ line: 1 }) } })] })
  } finally { rmSync(root, { recursive: true, force: true }) }
})
