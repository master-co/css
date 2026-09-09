import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-node-'))), rows = []
const cases = [
  { id: 'library-es', formats: ['es'] }, { id: 'library-cjs', formats: ['cjs'] },
  { id: 'library-multiple', formats: ['es', 'cjs'] },
  { id: 'ssr-es', ssr: true, format: 'es' }, { id: 'ssr-cjs', ssr: true, format: 'cjs' },
  { id: 'ssr-es-assets', ssr: true, format: 'es', emit: true }, { id: 'ssr-cjs-assets', ssr: true, format: 'cjs', emit: true }
].filter(test => !process.env.BH_CASE || process.env.BH_CASE.split(',').includes(test.id))
try {
  mkdirSync(join(root, 'src'))
  writeFileSync(join(root, 'src/entry.js'), 'import css from "./style.css?inline";export {css}')
  writeFileSync(join(root, 'src/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const test of cases) {
    for (const managed of [false, true]) {
      const outDir = join(root, test.id + '-' + managed)
      writeFileSync(join(root, 'src/style.css'), `${managed ? '@master entry;@preserve native;' : ''}.example{color:blue;background:url(./pixel.svg?q=1#part)}`)
      const warnings = []
      try {
        const built = await build({ root, base: '/deployed/', configFile: false, logLevel: 'silent', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], build: { outDir, minify: false, assetsInlineLimit: 0, ssr: test.ssr ? join(root, 'src/entry.js') : false, ssrEmitAssets: Boolean(test.emit), lib: test.formats ? { entry: join(root, 'src/entry.js'), formats: test.formats, fileName: format => `scripts/${format}/entry.${format === 'es' ? 'mjs' : 'cjs'}` } : undefined, rolldownOptions: { onwarn(warning) { warnings.push(warning.message) }, output: { ...(test.ssr ? { format: test.format, entryFileNames: `scripts/${test.format}/entry.${test.format === 'es' ? 'mjs' : 'cjs'}` } : {}), assetFileNames: 'styles/deep/[name]-[hash][extname]' } } } })
        const outputs = Array.isArray(built) ? built : [built]
        assert.equal(outputs.length, test.formats?.length ?? 1)
        const names = outputs.map(output => output.output.find(item => item.type === "chunk" && item.isEntry).fileName)
        assert.equal(new Set(names).size, outputs.length)
        for (const output of outputs) {
          const entry = output.output.find(item => item.type === 'chunk' && item.isEntry)
          assert.match(entry.fileName, /\.(mjs|cjs)$/)
          const loaded = entry.fileName.endsWith('.cjs') ? require(join(outDir, entry.fileName)) : await import(pathToFileURL(join(outDir, entry.fileName)).href)
          const css = loaded.css
          const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1])
          const missingFileURLs = urls.filter(url => url.startsWith('file:') && !existsSync(fileURLToPath(url)))
          const pass = typeof css === 'string' && /color:\s*(blue|#00f)/.test(css) && !css.includes('master-css-slot') && !css.includes('master-css-inline.invalid') && !missingFileURLs.length && (!test.ssr || !css.includes('file:'))
          const row = { id: test.id, managed, format: entry.fileName, phase: 'load', css, urls, missingFileURLs, assets: output.output.filter(item => item.type === 'asset').map(item => item.fileName), warnings, result: pass ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
        }
      } catch (error) { const row = { id: test.id, managed, phase: 'build-or-load', message: error.message, result: 'FAIL' }; rows.push(row); console.log(JSON.stringify(row)) }
    }
  }
  const summary = { builds: cases.length * 2, comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }
