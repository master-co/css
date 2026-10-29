import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { legacyTypeScriptAlias, legacyTypeScriptPackages, legacyTypeScriptVersion } from './toolchain-policy.mjs'

const require = createRequire(import.meta.url)
const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
assert.equal(manifest.packageManager, 'bun@1.4.4')
assert.equal(execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim(), '1.4.4')
assert.equal(require('typescript/package.json').version, '7.0.2')
assert.equal(manifest.devDependencies.typescript, '7.0.2')
assert.equal(manifest.devDependencies.typescript6, undefined)
assert.equal(manifest.devDependencies['@typescript/native-preview'], undefined)
assert.equal(manifest.devDependencies['@ts-macro/tsc'], undefined)
for (const name of legacyTypeScriptPackages) {
  assert.equal(manifest.packageExtensions[name]?.dependencies?.[legacyTypeScriptAlias], `npm:typescript@${legacyTypeScriptVersion}`, `${name} must declare its isolated legacy API`)
  const file = resolve('node_modules', name, 'package.json')
  if (existsSync(file)) assert.equal(createRequire(file)('typescript/package.json').version, legacyTypeScriptVersion, `${name} loaded the root compiler`)
}
const sourceFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
for (const file of sourceFiles) {
  if (!/\.[cm]?[jt]sx?$/.test(file) || !existsSync(file)) continue
  assert.doesNotMatch(readFileSync(file, 'utf8'), /(?:from\s*|import\s*\(|require\s*\()\s*['"](?:typescript6|typescript-legacy-api)(?:\/|['"])/, `${file} must use TS7`)
}
assert.ok(existsSync('bun.lock'))
assert.equal(existsSync('pnpm-lock.yaml'), false)
assert.equal(existsSync('pnpm-workspace.yaml'), false)
console.log('Validated Bun 1.4.4, repository TS7, and isolated third-party TS6 dependencies.')
