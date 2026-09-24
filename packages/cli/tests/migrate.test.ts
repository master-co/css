import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import runMigrate, { type MigrateOptions } from '../src/migrate'

const migrate = (paths: string[], options: MigrateOptions) => runMigrate([...paths, 'app.css'], { from: 'rc-legacy', sourceVersion: '2.0.0-rc.87', ...options })

const temporary: string[] = []
function project() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'master-css-rc-migration-'))
  temporary.push(cwd)
  fs.copyFileSync(path.resolve(__dirname, '../../../crates/mastercss-compiler/tests/fixtures/v2-rc-before-named-tokens.manifest.json'), path.join(cwd, 'master.rc.manifest.json'))
  fs.writeFileSync(path.join(cwd, 'app.css'), '@master entry; @settings { root-size:16; }')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  return cwd
}
afterEach(() => {
  vi.restoreAllMocks()
  for (const cwd of temporary.splice(0)) fs.rmSync(cwd, { recursive: true, force: true })
})

it('previews by default, writes safe files, and is idempotent', () => {
  const cwd = project()
  const source = '<div class="font:mono p:4x fg:red:hover"></div>'
  fs.writeFileSync(path.join(cwd, 'index.html'), source)
  const preview = migrate(['index.html'], { cwd })
  expect(preview.files.find(file => file.path === 'index.html')!.edits).toHaveLength(3)
  expect(fs.readFileSync(path.join(cwd, 'index.html'), 'utf8')).toBe(source)
  const written = migrate(['index.html'], { cwd, write: true })
  expect(written.files.find(file => file.path === 'index.html')!.written).toBe(true)
  expect(fs.readFileSync(path.join(cwd, 'index.html'), 'utf8')).toBe('<div class="font-mono p:1rem fg-red:hover"></div>')
  expect(migrate(['index.html'], { cwd }).files.find(file => file.path === 'index.html')!.edits).toEqual([])
})

it('does not write dynamic classes, cascade risks, or selector references', () => {
  const cwd = project()
  const inputs = {
    'dynamic.tsx': 'const view = <div className={`p:${size} font:mono`} />',
    'cascade.html': '<div class="p:md p:8px"></div>',
    'selector.ts': 'document.querySelector(".font\\\\:mono")',
    'safe.html': '<div class="font:mono"></div>'
  }
  for (const [name, source] of Object.entries(inputs)) fs.writeFileSync(path.join(cwd, name), source)
  const result = migrate(['*.{html,ts,tsx}'], { cwd, write: true })
  expect(result.files.filter(file => file.review.length)).toHaveLength(3)
  expect(result.files.every(file => !file.written)).toBe(true)
  for (const [name, source] of Object.entries(inputs)) expect(fs.readFileSync(path.join(cwd, name), 'utf8')).toBe(source)
})

it('fails before writing when the saved configuration cannot be read', () => {
  const cwd = project()
  fs.writeFileSync(path.join(cwd, 'index.html'), '<div class="p:4x"></div>')
  expect(() => migrate(['index.html'], { cwd, manifest: 'missing.json', write: true })).toThrow()
  fs.writeFileSync(path.join(cwd, 'master.rc.manifest.json'), '{broken')
  expect(() => migrate(['index.html'], { cwd, write: true })).toThrow()
  expect(fs.readFileSync(path.join(cwd, 'index.html'), 'utf8')).toContain('p:4x')
})

it('reads custom RC units and preserves native resolution descriptors', () => {
  const cwd = project()
  const manifestPath = path.join(cwd, 'master.rc.manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.settings = { ...manifest.settings, baseUnit: 6, rootSize: 20 }
  fs.writeFileSync(path.join(cwd, 'app.css'), '@master entry; @settings { base-unit:6; root-size:20; }')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  fs.writeFileSync(path.join(cwd, 'index.html'), '<div class="m:-2.5x p:calc(4x+2px) background-image:image-set(url(a.png)|1x,url(b.png)|2x)"></div>')
  const result = migrate(['index.html'], { cwd, write: true })
  expect(result.files.find(file => file.path === 'index.html')!.review).toEqual([])
  expect(fs.readFileSync(path.join(cwd, 'index.html'), 'utf8')).toBe('<div class="m:-0.75rem p:calc(1.2rem+2px) background-image:image-set(url(a.png)|1x,url(b.png)|2x)"></div>')
})


it('previews the named RC profile with the saved root size and blocks a mixed unsafe batch', () => {
  const cwd = project()
  const saved = {
    version: 1, packageVersion: '2.0.0-rc.named', settings: { rootSize: 20 },
    variables: { spacing: [{ key: 'md', value: '1rem' }] }, utilities: []
  }
  fs.writeFileSync(path.join(cwd, 'master.rc.manifest.json'), JSON.stringify(saved))
  const safe = '<div class="p-md@>=800 width:8px@media((width>=800px))"></div>'
  const unsafe = '<div class="p-md@>=800px"></div>'
  fs.writeFileSync(path.join(cwd, 'safe.html'), safe)
  fs.writeFileSync(path.join(cwd, 'unsafe.html'), unsafe)
  const result = runMigrate(['*.html'], { cwd, from: 'rc-named', write: true })
  expect(result).toMatchObject({ version: 2, from: 'rc-named', sourceVersion: saved.packageVersion })
  expect(result.configurationCSS).toContain('@mode dark')
  expect(result.files.find(file => file.path === 'safe.html')?.edits).toEqual([
    expect.objectContaining({ before: 'p-md@>=800', after: 'p-md@media((width>=40rem))' })
  ])
  expect(result.files.find(file => file.path === 'unsafe.html')?.review.length).toBeGreaterThan(0)
  expect(result.files.every(file => !file.written)).toBe(true)
  expect(fs.readFileSync(path.join(cwd, 'safe.html'), 'utf8')).toBe(safe)
  expect(fs.readFileSync(path.join(cwd, 'unsafe.html'), 'utf8')).toBe(unsafe)
  fs.writeFileSync(path.join(cwd, 'safe.html'), safe.replace('p-md@>=800', 'p-md@media((width>=40rem))'))
  expect(runMigrate(['safe.html'], { cwd, from: 'rc-named' }).files[0].edits).toEqual([])
})

it('requires an explicit profile and the actual saved package version', () => {
  const cwd = project()
  expect(() => runMigrate([], { cwd })).toThrow('--from')
  expect(() => runMigrate([], { cwd, from: 'rc-named' })).toThrow('actual RC package version')
})
