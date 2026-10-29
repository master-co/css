import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { workspaceDependency } from './workspace-dependency'

test('fixtures resolve real workspace packages and owner-specific compiler versions', () => {
  const manifest = (name: string, owner?: URL) => JSON.parse(readFileSync(join(workspaceDependency(name, owner), 'package.json'), 'utf8'))
  assert.equal(manifest('@master/css').name, '@master/css')
  assert.equal(manifest('typescript').version, '7.0.2')
  for (const owner of ['../../examples/angular/package.json', '../../packages/svelte/package.json']) {
    assert.equal(manifest('typescript', new URL(owner, import.meta.url)).version, '6.0.3')
  }
  assert.equal(manifest('webpack', new URL('../../packages/webpack/package.json', import.meta.url)).name, 'webpack')
  assert.throws(() => workspaceDependency('@master/missing-fixture-dependency'), /Missing installed fixture dependency/)
})
