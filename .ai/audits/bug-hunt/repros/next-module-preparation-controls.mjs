import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SourceMap } from 'node:module'
const packageDir = process.env.BH_NEXT_PACKAGE_DIR
assert(packageDir, 'An owned candidate package is required')
const { prepareNextModule } = await import(pathToFileURL(join(packageDir, 'dist/prepare-module.js')))
const root = mkdtempSync(join(tmpdir(), 'next-module-preparation-'))
const context = { resourcePath: join(root, 'card.module.css'), rootContext: root }
const source = '@master entry;\n.direct { color: red; }\n.composed { @compose p:2rem; }'
const checks = []
async function check(name, run) { try { await run(); checks.push({ name, pass: true }) } catch (error) { checks.push({ name, pass: false, error: String(error) }) } }
try {
  for (const webpack of [true, false]) {
    const label = webpack ? 'Webpack' : 'Turbopack'
    await check(label + ' preserves directives and scopes classes through Next', async () => {
      const result = await prepareNextModule(context, source, root, undefined, webpack)
      assert(result.source.includes('@master entry'))
      assert(result.source.includes('@compose p:2rem'))
      assert(!result.source.includes('.direct '))
      assert(result.exportsCSS.includes('direct'))
      assert(result.exportsCSS.includes(webpack ? ':export' : 'from global'))
    })
    await check(label + ' rejects an impure authored selector', async () => {
      await assert.rejects(prepareNextModule(context, '@master entry;body{color:red}', root, undefined, webpack), /not pure/)
    })
    await check(label + ' prepared selector map resolves original file/line/column/content', async () => {
      const result = await prepareNextModule(context, source, root, undefined, webpack)
      const map = JSON.parse(result.sourceMap)
      const offset = result.source.indexOf('.card_direct__')
      assert(offset >= 0)
      const before = result.source.slice(0, offset).split('\n')
      const position = new SourceMap(map).findEntry(before.length - 1, before.at(-1).length)
      assert.equal(position.originalSource, pathToFileURL(context.resourcePath).href)
      assert.equal(position.originalLine, 1); assert.equal(position.originalColumn, 0)
      assert.equal(map.sourcesContent[map.sources.indexOf(position.originalSource)], source)
    })
  }
  await check('delegates configured Webpack getLocalIdent and preserves ICSS values', async () => {
    const configured = { ...context, loaders: [{ path: join(packageDir, 'dist/webpack-css-loader.js'), options: { options: { modules: { getLocalIdent: (_context, _pattern, name) => 'custom_' + name } } } }] }
    const result = await prepareNextModule(configured, source + '\n:export { spacing: 8px; }', root, undefined, true)
    assert(result.source.includes('.custom_direct'))
    assert(result.exportsCSS.includes('direct: custom_direct'))
    assert(result.exportsCSS.includes('spacing: 8px'))
  })
} finally { rmSync(root, { recursive: true, force: true }) }
const result = { scope: 'Owned candidate Module preprocessor; actual host exported maps and graph behavior tested separately', checks, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length }
if (process.env.BH_NEXT_PREPARATION_EVIDENCE) writeFileSync(process.env.BH_NEXT_PREPARATION_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2)); process.exitCode = result.failed ? 1 : 0
