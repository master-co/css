import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { compareVersions, resolveEditorVersion, stampManifest } from '../scripts/editor-version.mjs'

test('the editor takes the npm release version once npm reaches its floor', () => {
  expect(resolveEditorVersion('2.0.38', '2.1.0')).toBe('2.1.0')
  expect(resolveEditorVersion('2.0.38', '2.1.1')).toBe('2.1.1')
  expect(resolveEditorVersion('2.0.38', '2.0.38')).toBe('2.0.38')
  expect(resolveEditorVersion('2.0.38', '10.0.0')).toBe('10.0.0')
})

test('the floor stays while npm is behind it, releases a prerelease or plans no release', () => {
  expect(resolveEditorVersion('2.0.38', '2.0.5')).toBe('2.0.38')
  expect(resolveEditorVersion('2.0.38', '2.1.0-rc.1')).toBe('2.0.38')
  expect(resolveEditorVersion('2.0.38', '')).toBe('2.0.38')
  expect(resolveEditorVersion('2.0.38', undefined)).toBe('2.0.38')
  expect(() => resolveEditorVersion('2.0', '2.1.0')).toThrow()
})

test('versions compare numerically', () => {
  expect(compareVersions('2.0.10', '2.0.9')).toBe(1)
  expect(compareVersions('2.1.0', '2.0.38')).toBe(1)
  expect(compareVersions('2.0.38', '2.0.38')).toBe(0)
  expect(compareVersions('1.9.9', '2.0.0')).toBe(-1)
})

test('stamping changes only the version line and never goes below the floor', () => {
  const text = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  const floor = JSON.parse(text).version
  const [major, minor] = floor.split('.').map(Number)
  const next = `${major}.${minor + 1}.0`
  const stamped = stampManifest(text, next)
  expect(JSON.parse(stamped).version).toBe(next)
  expect(stamped.replace(`"version": "${next}"`, `"version": "${floor}"`)).toBe(text)
  expect(stampManifest(text, floor)).toBe(text)
  expect(() => stampManifest(text, '0.0.1')).toThrow(/below the floor/)
  expect(() => stampManifest(text, `${next}-rc.1`)).toThrow(/stable version/)
  expect(() => stampManifest(text, '')).toThrow(/stable version/)
})
