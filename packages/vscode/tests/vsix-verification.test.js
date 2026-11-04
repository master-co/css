import { expect, test } from 'vitest'
import { assertCandidateSet } from '../scripts/verify-vsix-archives.mjs'
import { verificationEnvironment } from '../scripts/verify-vsix.mjs'
import { TARGETS } from '../scripts/package-target-core.js'

test('verification clears host resolution overrides and publishing credentials even when a launcher merges its environment', () => {
  const original = { PATH: '/bin', NODE_PATH: '/checkout/node_modules', NODE_OPTIONS: '--import /checkout/shim.mjs',
    ELECTRON_RUN_AS_NODE: '1', MASTER_CSS_NATIVE_BINDING_PATH: '/checkout/mastercss.node',
    MASTER_CSS_NATIVE_CLI_PATH: '/checkout/mcss', VSCE_PAT: 'private-test-token', OVSX_PAT: 'private-test-token' }
  const child = { ...original, ...verificationEnvironment(original) }
  expect(child.PATH).toBe('/bin')
  for (const key of Object.keys(original).filter(key => key !== 'PATH')) expect(child[key]).toBeUndefined()
  expect(original.NODE_PATH).toBe('/checkout/node_modules')
})

test('archive inventory rejects a missing target, an unsupported target, duplicates and stale versions', () => {
  const files = TARGETS.map(target => `master-css-vscode-2.0.37-${target}.vsix`)
  expect(() => assertCandidateSet(files, '2.0.37')).not.toThrow()
  for (const invalid of [files.slice(1), [...files, files[0]], [...files, 'master-css-vscode-2.0.37-linux-armhf.vsix'],
    files.map(file => file.replace('2.0.37', '2.0.36'))]) {
    expect(() => assertCandidateSet(invalid, '2.0.37')).toThrow('exactly the eight reviewed target archives')
  }
})
