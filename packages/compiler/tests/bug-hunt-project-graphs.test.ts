import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createEngine } from '@master/css'
import { compileProjectManifest, loadProjectManifest } from '../src/project/manifest'
import { compileProjectManifestSync } from '../src/project/manifest-sync'
import { loadBindingProjectManifest } from '../src/project/binding-project'
import { collectStylesheetDependenciesSync } from '../src/stylesheet/public'

for (const condition of ['layer(shared)', 'layer', 'supports(display:grid) screen']) {
  test(`BH-0004 project manifests retain definitions through ${condition} with external imports`, async () => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-project-graphs-')))
    try {
      mkdirSync(join(cwd, 'styles/templates'), { recursive: true })
      const entry = join(cwd, 'entry.css')
      const child = join(cwd, 'styles/child.css')
      const tokens = join(cwd, 'tokens.css')
      const template = join(cwd, 'styles/templates/view.html')
      writeFileSync(entry, `@import './styles/child.css' ${condition};@master entry;@reference './tokens.css';@components{widget{@compose paint;}button{@compose widget;}}`)
      writeFileSync(child, `@import 'https://remote.test/external.css';@reference '../tokens.css';@source './templates/*.html';.native{color:blue}`)
      writeFileSync(tokens, '@utilities{paint{color:red}}.reference-native{color:green}')
      writeFileSync(template, '<div class="widget button"></div>')
      const baseManifest = { version: 1 as const, languageVersion: 2 as const, utilities: [] }
      const options = { root: cwd, entries: [entry], baseManifest }
      const results = [await compileProjectManifest(options), await loadProjectManifest(options), compileProjectManifestSync(options)]
      for (const result of results) {
        expect([...result.dependencies].sort()).toEqual([entry, child, tokens].sort())
        const engine = await createEngine({ manifest: result.manifest, binding: 'native' })
        try {
          engine.ensureClassRules(['button', 'widget', 'paint'])
          const css = engine.snapshot().text
          expect(css).toContain('.button{color:red}')
          expect(css).toContain('.widget{color:red}')
          expect(css).not.toContain('.paint{')
        } finally { engine.dispose() }
      }
      expect(results[1].manifest).toEqual(results[0].manifest)
      expect(results[2].manifest).toEqual(results[0].manifest)
      const internal = loadBindingProjectManifest(cwd, baseManifest, [entry])
      expect(internal.sourcePlan.files).toEqual([template])
      expect(internal.css).toBe('')
      expect(internal.nativeCSS).toBe('')
      expect(collectStylesheetDependenciesSync(entry, undefined, { projectDir: cwd })).toContain(child)
    } finally { rmSync(cwd, { recursive: true, force: true }) }
  })
}


test('BH-0004 project graph preserves explicit entry order', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-project-order-')))
  try {
    const a = join(root, 'a.css')
    const b = join(root, 'b.css')
    writeFileSync(a, '@master entry;@utilities{choice{color:red}}')
    writeFileSync(b, '@master entry;@utilities{choice{color:blue}}')
    for (const [entries, expected] of [[[a, b], '#00f'], [[b, a], 'red']] as const) {
      const result = await compileProjectManifest({ root, entries: [...entries], baseManifest: { version: 1, languageVersion: 2, utilities: [] } })
      const engine = await createEngine({ manifest: result.manifest, binding: 'native' })
      try {
        engine.ensureClassRules(['choice'])
        expect(engine.snapshot().text).toContain(`.choice{color:${expected}}`)
        expect(result.entries).toEqual(entries)
      } finally { engine.dispose() }
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('BH-0004 project graph rejects missing and circular references', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-project-reference-')))
  try {
    const entry = join(root, 'entry.css')
    const reference = join(root, 'tokens.css')
    writeFileSync(entry, "@master entry;@reference './tokens.css';")
    const options = { root, entries: [entry], baseManifest: { version: 1 as const, languageVersion: 2 as const, utilities: [] } }
    await expect(compileProjectManifest(options)).rejects.toThrow(/tokens\.css/)
    writeFileSync(reference, "@reference './entry.css';")
    await expect(compileProjectManifest(options)).rejects.toThrow(/Circular CSS reference/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
