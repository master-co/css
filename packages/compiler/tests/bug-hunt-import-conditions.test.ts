import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileManifestFileSync } from '../src/node'
import { createCompilerBindingSession } from '../src/session'

for (const binding of ['native', 'wasm'] as const) {
  test(`${binding}: BH-0004 keeps import conditions through graph and CSS compilation`, async () => {
    const compiler = await createCompilerBindingSession({ binding })
    try {
      expect(compiler.binding).toBe(binding)
      const graph = compiler.resolveCSSImportGraph({
        entry: 'entry',
        files: {
          entry: "@import 'child' layer(outer) supports(display:grid) screen;",
          child: "@import 'grandchild' layer(inner) (min-width:500px);",
          grandchild: '.example{color:red}'
        },
        edges: [
          { from: 'entry', specifier: 'child', resolved: 'child' },
          { from: 'child', specifier: 'grandchild', resolved: 'grandchild' }
        ]
      })
      expect(graph.dependencies).toEqual(['entry', 'child', 'grandchild'])
      expect(graph.source).toBe('@supports (display: grid){@media screen{@layer outer{@media (width >= 500px){@layer inner{.example{color:red}}}}}}')
      const compiled = compiler.compileCSS(graph.source, { preserveNativeCSS: true, classes: ['example'] })
      expect(compiled.css).toContain('@supports')
      expect(compiled.css).toContain('@media screen')
      expect(compiled.css).toContain('@layer outer')
      expect(compiled.css).toContain('@layer inner')
      expect(compiled.css).toMatch(/\.example\s*\{\s*color:\s*red;?\s*\}/)
    } finally {
      compiler.dispose()
    }
  })
}

test('BH-0004 public file compiler preserves a conditional imported native rule', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-bh-import-'))
  try {
    const entry = join(root, 'entry.css')
    writeFileSync(entry, "@import './child.css' layer(theme) supports(display:grid) print;")
    writeFileSync(join(root, 'child.css'), '.example{color:red}')
    const result = compileManifestFileSync(entry, { baseManifest: { version: 1, languageVersion: 2 }, preserveNativeCSS: true, classes: ['example'] })
    expect(result.css).toContain('@supports')
    expect(result.css).toContain('@media print')
    expect(result.css).toContain('@layer theme')
    expect(result.css).toMatch(/\.example\s*\{\s*color:\s*red;?\s*\}/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
