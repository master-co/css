import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// Compares flattened and graph classification for the same stylesheet shapes; see batch 0269.
import { resolveStylesheetSync } from '../../../../packages/compiler/dist/node.js'

const root = mkdtempSync(join(tmpdir(), 'bh0004-classify-'))
const cases = {
  'plain entry': { entry: '@master entry;\n.a{color:red}', child: null },
  'local import': { entry: '@master entry;@import "./child.css";', child: '.b{color:red}' },
  'qualified import': { entry: '@master entry;@import "./child.css" layer(cards);', child: '.b{color:red}' },
  'qualified parent + external child': { entry: '@master entry;@import "./child.css" layer(cards);', child: '@import "https://cdn.test/x.css";.b{color:red}' },
  'anonymous layer + external child': { entry: '@master entry;@import "./child.css" layer;', child: '@import "https://cdn.test/x.css";.b{color:red}' },
  'local directives only': { entry: '.a{@compose p:2rem;}', child: null },
  'local directives via import': { entry: '@import "./child.css";', child: '.b{@compose p:2rem;}' },
  'plain css': { entry: '.a{color:red}', child: null },
  'master package import': { entry: '@import "@master/css";\n.a{color:red}', child: null },
  'theme only': { entry: '@theme{--color-x:red}', child: null },
  'entry via master import + qualified external child': { entry: '@import "@master/css";@import "./child.css" layer(cards);', child: '@import "https://cdn.test/x.css";.b{color:red}' }
}
try {
  for (const [name, item] of Object.entries(cases)) {
    const entry = join(root, 'entry.css')
    writeFileSync(entry, item.entry)
    if (item.child) writeFileSync(join(root, 'child.css'), item.child)
    const row = { case: name }
    for (const preserveImports of [false, true]) {
      const key = preserveImports ? 'graph' : 'flatten'
      try {
        const resolution = resolveStylesheetSync(entry, item.entry, { projectDir: root, preserveImports })
        row[key] = resolution ? `${resolution.kind} deps=${resolution.dependencies.length}` : 'undefined'
      } catch (error) { row[key] = `THROW ${error.code ?? ''} ${String(error.message).slice(0, 60)}` }
    }
    console.log(JSON.stringify(row))
  }
} finally { rmSync(root, { recursive: true, force: true }) }
