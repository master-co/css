import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { collectStylesheetEmittedGlobals } from '../src/stylesheet/public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
for (const qualifier of ['', 'layer(shared)', 'layer', 'supports(display:grid) screen']) {
  test(`BH-0004 emitted globals traverse ${qualifier || 'unqualified'} imports with external descendants`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-emitted-graph-')))
    const entry = join(root, 'entry.css'), child = join(root, 'child.css'), reference = join(root, 'reference.css')
    try {
      writeFileSync(entry, `@import "./child.css" ${qualifier};@master entry;@reference "./reference.css";.native{@compose paint;}`)
      writeFileSync(child, '@import "https://external.test/style.css";.child{padding-block:var(--spacing-5xl);background:url(host-owned.svg)}')
      writeFileSync(reference, '@utilities{paint{color:var(--color-blue-60)}}.reference-only{padding:var(--spacing-6xl)}')
      const result = await collectStylesheetEmittedGlobals([entry], { baseManifest, projectDir: root })
      expect(result.emittedGlobals.variables).toHaveProperty('spacing-5xl')
      expect(result.emittedGlobals.variables).toHaveProperty('color-blue-60')
      expect(result.emittedGlobals.variables).not.toHaveProperty('spacing-6xl')
      expect([...result.dependencies].sort()).toEqual([entry, child, reference].sort())
      expect(Object.isFrozen(result.emittedGlobals.variables)).toBe(true)
      const again = await collectStylesheetEmittedGlobals([entry, entry], { baseManifest, projectDir: root })
      expect(again).toEqual(result)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

test('BH-0004 metadata skips unmanaged inputs and reports missing managed dependencies', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-emitted-errors-')))
  const entry = join(root, 'entry.css'), child = join(root, 'child.css')
  try {
    writeFileSync(entry, '.plain{padding:var(--spacing-5xl)}')
    expect(await collectStylesheetEmittedGlobals([entry], { baseManifest, projectDir: root })).toEqual({ emittedGlobals: { variables: {}, animations: {} }, dependencies: [] })
    writeFileSync(entry, '@master entry;@import "./child.css" layer;')
    await expect(collectStylesheetEmittedGlobals([entry], { baseManifest, projectDir: root })).rejects.toThrow(/child\.css/)
    writeFileSync(child, '@reference "./entry.css";.child{padding:var(--spacing-5xl)}')
    await expect(collectStylesheetEmittedGlobals([entry], { baseManifest, projectDir: root })).rejects.toThrow(/Circular CSS reference/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
