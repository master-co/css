import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner, type MasterCSSScannerSourceResult } from '../../src/scanner/node'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest
const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }

for (const binding of ['native', 'wasm'] as const) {
  test(`scanSource retains full input candidates on cache hits and repeated files (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, verbose: 0 })
    try {
      await scanner.init()
      const content = 'document.body.className = "display:block"'
      const first: MasterCSSScannerSourceResult = await scanner.scanSource('a.mjs', content)
      expect(first).toEqual({ changed: true, sourceChanged: true, candidates: ["display:block"] })
      expect(await scanner.scanSource('a.mjs', content)).toEqual({ changed: false, sourceChanged: false, candidates: ["display:block"] })
      expect(await scanner.scanSource('b.mjs', content)).toEqual({ changed: false, sourceChanged: true, candidates: ["display:block"] })
      expect(await scanner.scanSource('empty.js', '')).toEqual({ changed: false, sourceChanged: true, candidates: [] })
      expect([...scanner.validClasses]).toEqual(["display:block"])
      expect(scanner.css.text).toContain(".display\\:block{display:block}")
    } finally { await scanner.dispose() }
  })

  test(`existing boolean scan and module filters keep behavior (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, exclude: ['excluded/**'], verbose: 0 })
    try {
      await scanner.init()
      let changes = 0
      scanner.on('change', () => changes++)
      expect(await scanner.scan('a.html', "<div class=\"display:block\"></div>")).toBe(true)
      expect(await scanner.scan('a.html', "<div class=\"display:block\"></div>")).toBe(false)
      expect(await scanner.scanModule('excluded/a.mjs', 'document.body.className = "display:inline"')).toBe(false)
      expect(await scanner.scanModule('style.css', 'document.body.className = "display:inline"')).toBe(false)
      expect(await scanner.scanModule('a.mjs', 'document.body.className = "display:inline"')).toBe(true)
      expect(changes).toBe(2)
    } finally { await scanner.dispose() }
  })

  test(`candidate ownership stays distinct from native, safelist and blocklist classification (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, safelist: ["display:inline"], blocklist: ["display:none"], verbose: 0 })
    try {
      await scanner.init()
      scanner.registerNativeClasses('stylesheet', ['native'])
      const results = await Promise.all([
        scanner.scanSource('a.html', "<div class=\"display:block display:none native\"></div>"),
        scanner.scanSource('b.html', "<div class=\"display:block native\"></div>")
      ])
      expect([...results[0].candidates].sort()).toEqual(["display:block", "display:none", 'native'])
      expect([...results[1].candidates].sort()).toEqual(["display:block", 'native'])
      expect([...scanner.validClasses]).toEqual(["display:block", "display:inline"])
      expect([...scanner.usedNativeClasses]).toEqual(['native'])
      expect(scanner.css.text).toContain('display:inline')
      expect(scanner.css.text).not.toContain('display:none')
      expect(results.flatMap((result) => result.candidates)).not.toContain("display:inline")
    } finally { await scanner.dispose() }
  })

  test(`asynchronous adapters and reset preserve each source result (${binding})`, async () => {
    const scanner = new MasterCSSScanner({ manifest, binding, wasm, verbose: 0 })
    try {
      await scanner.init()
      const results = await Promise.all([
        scanner.scanSource('a.vue', "<template><div class=\"display:block display:flex\"></div></template>"),
        scanner.scanSource('b.svelte', "<div class=\"display:block display:grid\"></div>"),
        scanner.scanSource('c.html', "<div class=\"display:inline\"></div>")
      ])
      expect(results.map((result) => [...result.candidates].sort())).toEqual([["display:block", "display:flex"], ["display:block", "display:grid"], ["display:inline"]])
      expect([...scanner.validClasses].sort()).toEqual(["display:block", "display:flex", "display:grid", "display:inline"])
      await scanner.reset()
      expect(await scanner.scanSource('a.vue', "<template><div class=\"display:block display:flex\"></div></template>")).toEqual({ changed: true, sourceChanged: true, candidates: ["display:block", "display:flex"] })
      expect([...scanner.validClasses].sort()).toEqual(["display:block", "display:flex"])
    } finally { await scanner.dispose() }
  })
}

test('overlapping snapshots and updates converge to the latest owner contents', async () => {
  await using scanner = await new MasterCSSScanner({ manifest, verbose: 0 }).init()
  const snapshot = scanner.reconcileSources('view', [
    { source: 'a.html', content: '<div class="display:block"/>' },
    { source: 'b.html', content: '<div class="display:flex"/>' }
  ])
  const update = scanner.scanSource('a.html', "<div class=\"display:grid\"/>", { owner: 'view' })
  await Promise.all([snapshot, update])
  expect([...scanner.validClasses]).toEqual(["display:flex", "display:grid"])
  const child = scanner.scanSource('live', "<div class=\"display:none\"/>", { owner: 'view', parentSource: 'a.html' })
  scanner.removeSource('a.html', { owner: 'view' })
  await child
  expect([...scanner.validClasses]).toEqual(["display:flex"])
  const pending = scanner.reconcileSources('view', [{ source: 'b.html', content: '<div class="display:block"/>' }])
  scanner.removeSource('b.html', { owner: 'view' })
  await pending
  expect([...scanner.validClasses]).toEqual([])
})

test('failed source and snapshot parsing preserve successful virtual-source ancestry', async () => {
  await using scanner = await new MasterCSSScanner({ manifest, verbose: 0 }).init()
  await scanner.scanSource('parent.html', "<div class=\"display:block\"/>")
  await scanner.scanSource('live.mdx', "<div className=\"display:flex\"/>", { parentSource: 'parent.html' })
  await expect(scanner.scanSource('live.mdx', '{broken', { parentSource: 'other.html' })).rejects.toThrow()
  await expect(scanner.reconcileSources('project', [{ source: 'live.mdx', content: '{broken', options: { parentSource: 'other.html' } }])).rejects.toThrow()
  expect([...scanner.validClasses]).toEqual(["display:block", "display:flex"])
  const pending = scanner.scanSource('nested.html', "<div class=\"display:grid\"/>", { parentSource: 'live.mdx' })
  scanner.removeSource('parent.html')
  await pending
  expect([...scanner.validClasses]).toEqual([])
})
