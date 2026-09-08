import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compileManifestFileSync } from '../../../../packages/compiler/src/node.ts'
import { resolveCSSImportGraph } from '../../../../packages/compiler/src/node-compiler.ts'
const root = mkdtempSync(join(tmpdir(), 'master-css-bh0004-'))
try {
  const entry = join(root, 'entry.css')
  writeFileSync(join(root, 'child.css'), '.example { color: red; }')
  for (const qualifier of ['', ' print', ' supports(display: grid)', ' layer(test)', ' layer(test) screen and (min-width: 1000px)']) {
    writeFileSync(entry, `@import "./child.css"${qualifier};`)
    const graph = resolveCSSImportGraph(entry)
    const result = compileManifestFileSync(entry, { classes: ['example'], preserveNativeCSS: true })
    console.log(JSON.stringify({ qualifier, graph: graph.source, css: result.css, nativeCSS: result.nativeCSS }))
  }
} finally { rmSync(root, { recursive: true, force: true }) }
