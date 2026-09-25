import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { createEngine } from '@master/css'

for (const explicit of [false, true]) {
  for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' screen', ' layer(cards) supports(display:grid) screen']) {
    test(`BH-0004 filesystem project ${explicit ? 'explicit entries' : 'discovery'} ${qualifier || 'unqualified'}`, async () => {
      const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-filesystem-binding-')))
      const binding = createCompilerBindingSessionSync()
      try {
        const entry = join(root, 'entry.css'), child = join(root, 'styles/child.css'), tokens = join(root, 'tokens.css')
        const view = join(root, 'styles/views/view.html')
        mkdirSync(join(root, 'styles/views'), { recursive: true })
        writeFileSync(entry, `@import './styles/child.css'${qualifier};@master entry;@reference './tokens.css';@utilities{button{@compose paint;}}`)
        writeFileSync(child, "@import 'https://invalid.invalid/external.css';@reference '../tokens.css';@source './views/*.html';.card{@compose paint;}.ordinary{color:blue}")
        writeFileSync(tokens, '@utilities{paint{color:red}}')
        writeFileSync(view, '<div class="button card"></div>')
        const result = binding.loadProjectManifest(root, { version: 1, languageVersion: 3, utilities: [] }, explicit ? [entry] : undefined)
        expect(result.sourcePlan.files).toEqual([view])
        expect([...result.dependencies].sort()).toEqual([entry, child, tokens].sort())
        expect(result.css).toContain('.card{color:red}')
        expect(result.generatedCSS).toContain('.card{color:red}')
        expect(result.css).not.toContain('.ordinary')
        expect(result.css).not.toContain('@import')
        if (qualifier.includes('layer')) expect(result.css).toContain('@layer')
        if (qualifier.includes('supports')) expect(result.css).toContain('@supports')
        if (qualifier.includes('screen')) expect(result.css).toContain('@media screen')
        const engine = await createEngine({ binding: 'native', manifest: result.manifest })
        try {
          engine.ensureClassRules(['button', 'paint'])
          expect(engine.snapshot().text).toContain('.button{color:red}')
          expect(engine.snapshot().text).not.toContain('.paint{')
        } finally { engine.dispose() }
      } finally { binding.dispose(); rmSync(root, { recursive: true, force: true }) }
    })
  }
}
