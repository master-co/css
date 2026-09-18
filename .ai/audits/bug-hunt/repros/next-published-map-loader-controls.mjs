import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
const packageDir = process.env.BH_NEXT_PACKAGE_DIR
assert(packageDir, 'An owned candidate is required')
const { default: loader, raw, NEXT_STYLESHEET_ASSET_PATTERN: pattern } = await import(pathToFileURL(join(packageDir, 'dist/stylesheet-map-loader.js')))
const root = mkdtempSync(join(tmpdir(), 'next-published-map-'))
const directory = join(root, '.master/stylesheets', 'a'.repeat(64));mkdirSync(directory, { recursive: true })
const revision = 'b'.repeat(64), entry = join(directory, revision + '-entry.css'), child = join(directory, revision + '-' + 'c'.repeat(64) + '.css')
const authored = '.probe { content: "葉" }'
const map = { version: 3, sources: ['file:///authored/probe.css'], sourcesContent: [authored], names: [], mappings: 'AAAA' }
const css = Buffer.from('.probe{content:"葉"}'), source = Buffer.concat([css, Buffer.from('\n/*# sourceMappingURL=data:application/json;base64,' + Buffer.from(JSON.stringify(map)).toString('base64') + ' */')])
const hash = value => createHash('sha256').update(value).digest('hex')
const metadata = { version: 2, files: [entry, child].map(file => ({ name: basename(file), sha256: hash(source), cssBytes: css.length, sourceMap: JSON.stringify(map) })) }
const metadataPath = entry + '.assets.json'
const reset = () => writeFileSync(metadataPath, JSON.stringify(metadata));reset()
const checks = []
function run(file = entry, input = source) {
  const dependencies = [];let output
  loader.call({ resourcePath: file, addDependency: path => dependencies.push(path), callback: (error, css, map) => { assert(!output, 'one callback');output = { error, css, map } } }, input)
  assert(output, 'loader callback required');return { ...output, dependencies }
}
function check(name, fn) { try { fn();checks.push({ name, pass: true }) } catch (error) { checks.push({ name, pass: false, error: String(error) }) } finally { reset() } }
try {
  check('raw byte transport and exact generated CSS guard', () => { assert.equal(raw, true);assert(pattern.test(entry));assert(pattern.test(child));assert(!pattern.test(join(root, 'app/globals.css')));assert(!pattern.test(entry + '.assets.json')) })
  for (const file of [entry, child]) check('authored map and UTF-8 byte boundary: ' + basename(file), () => { const result = run(file);assert.equal(result.error, null);assert.deepEqual(result.css, css);assert.deepEqual(result.map, map);assert.deepEqual(result.dependencies, [metadataPath]) })
  check('ordinary input is rejected without processing CSS', () => assert.match(run(join(root, 'ordinary.css')).error.message, /Invalid Next CSS map input/))
  check('metadata is a dependency even when missing', () => { rmSync(metadataPath);const result = run();assert.match(result.error.message, /ENOENT/);assert.deepEqual(result.dependencies, [metadataPath]) })
  check('changed immutable input bytes reject', () => assert.match(run(entry, Buffer.from('changed')).error.message, /immutable Next CSS asset/))
  check('absent published CSS rejects', () => { writeFileSync(metadataPath, JSON.stringify({ ...metadata, files: [] }));assert.match(run().error.message, /immutable Next CSS asset/) })
  check('unknown metadata version rejects', () => { writeFileSync(metadataPath, JSON.stringify({ ...metadata, version: 3 }));assert.match(run().error.message, /Invalid Next CSS publication/) })
  for (const value of [-1, source.length + 1, 0.5]) check('invalid byte boundary rejects: ' + value, () => { writeFileSync(metadataPath, JSON.stringify({ ...metadata, files: [{ ...metadata.files[0], cssBytes: value }] }));assert.match(run().error.message, /Invalid Next CSS map boundary/) })
  check('invalid map structure rejects', () => { writeFileSync(metadataPath, JSON.stringify({ ...metadata, files: [{ ...metadata.files[0], sourceMap: '{}' }] }));assert.match(run().error.message, /Invalid Next CSS source map/) })
} finally { rmSync(root, { recursive: true, force: true }) }
const result = { scope: 'Owned publication map loader byte/metadata/host callback controls; actual host map composition verified separately', checks, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length }
if (process.env.BH_NEXT_CONTROL_EVIDENCE) writeFileSync(process.env.BH_NEXT_CONTROL_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2));process.exitCode = result.failed ? 1 : 0
