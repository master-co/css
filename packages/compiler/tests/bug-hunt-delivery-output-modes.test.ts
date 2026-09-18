import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { createStylesheetCollection } from '../src/stylesheet/index-public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest

for (const preserveNativeCSS of [false, true]) for (const includeNativeCSS of [false, true]) for (const includeMasterBaseCSS of [false, true]) for (const includeGeneratedCSS of [false, true]) {
  test(`BH-0004 standalone output preserve=${preserveNativeCSS}/native=${includeNativeCSS}/base=${includeMasterBaseCSS}/generated=${includeGeneratedCSS}`, async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-delivery-modes-'))
    const packageRoot = join(cwd, 'node_modules/@master/css')
    mkdirSync(packageRoot, { recursive: true })
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
    writeFileSync(join(packageRoot, 'index.css'), "@import './base.css' layer(master);.from-master{border-top-width:7px}@utilities{package-custom{color:orange}}")
    writeFileSync(join(packageRoot, 'base.css'), '.from-master-child{border-bottom-width:8px}')
    writeFileSync(join(cwd, 'entry.css'), "@import '@master/css';@import './child.css' supports(display:grid) screen;@import 'https://remote.test/a.css';@master entry;@utilities{custom{color:purple}}.project{color:red}.composed{@compose block;}")
    writeFileSync(join(cwd, 'child.css'), '.nested{background-color:green}')
    const scanner = new MasterCSSScanner({ manifest: baseManifest }, cwd)
    const collection = createStylesheetCollection()
    const delivery = {
      entryURL: './output.css', relativeResourceURLs: true,
      stylesheetURL: (file: string, variant?: string) => `./${createHash('sha256').update(variant ?? file).digest('hex')}.css`,
      resourceURL: () => './unused-resource'
    }
    try {
      await scanner.init()
      await collection.register(scanner, join(cwd, 'entry.css'), readFileSync(join(cwd, 'entry.css'), 'utf8'), { baseManifest, projectDir: cwd, delivery })
      await scanner.scan(join(cwd, 'index.html'), '<div class="project nested composed from-master from-master-child block custom package-custom"></div>')
      const result = await collection.compose({ scanner, baseManifest, projectDir: cwd, delivery, includeNativeCSS, includeMasterBaseCSS, includeGeneratedCSS, preserveNativeCSS })
      const css = [result.css, ...(result.stylesheets || []).map(asset => asset.css)].join('\n')
      expect(css.includes('.project')).toBe(includeNativeCSS && preserveNativeCSS)
      expect(css.includes('.nested')).toBe(includeNativeCSS && preserveNativeCSS)
      expect(css.includes('.composed')).toBe(includeNativeCSS)
      expect(css.includes('https://remote.test/a.css')).toBe(includeNativeCSS && preserveNativeCSS)
      expect(css.includes('.from-master {')).toBe(includeMasterBaseCSS && preserveNativeCSS)
      expect(css.includes('.from-master-child')).toBe(includeMasterBaseCSS && preserveNativeCSS)
      expect(css.includes('.block{display:block}')).toBe(includeGeneratedCSS)
      expect(css.includes('.custom{color:purple}')).toBe(includeGeneratedCSS)
      expect(css.includes('.package-custom{color:orange}')).toBe(includeGeneratedCSS)
      // Even a suppressed project wrapper must retain links to selected base assets.
      if (!includeNativeCSS && (!includeMasterBaseCSS || !preserveNativeCSS)) {
        expect(result.css).not.toContain('@import')
        expect(result.stylesheets).toHaveLength(0)
      } else expect(result.css).toContain('@import')
    } finally { await scanner.dispose(); collection.dispose(); rmSync(cwd, { recursive: true, force: true }) }
  })
}

test('BH-0004 native/Wasm select native output without losing manifest definitions or local links', async () => {
  const { createCompiler } = await import('../src/index')
  const request = {
    graph: { entry: 'entry', files: {
      entry: "@import './child.css' layer(base);@import 'https://remote.test/entry.css';@utilities{paint{color:red}}.entry{@compose paint;}",
      child: "@import 'https://remote.test/child.css';.child{color:blue}"
    }, edges: [{ from: 'entry', specifier: './child.css', resolved: 'child' }] },
    urls: { entry: '/output.css', child: '/child.css' },
    baseManifest, nativeStylesheets: ['child']
  }
  using native = await createCompiler({ binding: 'native' })
  using wasm = await createCompiler({ binding: 'wasm' })
  const result = native.compileStylesheets(request)
  expect(wasm.compileStylesheets(request)).toEqual(result)
  expect(result.css).toContain('layer(base)')
  expect(result.css).not.toContain('remote.test/entry.css')
  expect(result.stylesheets[1].css).toContain('remote.test/child.css')
  expect(result.css).not.toContain('.entry')
  expect(result.manifest).toEqual(native.compileStylesheets({ ...request, nativeStylesheets: undefined }).manifest)
  const withoutRaw = { ...request, nativeStylesheets: ['entry', 'child'], options: { preserveNativeCSS: false } }
  const composed = native.compileStylesheets(withoutRaw)
  expect(wasm.compileStylesheets(withoutRaw)).toEqual(composed)
  expect(composed.css).toContain('.entry')
  expect(composed.stylesheets.every(asset => !asset.css.includes('remote.test'))).toBe(true)
  for (const compiler of [native, wasm]) {
    expect(() => compiler.compileStylesheets({ ...request, nativeStylesheets: ['missing'] })).toThrow('Unknown native stylesheet: missing')
  }
})
