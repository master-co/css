import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { lintCacheFingerprint } from './lint-cache.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'master-site-lint-cache-'))
  const site = join(root, 'site')
  const write = (file, content) => {
    const path = join(root, file)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }
  t.after(() => rmSync(root, { recursive: true, force: true }))
  write('package.json', '{}')
  write('site/package.json', JSON.stringify({ dependencies: { '@master/css': '*' } }))
  write('site/app/index.css', '@import "@master/css"; @import "../../theme.css";')
  write('theme.css', '@mixin --fixture-one { color: red; }')
  write('site/app/page.tsx', 'export default function Page() { return null }')
  return { root, site, write, key: () => lintCacheFingerprint({ root, site }) }
}

test('content keys remain stable across source edits and cache writes', t => {
  const { key, write } = fixture(t)
  const before = key()
  write('site/app/page.tsx', 'export default function Page() { return <div /> }')
  write('site/.cache/eslint/result.json', '{}')
  assert.equal(key(), before)
})

test('CSS contents, transitive imports and entry topology invalidate cached sources', t => {
  const { root, key, write } = fixture(t)
  let before = key()
  write('theme.css', '@mixin --fixture-two { color: red; }')
  assert.notEqual(key(), before)
  before = key()
  write('site/new/entry.css', '@import "@master/css"; @mixin --fixture-three { color: blue; }')
  assert.notEqual(key(), before)
  before = key()
  rmSync(join(root, 'site/new/entry.css'))
  assert.notEqual(key(), before)
})

test('package ownership and route filenames invalidate other files', t => {
  const { key, write } = fixture(t)
  let before = key()
  write('site/child/package.json', JSON.stringify({ dependencies: { '@master/css': '*' } }))
  assert.notEqual(key(), before)
  before = key()
  write('site/app/new/page.tsx', 'export default function Page() { return null }')
  assert.notEqual(key(), before)
})

test('config, lockfile and delivered plugin/native bytes are part of the namespace', t => {
  const { key, write } = fixture(t)
  write('packages/eslint-config/package.json', JSON.stringify({ name: '@master/eslint-config-css', files: ['dist'], dependencies: { '@master/eslint-plugin-css': 'workspace:*' } }))
  write('packages/eslint-plugin/package.json', JSON.stringify({ name: '@master/eslint-plugin-css', files: ['dist'], dependencies: { '@master/css-binding': 'workspace:*' } }))
  write('packages/binding/package.json', JSON.stringify({ name: '@master/css-binding', files: ['artifacts', 'manifest.json'] }))
  for (const file of ['site/eslint.rules.js', 'pnpm-lock.yaml', 'packages/eslint-plugin/dist/index.js', 'packages/binding/artifacts/mastercss.node', 'packages/binding/manifest.json']) {
    const before = key()
    write(file, 'changed bytes')
    assert.notEqual(key(), before, file)
  }
})

test('unresolvable imports cannot produce a reusable key', t => {
  const { key, write } = fixture(t)
  write('site/app/index.css', '@import "@master/css"; @import "./missing.css";')
  assert.throws(key)
})
