import assert from 'node:assert/strict'
import { createRequire, SourceMap } from 'node:module'
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { once } from 'node:events'
const require = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))
const { createCompiler } = await import(pathToFileURL(require.resolve('@master/css-compiler')))
const { compileRenderedStylesheet } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')))
const nextRequire = createRequire(createRequire(join(process.env.BH_NEXT_PACKAGE_DIR, 'package.json')).resolve('next/package.json'))
const postcss = nextRequire('postcss')
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const work = mkdtempSync(join(tmpdir(), 'next-graph-stage-'))
const fixtures = {
  qualified: { root: '@import "/initial/child.css" layer(shared) supports(display:grid) screen;.direct{padding:2rem}', child: '.shared{border-top:7px solid red}' },
  originalSpecifier: { root: '@import "./child.module.css";.direct{padding:2rem}', child: '.shared{border-top:7px solid red}' },
  managedResource: { root: '@import "/initial/child.css";.direct{background:url("./pixel.svg?rev=1#part");padding:2rem}', child: '.shared{border-top:7px solid red}' },
  newHostResource: { root: '@import "/initial/child.css";.direct{padding:2rem}', child: '.shared{border-top:7px solid red}', injectResource: true },
  sharedBasename: { root: '@import "/initial/child.css";.direct{background:url("./pixel.svg?rev=1#part");padding:2rem}', child: '.shared{border-top:7px solid red;background:url("./pixel.svg?rev=1#part")}' }
}
const rows = []
const compilers = { native: await createCompiler({ binding: 'native' }), wasm: await createCompiler({ binding: 'wasm' }) }
let server
try {
  for (const [name, fixture] of Object.entries(fixtures)) {
    const folder = join(work, name), rootFile = join(folder, 'root.module.css'), childFile = join(folder, 'nested/child.module.css')
    mkdirSync(join(folder, 'nested'), { recursive: true })
    const authoredRoot = '/* 🧭 original root */\n' + fixture.root, authoredChild = '/* 🧭 original child */\n' + fixture.child
    writeFileSync(rootFile, authoredRoot);writeFileSync(childFile, authoredChild)
    for (const file of [join(folder, 'pixel.svg'), join(folder, 'new.svg'), join(folder, 'nested/pixel.svg')]) writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="red"/></svg>')
    const plugin = { postcssPlugin: 'audit-bundle-host-stage', Declaration(decl) { if (decl.prop === 'padding' && decl.value === '2rem') decl.value = '3rem' }, OnceExit(root) { if (fixture.injectResource && root.source.input.file === rootFile) root.append({ selector: '.added', nodes: [{ prop: 'background', value: 'url("./new.svg")' }] }) } }
    const processed = await postcss([plugin]).process(authoredRoot, { from: rootFile, to: rootFile, map: { inline: false, annotation: false, sourcesContent: true } })
    const processedChild = await postcss([plugin]).process(authoredChild, { from: childFile, to: childFile, map: { inline: false, annotation: false, sourcesContent: true } })
    const outputs = {}
    const graphOutputs = {}
    for (const [binding, compiler] of Object.entries(compilers)) {
      const slotCSSRule = '#audit-slot{--slot:0}'
      const request = { source: slotCSSRule, from: 'bundle', slotCSSRule, managed: { entry: 'root', stylesheets: [
        { id: 'root', href: '/initial/root.css', css: processed.css, sourceMap: processed.map.toString() },
        { id: 'child', href: '/initial/child.css', css: fixture.child }
      ] } }
      const bundle = compiler.prepareStylesheetBundle(request)
      const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, index) => [node.id, '/published/' + index + '.css']))
      const assets = compiler.renderStylesheetBundle({ bundle: JSON.parse(JSON.stringify(bundle)), urls, resourceURLs: { './pixel.svg?rev=1#part': '/published/pixel.svg?rev=1#part', './new.svg': '/published/new.svg' } })
      outputs[binding] = { bundle, urls, assets, outputKeys: assets.map(asset => Object.keys(asset)) }
      // Explicit edges stand in for host resolution in this bounded control.
      // Rust owns CSS parsing/lowering, qualifiers, URL rewriting and mappings.
      const specifier = name === 'originalSpecifier' ? './child.module.css' : '/initial/child.css'
      graphOutputs[binding] = compiler.compileStylesheets({
        graph: { entry: 'root', files: { root: processed.css, child: fixture.child }, edges: [{ from: 'root', specifier, resolved: 'child' }] },
        urls: { root: '/graph/' + name + '/root.css', child: '/graph/' + name + '/child.css' },
        resourceURLs: { root: { './pixel.svg?rev=1#part': '/graph/' + name + '/root-pixel.svg?rev=1#part', './new.svg': '/graph/' + name + '/new.svg' }, child: { './pixel.svg?rev=1#part': '/graph/' + name + '/child-pixel.svg?rev=1#part' } },
        baseManifest: { version: 1, utilities: [] }, options: { preserveNativeCSS: true }
      })
    }
    assert.deepEqual(outputs.native, outputs.wasm, 'native/Wasm bundle transport parity')
    assert.deepEqual(graphOutputs.native, graphOutputs.wasm, 'native/Wasm recompiled graph parity')
    const output = outputs.native.assets.find(asset => asset.id === 'root')
    assert(output.css.includes('padding:3rem'))
    const edges = outputs.native.bundle.graph.stylesheets.find(asset => asset.id === 'root').imports
    const graphRoot = graphOutputs.native.stylesheets.find(asset => asset.id === 'root')
    assert(graphRoot.css.includes('/graph/' + name + '/child.css'))
    assert(graphRoot.outputMappings.length)
    if (name === 'managedResource' || name === 'sharedBasename') assert(graphRoot.css.includes('/root-pixel.svg?rev=1#part'))
    if (name === 'newHostResource') assert(graphRoot.css.includes('/new.svg'))
    if (name === 'sharedBasename') assert(graphOutputs.native.stylesheets.find(asset => asset.id === 'child').css.includes('/child-pixel.svg?rev=1#part'))
    const rendered = await compileRenderedStylesheet(rootFile, processed.css, {
      baseManifest: { version: 1, utilities: [] }, projectDir: folder, preserveNativeCSS: true, sourceMap: processed.map.toString(),
      delivery: { entryURL: '/mapped/' + name + '/root.css', stylesheetURL: file => '/mapped/' + name + (file === childFile ? '/child.css' : '/root.css'), resourceURL: file => '/mapped/' + name + (file === join(folder, 'nested/pixel.svg') ? '/child-pixel.svg' : file.endsWith('/new.svg') ? '/new.svg' : '/root-pixel.svg'),
        resolveImport: async specifier => ['/initial/child.css', './child.module.css'].includes(specifier) ? { id: childFile, baseFile: childFile, source: processedChild.css, sourceMap: processedChild.map.toString() } : undefined }
    })
    const mapChecks = []
    for (const [file, authored, selector] of [[rootFile, authoredRoot, '.direct'], [childFile, authoredChild, '.shared']]) {
      const asset = rendered.stylesheets.find(asset => asset.id === file)
      const generated = asset.css.slice(0, asset.css.indexOf(selector)).split('\n')
      const actual = new SourceMap(JSON.parse(asset.sourceMap)).findEntry(generated.length - 1, generated.at(-1).length)
      const original = authored.slice(0, authored.indexOf(selector)).split('\n')
      const originalFile = actual.originalSource?.startsWith('file:') ? fileURLToPath(actual.originalSource) : actual.originalSource
      const pass = originalFile === file && actual.originalLine === original.length - 1 && actual.originalColumn === original.at(-1).length && JSON.parse(asset.sourceMap).sourcesContent.includes(authored)
      mapChecks.push({ file, selector, actual, expected: { line: original.length - 1, column: original.at(-1).length }, fullSourcePreserved: JSON.parse(asset.sourceMap).sourcesContent.includes(authored), pass })
    }
    rows.push({ name, input: fixture, authored: { root: authoredRoot, child: authoredChild }, processed: { css: processed.css, sourceMap: processed.map.toJSON(), childCSS: processedChild.css, childSourceMap: processedChild.map.toJSON() }, outputs, graphOutputs, mappedGraph: { stylesheets: rendered.stylesheets, resources: rendered.resources, mapChecks }, observations: { edges, sourceMetadata: outputs.native.bundle.sources, outputCarriesMap: 'sourceMap' in output || 'outputMappings' in output }, browserObservations: [] })
  }
  const assets = new Map(rows.flatMap(row => [...row.graphOutputs.native.stylesheets, ...row.mappedGraph.stylesheets].map(asset => [asset.href, asset.css])))
  const requests = []
  server = createServer((req, res) => {
    requests.push(req.url)
    const url = new URL(req.url, 'http://localhost')
    if (assets.has(url.pathname)) { res.setHeader('content-type', 'text/css');res.end(assets.get(url.pathname));return }
    if (url.pathname.endsWith('.svg')) { res.setHeader('content-type', 'image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="red"/></svg>');return }
    const row = rows.find(row => url.pathname === '/' + row.name)
    if (row) { res.setHeader('content-type', 'text/html');res.end('<link rel="stylesheet" href="/' + (url.searchParams.get('variant') === 'mapped' ? 'mapped' : 'graph') + '/' + row.name + '/root.css"><div id="probe" class="direct shared">Probe</div><div id="child" class="shared">Child</div><div id="new" class="added">Added</div>');return }
    res.writeHead(404);res.end()
  })
  server.listen(0, '127.0.0.1');await once(server, 'listening')
  for (const name of ['chromium', 'webkit']) {
    const browser = await browsers[name].launch({ headless: true, timeout: 15000 })
    try {
      for (const row of rows) for (const variant of ['graph', 'mapped']) {
        const page = await browser.newPage()
        await page.goto('http://127.0.0.1:' + server.address().port + '/' + row.name + '?variant=' + variant, { waitUntil: 'networkidle' })
        const actual = await page.evaluate(() => Object.fromEntries(['probe', 'child', 'new'].map(id => { const style = getComputedStyle(document.getElementById(id));return [id, { padding: style.paddingTop, border: style.borderTopWidth, background: style.backgroundImage }] })))
        const resourcePass = (!['managedResource', 'sharedBasename'].includes(row.name) || actual.probe.background.includes('/root-pixel.svg?rev=1#part')) && (row.name !== 'sharedBasename' || actual.child.background.includes('/child-pixel.svg?rev=1#part')) && (row.name !== 'newHostResource' || actual.new.background.includes('/new.svg'))
        row.browserObservations.push({ browser: name, variant, ...actual, pass: actual.probe.padding === '48px' && actual.probe.border === '7px' && resourcePass })
        await page.close()
      }
    } finally { await browser.close() }
  }
  for (const row of rows) row.requests = requests.filter(url => url.startsWith('/graph/' + row.name + '/') || url.startsWith('/mapped/' + row.name + '/'))
} finally { if (server) await new Promise(done => server.close(done));for (const compiler of Object.values(compilers)) compiler.dispose();rmSync(work, { recursive: true, force: true }) }
const report = { scope: 'Read-only public native/Wasm bundle-vs-graph probes. Graph edges and per-owner resource URLs are explicit host input. Node rendered graph composes prior PostCSS maps; ten selector anchors/full inputs are checked, not all declaration positions. Extra sourceMap in bundle request tests unsupported passthrough. Global/Module stages, combined plugin context and actual Next integration remain unverified.', rows }
writeFileSync(process.env.BH_NEXT_BUNDLE_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ cases: rows.length, nativeWasmParity: true, observations: rows.map(row => ({ name: row.name, ...row.observations })) }, null, 2))
process.exitCode = rows.some(row => row.browserObservations.some(item => !item.pass) || row.mappedGraph.mapChecks.some(item => !item.pass)) ? 1 : 0
