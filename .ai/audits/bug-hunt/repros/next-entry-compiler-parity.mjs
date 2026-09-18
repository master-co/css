import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR
assert(packageDir)
const require = createRequire(join(packageDir, 'package.json'))
const { compileRenderedStylesheet } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const { defaultBuildManifest } = await import(pathToFileURL(join(packageDir, 'dist/internal/src/project.js')))
const { default: loader } = await import(pathToFileURL(join(packageDir, 'dist/stylesheet-loader.js')))
const root = mkdtempSync(join(tmpdir(), 'next-entry-parity-'))
const observations = []
function graph(file, css, seen = new Set()) {
  if (seen.has(file)) return ''
  seen.add(file)
  let output = css
  for (const [, href] of css.matchAll(/@import\s+["']([^"']+)["']/g)) if (href.startsWith('.')) {
    const child = fileURLToPath(new URL(href, pathToFileURL(file)))
    output += '\n' + graph(child, readFileSync(child, 'utf8'), seen)
  }
  return output
}
try {
  for (const [name, source, wantsBase] of [
    ['lightweight', '@master entry;', false],
    ['lightweight-declarations', '@master entry;@preserve native;.probe{@compose p:2rem;}', false],
    ['explicit-package', '@import "@master/css";', true]
  ]) {
    const file = join(root, name + '.css');writeFileSync(file, source)
    const canonical = await compileRenderedStylesheet(file, source, { projectDir: root, baseManifest: defaultBuildManifest, preserveNativeCSS: true })
    const result = await new Promise((resolve, reject) => loader.call({ resourcePath: file, rootContext: root, getOptions: () => ({}), addDependency() {}, async: () => (error, css) => error ? reject(error) : resolve(css) }, source))
    const delivered = graph(file, result)
    const directHasBase = canonical.css.includes('@layer base'), nextHasBase = delivered.includes('@layer base')
    observations.push({ name, source, wantsBase, directHasBase, nextHasBase, pass: directHasBase === wantsBase && nextHasBase === wantsBase && (name !== 'lightweight-declarations' || delivered.includes('padding:2rem')) })
  }
} finally { rmSync(root, { recursive: true, force: true }) }
const report = { scope: 'Same authored source and default manifest through canonical compiler and actual Next loader; package CSS must require explicit import.', observations }
if (process.env.BH_NEXT_PARITY_EVIDENCE) writeFileSync(process.env.BH_NEXT_PARITY_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
process.exitCode = observations.every(item => item.pass) ? 0 : 1
