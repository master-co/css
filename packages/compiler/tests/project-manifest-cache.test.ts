import { mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { loadBindingProjectManifest } from '../src/project/binding-project'

const baseManifest: MasterCSSManifest = { version: 6, languageVersion: 18 }
const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-project-cache-')))
  roots.push(root)
  return root
}

/** Writes a file as if it was saved `age` seconds ago. */
function write(file: string, source: string, age = 60) {
  writeFileSync(file, source)
  const time = new Date(Date.now() - age * 1000)
  utimesSync(file, time, time)
}

test('reuses a project manifest load until a file it read changes', () => {
  const root = project()
  const entry = join(root, 'theme.css'), tokens = join(root, 'tokens.css')
  write(entry, "@import './tokens.css';")
  write(tokens, '@theme { --color-brand: red; }')
  const observe = () => {
    const files: string[] = []
    return { files, onDependency: (file: string) => { files.push(file) } }
  }
  const first = observe(), second = observe(), third = observe()
  const loaded = loadBindingProjectManifest(root, baseManifest, [entry], first.onDependency)
  const reused = loadBindingProjectManifest(root, baseManifest, [entry], second.onDependency)
  expect(reused).toBe(loaded)
  // Hosts still watch every file the reused load read.
  expect(second.files).toEqual(first.files)
  expect(first.files).toEqual(expect.arrayContaining([entry, tokens]))

  write(tokens, '@theme { --color-brand: blue; }', 30)
  const changed = loadBindingProjectManifest(root, baseManifest, [entry], third.onDependency)
  expect(changed).not.toBe(loaded)
  expect(JSON.stringify(changed.manifest)).toContain('blue')
  expect(loadBindingProjectManifest(root, { ...baseManifest }, [entry])).not.toBe(changed)
})

test('never reuses a load of files written within the timestamp granularity', () => {
  const root = project()
  const entry = join(root, 'theme.css')
  write(entry, '@theme { --color-brand: red; }', 0)
  const loaded = loadBindingProjectManifest(root, baseManifest, [entry])
  expect(loadBindingProjectManifest(root, baseManifest, [entry])).not.toBe(loaded)
})
