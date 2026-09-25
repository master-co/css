import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileManifestFileSync } from '../src/node'
import { createCompilerBindingSession } from '../src/session'

for (const [name, statement, filename] of [
  ['bare relative filename', '@import "child.css";', 'child.css'],
  ['bare encoded filename', '@import "child%20%23.css?version=1#style";', 'child #.css'],
  ['encoded extension', '@import "./child%2Ecss";', 'child.css'],
  ['uppercase import', '@IMPORT "./child.css";', 'child.css'],
  ['escaped import and filename', '@\\69mport u\\72l("./ch\\69ld.css");', 'child.css'],
  ['URL pathname and request suffix', '@import "./child%20%23.css?version=1#style";', 'child #.css']
]) {
  test(`BH-0004 actual file compiler: ${name}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-0116-'))
    try {
      const entry = join(root, 'entry #.css')
      const child = join(root, filename!)
      writeFileSync(entry, statement!)
      writeFileSync(child, '.example{color:red}')
      const result = compileManifestFileSync(entry, { baseManifest: { version: 1, languageVersion: 3, utilities: [] }, preserveNativeCSS: true })
      expect(result.dependencies).toEqual([entry, child])
      expect(result.css).toMatch(/color:\s*red/)
      expect(result.css).not.toMatch(/@import/i)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

for (const binding of ['native', 'wasm'] as const) {
  test(`BH-0004 ${binding}: dependency analysis and flat graph use identical decoded specifiers`, async () => {
    const session = await createCompilerBindingSession({ binding })
    try {
      const source = '/*😀*/@\\69mport u\\72l("./ch\\69ld.css") layer(theme) print;'
      const analysis = session.analyzeCSSDependencies(source)
      expect(analysis.imports.map(item => item.source)).toEqual(['./child.css'])
      const item = analysis.imports[0]!
      expect(analysis.sourceWithoutReferences.slice(item.start, item.end)).toBe(item.statement)
      const graph = session.resolveCSSImportGraph({ entry: 'entry', files: { entry: source, child: '.example{color:red}' }, edges: [{ from: 'entry', specifier: './child.css', resolved: 'child' }] })
      expect(graph.dependencies).toEqual(['entry', 'child'])
      expect(graph.source).toContain('@media print')
      expect(graph.source).toContain('@layer theme')
    } finally { session.dispose() }
  })
}

test('BH-0004 actual referenced CSS with encoded filename and query keeps context-only definitions', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-0116-reference-'))
  try {
    const entry = join(root, 'entry #.css')
    const reference = join(root, 'tokens #.css')
    writeFileSync(entry, '@reference "./tokens%20%23.css?version=1#context";.example{@compose paint;}')
    writeFileSync(reference, '@utilities{paint{color:red}}.reference-only{color:blue}')
    const result = compileManifestFileSync(entry, { baseManifest: { version: 1, languageVersion: 3, utilities: [] }, preserveNativeCSS: true })
    expect(result.dependencies).toContain(reference)
    expect(result.css).toContain('color:red')
    expect(result.css).not.toContain('reference-only')
    expect(JSON.stringify(result.manifest)).not.toContain('paint')
  } finally { rmSync(root, { recursive: true, force: true }) }
})


test('BH-0004 unresolved bare package CSS remains available to the host resolver', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-0116-package-'))
  try {
    const entry = join(root, 'entry.css')
    writeFileSync(entry, '@import "another-package/theme.css";')
    const result = compileManifestFileSync(entry, { baseManifest: { version: 1, languageVersion: 3, utilities: [] }, preserveNativeCSS: true })
    expect(result.dependencies).toEqual([entry])
    expect(result.css).toContain('another-package/theme.css')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
