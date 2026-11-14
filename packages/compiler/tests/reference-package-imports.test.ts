import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { compileRenderedStylesheet } from '../src/stylesheet/public'

const baseManifest: MasterCSSManifest = { version: 6, languageVersion: 18 }
const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-reference-packages-')))
  roots.push(root)
  return root
}

test('reference graphs resolve package imports even when the host resolves its own', async () => {
  const root = project()
  const tokens = join(root, 'node_modules', '@acme', 'tokens')
  mkdirSync(tokens, { recursive: true })
  writeFileSync(join(tokens, 'package.json'), JSON.stringify({ name: '@acme/tokens' }))
  writeFileSync(join(tokens, 'ring.css'), '@mixin --ring { outline: 1px solid red; }')
  writeFileSync(join(root, 'reference.css'), "@import '@acme/tokens/ring.css';")
  const file = join(root, 'card.css')
  const source = "@reference './reference.css'; .card { @apply --ring; }"
  // The Next delivery resolves entry imports itself and never asks for package resolution.
  const result = await compileRenderedStylesheet(file, source, {
    baseManifest, projectDir: root, preserveNativeCSS: true,
    delivery: { entryURL: './entry.css', stylesheetURL: id => `./${id.length}.css`, resourceURL: id => `./${id.length}` }
  })
  expect(result.css).toMatch(/\.card\s*\{\s*outline:\s*1px solid red/)
})
