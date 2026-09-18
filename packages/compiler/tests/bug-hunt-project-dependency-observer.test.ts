import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { defaultBuildManifest } from '@master/css-internal/project'
import { loadProjectManifest } from '../src/project/manifest'
import { loadProjectManifestSync } from '../src/project/manifest-sync'

for (const [kind, load] of [['async', loadProjectManifest], ['sync', loadProjectManifestSync]] as const) {
  test.each(['import', 'reference'] as const)(`BH-0004 ${kind} project reports missing nested %s before failure and recovers`, async directive => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-project-dependency-')))
    const entry = join(root, 'app.css'), child = join(root, 'child.css'), missing = join(root, 'nested/tokens.css')
    try {
      writeFileSync(entry, '@master entry;@import "./child.css";@components{card{@compose paint;}}')
      writeFileSync(child, `@${directive} "./nested/tokens.css";`)
      const dependencies: string[] = []
      await expect(Promise.resolve().then(() => load({ root, entries: [entry], baseManifest: defaultBuildManifest, onDependency: file => dependencies.push(file) }))).rejects.toThrow('tokens.css')
      expect(dependencies).toEqual([entry, child, missing])
      mkdirSync(join(root, 'nested'));writeFileSync(missing, '@utilities{paint{padding:7rem}}')
      const observed: string[] = []
      const result = await load({ root, entries: [entry], baseManifest: defaultBuildManifest, onDependency: file => observed.push(file) })
      expect(observed).toEqual([entry, child, missing]);expect(new Set(result.dependencies)).toEqual(new Set(observed))
      expect(JSON.stringify(result.manifest)).toContain('7rem')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })

  test(`BH-0004 ${kind} project dependency callback runs before reading and observes shared files once`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-project-before-read-')))
    const entries = [join(root, 'first.css'), join(root, 'second.css')], target = join(root, 'tokens.css'), observed: string[] = []
    try {
      for (const entry of entries) writeFileSync(entry, '@master entry;@reference "./tokens.css";@components{card{@compose paint;}}')
      const result = await load({ root, entries, baseManifest: defaultBuildManifest, onDependency(file) {
        observed.push(file)
        if (file === target) writeFileSync(target, '@utilities{paint{padding:7rem}}')
      } })
      expect(observed).toEqual([entries[0], target, entries[1]])
      expect(JSON.stringify(result.manifest)).toContain('7rem')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
