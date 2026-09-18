import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const packageDir = process.env.BH_NEXT_PACKAGE_DIR
assert(packageDir, 'An owned candidate package is required')
const { createNextModuleGraph } = await import(pathToFileURL(join(packageDir, 'dist/prepare-module-graph.js')))
const root = mkdtempSync(join(tmpdir(), 'next-module-graph-controls-'))
const checks = []
async function check(name, run) { try { await run(); checks.push({ name, pass: true }) } catch (error) { checks.push({ name, pass: false, error: String(error) }) } }
function graph(webpack = true, entry = join(root, 'entry.module.css'), extra = {}) {
  const dependencies = []
  const context = { resourcePath: entry, rootContext: root, context: dirname(entry), _compiler: { resolverFactory: { get: type => {
    assert.equal(type, 'loader')
    return { resolve: (_context, directory, request, _options, callback) => callback(null, resolve(directory, request)) }
  } } }, getResolve: options => {
    assert.deepEqual(options.conditionNames, webpack ? ['style'] : undefined)
    return async (directory, request) => resolve(directory, request)
  }, ...extra }
  return { ...createNextModuleGraph(context, root, { preprocessed: webpack }, file => dependencies.push(file)), dependencies, entry }
}
try {
  await check('ordinary global CSS preserves input bytes before Rust compilation', async () => {
    const source = '@master entry;\n/* authored layout */ .global { color: red }'
    const result = await graph(true, join(root, 'globals.css')).prepareEntry(source)
    assert.equal(result.source, source);assert.equal(result.scoped, false)
  })
  for (const webpack of [true, false]) for (const filename of ['child.module.css', 'child.css']) await check((webpack ? 'Webpack' : 'Turbopack') + ' child policy: ' + filename, async () => {
    const file = join(root, filename);writeFileSync(file, '.child{color:red}')
    const session = graph(webpack);await session.prepareEntry('@master entry;.root{color:blue}')
    const child = await session.resolveImport('./' + filename, session.entry)
    const scoped = webpack || filename.includes('.module.')
    assert.equal(child.scoped, scoped)
    assert.equal(child.source.includes('.child{'), !scoped)
    assert.equal(session.dependencyFile(child.id), file)
    assert(session.dependencies.includes(file));assert(session.dependencies.every(file => !file.includes('\0')))
  })
  await check('ICSS values and exports resolve while dependency CSS follows authored imports', async () => {
    writeFileSync(join(root, 'tokens.module.css'), ':export{tone:#123456}')
    writeFileSync(join(root, 'before.module.css'), '.before{color:red}')
    const session = graph()
    const result = await session.prepareEntry('@import "./before.module.css";:import("./tokens.module.css"){tone:tone;}@master entry;.root{color:tone}:export{chosen:tone}')
    assert(result.source.includes('color:#123456'))
    assert.equal(result.exports.chosen, '#123456')
    assert(result.source.indexOf('./before.module.css') < result.source.indexOf('./tokens.module.css'))
    assert(!result.source.includes(':import('));assert(session.dependencies.includes(join(root, 'tokens.module.css')))
  })
  for (const [specifier, filename] of [['encoded%20name.module.css', 'encoded name.module.css'], ['literal%2520name.module.css', 'literal%20name.module.css']]) await check('Webpack ICSS URL normalization and retained edge: ' + specifier, async () => {
    const file = join(root, filename);writeFileSync(file, '.child{color:red}')
    const session = graph()
    const result = await session.prepareEntry('@master entry;.root{composes:child from "./' + specifier + '";color:blue}')
    assert(result.exports.root.split(/\s+/).length === 2)
    const child = await session.resolveImport('./' + specifier, session.entry)
    assert.equal(child.baseFile, file)
    assert(session.dependencies.includes(file))
    assert(session.dependencies.every(file => !file.includes('\0')))
  })
  for (const [specifier, filename] of [[String.raw`oth\65 r.module.css`, 'other.module.css'], ['literal%20name.module.css', 'literal%20name.module.css'], [String.raw`literal\25 20name.module.css`, 'literal%20name.module.css']]) await check('Turbopack CSS escape decoding preserves literal percent: ' + specifier, async () => {
    const file = join(root, filename);writeFileSync(file, '.child{color:red}')
    const session = graph(false)
    const result = await session.prepareEntry('@master entry;.root{composes:child from "./' + specifier + '";color:blue}')
    assert(result.exports.root.split(/\s+/).length === 2)
    const child = await session.resolveImport('./' + specifier, session.entry)
    assert.equal(child.baseFile, file);assert(session.dependencies.includes(file))
  })
  await check('Webpack inline chains preserve options/order and resolve only the CSS resource', async () => {
    const file = join(root, 'inline.module.css');writeFileSync(file, '.child{border-top:1px solid red}')
    const requests = [], calls = []
    const specifier = '/audit/transform.cjs?width=7!/audit/transform.cjs?width=3!./inline.module.css'
    const session = graph(true, join(root, 'entry.module.css'), {
      getResolve: () => async (directory, request) => { requests.push(request);return resolve(directory, request) },
      importModule: async request => { calls.push(request);return { source: '.child{border-top:7px solid red}' } }
    })
    const entry = await session.prepareEntry('@master entry;.root{composes:child from "' + specifier + '";color:blue}')
    const child = await session.resolveImport(specifier, session.entry)
    assert(entry.exports.root.split(/\s+/).length === 2)
    assert(child.source.includes('border-top:7px'));assert.equal(child.baseFile, file)
    assert(requests.every(request => !request.includes('!')))
    assert.equal(calls.length, 1);assert(calls[0].endsWith('/audit/transform.cjs?width=7!/audit/transform.cjs?width=3!' + file))
    assert(session.dependencies.includes(file));assert(session.dependencies.every(path => !path.includes('!')))
  })
  await check('distinct inline requests retain distinct prepared sources and cache only within a session', async () => {
    const file = join(root, 'inline-cache.module.css');writeFileSync(file, '.child{color:black}')
    let calls = 0
    const extra = { importModule: async request => { calls++;return { source: '.child{color:' + (request.includes('?red!') ? 'red' : 'blue') + '}' } } }
    const session = graph(true, join(root, 'entry.module.css'), extra)
    await session.prepareEntry('@master entry;.root{color:black}')
    const first = await session.resolveImport('/audit/loader.cjs?red!./inline-cache.module.css', session.entry)
    const second = await session.resolveImport('/audit/loader.cjs?blue!./inline-cache.module.css', session.entry)
    assert.notEqual(first.id, second.id);assert(first.source.includes('red'));assert(second.source.includes('blue'))
    assert.equal(await session.resolveImport('/audit/loader.cjs?red!./inline-cache.module.css', session.entry), first);assert.equal(calls, 2)
    const fresh = graph(true, join(root, 'entry.module.css'), extra);await fresh.prepareEntry('@master entry;.root{color:black}')
    await fresh.resolveImport('/audit/loader.cjs?red!./inline-cache.module.css', fresh.entry);assert.equal(calls, 3)
  })
  await check('inline loader errors propagate without reading an untransformed fallback', async () => {
    const file = join(root, 'inline-error.module.css');writeFileSync(file, '.child{color:red}')
    const failure = new Error('owned inline transform failed')
    const session = graph(true, join(root, 'entry.module.css'), { importModule: async () => { throw failure } })
    await session.prepareEntry('@master entry;.root{color:black}')
    await assert.rejects(session.resolveImport('/audit/loader.cjs!./inline-error.module.css', session.entry), error => error === failure)
  })
  await check('inline loader source maps retain the authored source content', async () => {
    const file = join(root, 'inline-map.module.css'), source = '.child{color:red}'
    writeFileSync(file, source)
    const map = JSON.stringify({ version: 3, sources: [pathToFileURL(file).href], names: [], mappings: 'AAAA', sourcesContent: [source] })
    const session = graph(true, join(root, 'entry.module.css'), { importModule: async () => ({ source: '.child{color:blue}', sourceMap: map }) })
    await session.prepareEntry('@master entry;.root{color:black}')
    const prepared = await session.resolveImport('/audit/loader.cjs!./inline-map.module.css', session.entry)
    const actual = JSON.parse(prepared.sourceMap)
    assert(actual.sources.includes(pathToFileURL(file).href));assert(actual.sourcesContent.includes(source))
    assert(prepared.source.includes('blue'))
  })
  await check('one publication reuses captured child sources; a new session observes edits', async () => {
    const file = join(root, 'snapshot.module.css');writeFileSync(file, '.snapshot{color:red}')
    const session = graph();await session.prepareEntry('@master entry;.root{color:blue}')
    const first = await session.resolveImport('./snapshot.module.css', session.entry)
    writeFileSync(file, '.snapshot{color:blue}')
    const second = await session.resolveImport('./snapshot.module.css', session.entry)
    assert.equal(second, first);assert(second.source.includes('red'))
    const fresh = graph();await fresh.prepareEntry('@master entry;.root{color:blue}')
    assert((await fresh.resolveImport('./snapshot.module.css', fresh.entry)).source.includes('blue'))
  })
  await check('ordinary CSS import cycles reuse the prepared entry instead of duplicating it', async () => {
    const session = graph();writeFileSync(session.entry, '@import "./cycle.module.css";@master entry;.root{color:red}')
    writeFileSync(join(root, 'cycle.module.css'), '@import "./entry.module.css";.child{color:blue}')
    const entry = await session.prepareEntry(readFileSync(session.entry, 'utf8'))
    const child = await session.resolveImport('./cycle.module.css', session.entry)
    assert.equal(await session.resolveImport('./entry.module.css', child.id), entry)
  })
  await check('configured native naming receives the imported file and its own directory', async () => {
    mkdirSync(join(root, 'nested'));writeFileSync(join(root, 'nested/name.module.css'), '.child{color:red}')
    const session = graph(true, join(root, 'entry.module.css'), { loaders: [{ path: join(packageDir, 'dist/webpack-css-loader.js'), options: { options: { modules: { getLocalIdent: (context, _template, name) => (context.context.endsWith('/nested') ? 'nested_' : 'root_') + name } } } }] })
    await session.prepareEntry('@master entry;.root{color:blue}')
    assert((await session.resolveImport('./nested/name.module.css', session.entry)).source.includes('.nested_child'))
  })
} finally { rmSync(root, { recursive: true, force: true }) }
const result = { scope: 'Owned candidate preparation controls; native resolver is a deterministic fake here, actual Next/browsers tested separately. Bounded Webpack URL and Turbo CSS-escape controls; no full ICSS-cycle, missing-export, alias/package, Sass/options or host parity claim.', checks, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length }
if (process.env.BH_NEXT_GRAPH_EVIDENCE) writeFileSync(process.env.BH_NEXT_GRAPH_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2));process.exitCode = result.failed ? 1 : 0
