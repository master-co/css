import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertCandidateSet } from '../scripts/verify-vsix-archives.mjs'
import { verificationEnvironment } from '../scripts/verify-vsix.mjs'
import { TARGETS } from '../scripts/package-target-core.js'
import { extractVSIX } from '../scripts/extract-vsix.mjs'

test('extracts a real VSIX ZIP through paths containing spaces on the current host', () => {
  const root = mkdtempSync(join(tmpdir(), 'vsix extraction '))
  try {
    const archive = join(root, 'candidate archive.vsix'), destination = join(root, 'extracted files')
    // ZIP containing extension/marker.txt; its extension deliberately is not .zip.
    writeFileSync(archive, Buffer.from('UEsDBBQAAAAIACSuZF3z3QNCGgAAABgAAAAUAAAAZXh0ZW5zaW9uL21hcmtlci50eHQLC/aMUEitKClKTC7JzM9TSMusKCktSuUCAFBLAQIUAxQAAAAIACSuZF3z3QNCGgAAABgAAAAUAAAAAAAAAAAAAACAAQAAAABleHRlbnNpb24vbWFya2VyLnR4dFBLBQYAAAAAAQABAEIAAABMAAAAAAA=', 'base64'))
    mkdirSync(destination)
    extractVSIX(archive, destination)
    expect(readFileSync(join(destination, 'extension/marker.txt'), 'utf8')).toBe('VSIX extraction fixture\n')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Windows extraction bypasses Git Bash tar and preserves drive-qualified paths with spaces', () => {
  const archive = 'D:\\a\\candidate files\\editor.vsix', destination = 'C:\\Users\\Test User\\Temp\\extension'
  for (const key of ['SystemRoot', 'SYSTEMROOT']) {
    const env = { [key]: 'C:\\Windows', PATH: 'C:\\Program Files\\Git\\usr\\bin' }
    const calls = []
    extractVSIX(archive, destination, { platform: 'win32', env, execute: (...args) => calls.push(args) })
    expect(calls).toEqual([['C:\\Windows\\System32\\tar.exe', ['-xf', archive, '-C', destination], { env }]])
  }
  expect(() => extractVSIX(archive, destination, { platform: 'win32', env: {}, execute: () => {} })).toThrow('SystemRoot is required')
})

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
