import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveStylesheetSync } from '../../../../packages/compiler/dist/node.js'

const root = mkdtempSync(join(tmpdir(), 'host-import-classification-'))
const results = []
try {
  const entry = join(root, 'entry.css'), child = join(root, 'child.css')
  writeFileSync(child, '@import "https://external.invalid/font.css";@master entry;.card{color:red}')
  for (const qualifier of ['', ' layer', ' layer(cards)', ' supports(display:grid)', ' print', ' layer(cards) supports(display:grid) print']) {
    for (const rootEntry of [false, true]) for (const preserveImports of [false, true]) {
      const source = `@import "./child.css"${qualifier};${rootEntry ? '@master entry;' : ''}.root{display:block}`
      try {
        const result = resolveStylesheetSync(entry, source, { projectDir: root, preserveImports })
        results.push({ qualifier, rootEntry, preserveImports, kind: result?.kind, pass: result?.kind === 'entry', dependencies: result?.dependencies })
      } catch (error) { results.push({ qualifier, rootEntry, preserveImports, pass: false, error: String(error) }) }
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ results, byMode: Object.fromEntries([false, true].map(mode => [String(mode), {
  pass: results.filter(result => result.preserveImports === mode && result.pass).length,
  fail: results.filter(result => result.preserveImports === mode && !result.pass).length
}])), scope: 'Public classification of imported entries with unresolved external CSS; no network access, actual Next/Webpack host execution remains to verify' }, null, 2))
process.exitCode = results.some(result => !result.pass) ? 1 : 0
