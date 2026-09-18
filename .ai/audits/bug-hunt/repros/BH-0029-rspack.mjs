import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import assert from 'node:assert/strict'
const cwd = resolve('examples/integration-lab'); const require = createRequire(join(cwd, 'package.json'))
const { rspack } = require('@rspack/core'); const { default: MasterCSSPlugin } = await import(require.resolve('@master/css-webpack'))
const root = mkdtempSync(join(cwd, 'tmp/bh-0029-'))
const plugin = new MasterCSSPlugin({ mode: 'static', ...(process.env.BH_SAFELIST ? { safelist: ['block'] } : {}) }, root); const records = []
let compiler
try {
 writeFileSync(join(root, 'package.json'), '{"type":"module"}')
 writeFileSync(join(root, 'entry.js'), 'import "./app.css"; document.body.className = "block"')
 // `@preserve native` keeps the authored rule; without it Master drops native CSS by design (identical on Webpack).
 writeFileSync(join(root, 'app.css'), '@import "@master/css";@preserve native; .control {color:red}')
 compiler = rspack({ context: root, mode: 'production', entry: './entry.js', output: { path: join(root, 'dist') }, module: { rules: [{test: /\.css$/, use: [rspack.CssExtractRspackPlugin.loader, 'css-loader']}] }, plugins: [new rspack.CssExtractRspackPlugin(), plugin, { apply(c) { c.hooks.thisCompilation.tap('audit', compilation => { compilation.hooks.succeedModule.tap('audit', m => { if (m.resource?.startsWith(root)) records.push({ resource: m.resource, resolvePath: m.resourceResolveData?.path, privateSource: String(m._source?.source?.()), originalSource: String(m.originalSource?.()?.source?.()) }) }); records.push({ hook: compilation.hooks.processAssets.constructor.name }); compilation.hooks.processAssets.tap({ name: 'audit', stage: -1 }, assets => records.push({ stage: -1, css: Object.entries(assets).filter(([p]) => p.endsWith('.css')).map(([p,s])=>[p,String(s.source())]), classes: [...plugin.validClasses] })); compilation.hooks.processAssets.tap({ name: 'audit', stage: 10000 }, assets => records.push({ stage: 10000, css: Object.entries(assets).filter(([p]) => p.endsWith('.css')).map(([p,s])=>[p,String(s.source())]) })) }) } }] })
 const stats = await new Promise((done, reject) => compiler.run((error, stats) => error ? reject(error) : done(stats)))
 assert.equal(stats.hasErrors(), false, stats.toString({all:false,errors:true}))
 // Static delivery publishes a graph: the entry stylesheet carries `@import`
 // hrefs to the emitted parts, the same shape the Webpack delivery tests assert.
 const flatten = (file, seen = new Set()) => { if (seen.has(file) || !existsSync(file)) return '';seen.add(file);const source = readFileSync(file, 'utf8');return [source, ...[...source.matchAll(/@import\s+["']([^"']+)["']/g)].map(([, href]) => flatten(join(dirname(file), href), seen))].join('\n') }
 const entry = join(root, 'dist/main.css'), css = readFileSync(entry, 'utf8'), delivered = flatten(entry)
 console.log(JSON.stringify({records, emitted:css, deliveredBytes:delivered.length},null,2))
 assert.ok(delivered.includes('.block{display:block}'), 'BH-0029 generated CSS must survive Rspack static delivery')
 assert.ok(delivered.includes('.control'), 'Authored CSS must survive Rspack static delivery')
} finally { if (compiler) await new Promise(done=>compiler.close(done)); rmSync(root,{recursive:true,force:true}) }
