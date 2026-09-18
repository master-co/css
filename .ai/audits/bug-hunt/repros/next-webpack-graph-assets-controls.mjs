import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SourceMap } from 'node:module'

const packageDir = process.env.BH_NEXT_PACKAGE_DIR
assert(packageDir, 'BH_NEXT_PACKAGE_DIR must identify an owned candidate')
const { default: delegate, pitch } = await import(pathToFileURL(join(packageDir, 'src/webpack-css-loader.ts')))
const root = mkdtempSync(join(tmpdir(), 'next-webpack-assets-controls-'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const checks = []
async function check(name, run) {
  try { await run(); checks.push({ name, pass: true }) }
  catch (error) { checks.push({ name, pass: false, error: String(error) }) }
}
try {
  const directory = join(root, '.master/stylesheets', 'a'.repeat(64))
  mkdirSync(directory, { recursive: true })
  const entry = join(directory, 'b'.repeat(64) + '-entry.css')
  const authored = '.probe { color: red; }'
  const map = { version: 3, sources: ['file:///authored/input.css'], sourcesContent: [authored], names: [], mappings: 'AAAA' }
  const css = '.probe{color:red}'
  const mapped = Buffer.from(css + '\n/*# sourceMappingURL=data:application/json;base64,' + Buffer.from(JSON.stringify(map)).toString('base64') + ' */')
  const resource = Buffer.from([0, 255, 129, 13, 10])
  const resourceFile = join(directory, 'pixel.bin')
  writeFileSync(entry, mapped); writeFileSync(resourceFile, resource)
  const metadata = { version: 2, files: [{ name: basename(entry), sha256: hash(mapped), cssBytes: Buffer.byteLength(css), sourceMap: JSON.stringify(map) }, { name: 'pixel.bin', sha256: hash(resource) }] }
  const metadataFile = entry + '.assets.json'
  const reset = () => writeFileSync(metadataFile, JSON.stringify(metadata))
  reset()
  function context(publicPath = '/base/_next/', sourceMap = false) {
    const assets = new Map(), dependencies = [], maps = new Map()
    return { resourcePath: entry, rootContext: root, sourceMap,
      getOptions: () => ({ options: { sourceMap } }),
      _compilation: { outputOptions: { publicPath }, getPath: value => value },
      addDependency: file => dependencies.push(file),
      emitFile: (file, bytes, map) => { assets.set(file, bytes); maps.set(file, map) }, assets, maps, dependencies }
  }
  await check('ordinary CSS is outside the owned entry pitch', () => assert.equal(pitch.call({ resourcePath: join(root, 'app.css'), rootContext: root }), undefined))
  for (const prefix of ['/base/_next/', 'https://cdn.example.invalid/_next/']) await check('complete assets and configured publicPath: ' + prefix, () => {
    const ctx = context(prefix), output = pitch.call(ctx)
    const module = { id: 7, exports: undefined }
    Function('module', output)(module)
    assert(module.exports[0][1].includes(prefix + 'static/css/master/'))
    assert.equal(ctx.assets.size, 2)
    assert.deepEqual([...ctx.assets.values()], [Buffer.from(css), resource])
    for (const file of [metadataFile, entry, resourceFile]) assert(ctx.dependencies.includes(file))
  })
  await check('enabled maps supply authored sources through the host map argument', () => {
    const ctx = context('/_next/', true); pitch.call(ctx)
    assert.deepEqual([...ctx.assets.values()][0], Buffer.from(css))
    assert.deepEqual([...ctx.maps.values()][0], map)
    assert.equal(new SourceMap(map).findEntry(0, 0).originalSource, 'file:///authored/input.css')
  })
  await check('changed immutable resource rejects publication', () => {
    writeFileSync(resourceFile, 'changed')
    try { assert.throws(() => pitch.call(context()), /Changed immutable/) }
    finally { writeFileSync(resourceFile, resource) }
  })
  await check('missing resource is observed as a dependency before rejection', () => {
    rmSync(resourceFile); const ctx = context()
    try { assert.throws(() => pitch.call(ctx), /ENOENT/); assert(ctx.dependencies.includes(resourceFile)) }
    finally { writeFileSync(resourceFile, resource) }
  })
  await check('missing metadata fails rather than returning incomplete CSS', () => {
    rmSync(metadataFile)
    try { assert.throws(() => pitch.call(context()), /ENOENT/) } finally { reset() }
  })
  await check('invalid metadata version rejects', () => {
    writeFileSync(metadataFile, JSON.stringify({ ...metadata, version: 3 }))
    try { assert.throws(() => pitch.call(context()), /Invalid Next CSS publication/) } finally { reset() }
  })
  await check('invalid map byte boundary rejects', () => {
    writeFileSync(metadataFile, JSON.stringify({ ...metadata, files: [{ ...metadata.files[0], cssBytes: mapped.length + 1 }] }))
    try { assert.throws(() => pitch.call(context()), /Invalid Next CSS map boundary/) } finally { reset() }
  })
  for (const raw of [false, true]) await check('ordinary loader preserves options, map and ' + (raw ? 'raw bytes' : 'text conversion'), () => {
    const fake = join(root, raw ? 'raw.cjs' : 'text.cjs')
    writeFileSync(fake, 'module.exports=function(source,map){return {source,map,options:this.getOptions(),marker:this.marker}};module.exports.raw=' + raw)
    const options = { modules: { namedExport: true }, importLoaders: 2 }
    const result = delegate.call({ getOptions: () => ({ loader: fake, options }), marker: 91 }, Buffer.from('a{}'), map)
    assert.deepEqual(result.source, raw ? Buffer.from('a{}') : 'a{}')
    assert.equal(result.map, map); assert.equal(result.options, options); assert.equal(result.marker, 91)
  })
  if (process.env.BH_NEXT_HOST_EVIDENCE) {
    const evidence = JSON.parse(readFileSync(process.env.BH_NEXT_HOST_EVIDENCE, 'utf8'))
    for (const [selector, expected] of [['.direct', '/app/globals.css'], ['.nested', '/app/nested/child.css']]) await check('actual exported map resolves authored ' + selector, () => {
      const output = evidence.stylesheets.find(item => item.file.includes('/master/') && item.file.endsWith('.css') && item.text.includes(selector))
      assert(output, 'emitted CSS must exist')
      const href = output.text.match(/sourceMappingURL=([^\s*]+)/)?.[1]
      assert(href, 'emitted CSS must reference a map')
      const mapPath = new URL(href, 'https://audit.invalid/' + output.file).pathname.slice(1)
      const finalMap = JSON.parse(evidence.stylesheets.find(item => item.file === mapPath).text)
      const before = output.text.slice(0, output.text.indexOf(selector)).split('\n')
      const position = new SourceMap(finalMap).findEntry(before.length - 1, before.at(-1).length)
      assert(position.originalSource?.endsWith(expected), JSON.stringify({ expected, position }))
      const source = finalMap.sourcesContent[finalMap.sources.indexOf(position.originalSource)]
      assert(source.includes(selector), 'map must include the authored source content')
      const original = source.slice(0, source.indexOf(selector)).split('\n')
      assert.equal(position.originalLine, original.length - 1)
      assert.equal(position.originalColumn, original.at(-1).length)
    })
  }
} finally { rmSync(root, { recursive: true, force: true }) }
const result = { scope: 'Owned candidate dispatcher controls; actual exported map controls when evidence is supplied. No full host delivery claim.', checks, passed: checks.filter(item => item.pass).length, failed: checks.filter(item => !item.pass).length }
if (process.env.BH_NEXT_CONTROL_EVIDENCE) writeFileSync(process.env.BH_NEXT_CONTROL_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
process.exitCode = result.failed ? 1 : 0
