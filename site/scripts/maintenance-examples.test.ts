import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { compileManifest, createCompiler } from '@master/css-compiler'
import { createToolingSessionSync } from '@master/css-tooling/node'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { deliveryFences, deliverySource, deliveryFixture, deliverySection } from '../tests/delivery-examples'
import { compileMigrationExample } from '../tests/migration-examples'
import { projectStyleExample } from '../components/demo/project-style-examples'

const document = readFileSync(new URL('../content/guide/global-styles/content.mdx', import.meta.url), 'utf8')
test('the maintenance guide compiles its actual CSS and markup examples', async () => {
  // The universal compiler receives the imported preset as resolved context.
  assert.match(document, /<ProjectStyleExample name="maintenance"/u)
  const { source, html } = projectStyleExample('maintenance')
  const { manifest, css } = await compileManifest(source, { baseManifest: preset as unknown as MasterCSSManifest })
  const tooling = createToolingSessionSync({ manifest })
  try {
    const classes = tooling.extractSource({ files: [{ source: 'maintenance.html', content: html, kind: 'html' }] }).files[0].candidates
    const native = new Set(['card-region', 'card', 'button', 'progress-fill'])
    for (const name of classes.filter(name => !native.has(name))) {
      const result = tooling.validateClassNames([name]).classes[0]
      assert.equal(result.matchStatus, 'matched', name)
      assert.notEqual(result.cssSyntaxStatus, 'invalid', name)
      assert.notEqual(result.cssValueStatus, 'invalid', name)
    }
    assert.match(css, /@container/)
    assert.match(css, /prefers-reduced-motion/)
    assert.match(css, /focus-visible/)
    assert.match(css, /scaleX\(var\(--progress/)
    const after = (await compileManifest(source.replace('--color-brand: light-dark(#4f46e5, #818cf8)', '--color-brand: light-dark(#dc2626, #fca5a5)'), { baseManifest: preset as unknown as MasterCSSManifest })).manifest
    using compiler = await createCompiler()
    const common = { version: 1 as const, sources: [{ path: 'maintenance.html', classes }], stylesheets: [], outputs: [], excluded: [], unresolved: ['Browser states checked separately'] }
    const comparison = compiler.compareProjectSnapshots({ before: { ...common, manifest }, after: { ...common, manifest: after } })
    assert.deepEqual(comparison.classes.map(item => item.className), ['bg-brand', 'fg-brand'])
    assert.equal(comparison.coverage.browser, 'not-checked')
  } finally { tooling.dispose() }
})

test('the rendering guide executes its authored server example and emits initial CSS', () => {
  const fences = deliveryFences(deliverySource('rendering-modes'))
  const html = fences.find(fence => fence.name === 'index.html')!.text
  const server = fences.find(fence => fence.name === 'server.ts')!.text
  const compiled = compileMigrationExample(server)
  assert.deepEqual(compiled.diagnostics, [])
  const require = createRequire(import.meta.url)
  const exampleRequire = (specifier: string) => {
    if (specifier === 'node:fs') return { readFileSync: () => html }
    if (specifier === 'virtual:master-css-manifest') return { default: preset, __esModule: true }
    return require(specifier)
  }
  const result: { html?: string } = {}
  new Function('require', 'exports', `${compiled.outputText}\nexports.html = html;`)(exampleRequire, result)
  assert.match(result.html!, /<style id="master-css">/)
  assert.match(result.html!, /--font-size-5xl:2\.5rem/)
  assert.match(result.html!, /font-size:var\(--font-size-5xl\)/)
  assert.match(result.html!, /Hello World/)
  assert.doesNotMatch(result.html!, /data-master-css-hydration-manifest|id="master-css-hydration-manifest"/)
})


test('native pruning examples retain each route’s authored HTML and shared safelist', async () => {
  const fixture = deliveryFixture()
  const scanner = new MasterCSSScanner({ manifest: preset as unknown as MasterCSSManifest }, fixture.root)
  const collection = createStylesheetCollection()
  try {
    const fences = deliveryFences(deliverySection('native-css-pruning', 'Scoped scanning'))
    // The final a.css fence demonstrates exclusions separately from the two-route graph.
    for (const fence of fences.filter(fence => /^(css|html)$/.test(fence.language)).slice(0, 5)) fixture.write(fence.name, fence.text)
    await scanner.init()
    for (const name of ['app/a/a.css', 'app/b/b.css']) {
      const source = fences.find(fence => fence.name === name)!.text
      await collection.register(scanner, `${fixture.root}/${name}`, source, { baseManifest: preset as unknown as MasterCSSManifest, projectDir: fixture.root })
    }
    for (const [letter, kept, removed] of [['a', 'a-card', 'b-card'], ['b', 'b-card', 'a-card']]) {
      const output = await collection.compose({ scanner, baseManifest: preset as unknown as MasterCSSManifest, projectDir: fixture.root, sourceIds: [`${fixture.root}/app/${letter}/${letter}.css`] })
      assert.ok(output.css.includes('.' + kept), `${letter}: own route`)
      assert.ok(output.css.includes('.shared-card'), `${letter}: imported safelist`)
      assert.ok(!output.css.includes('.' + removed), `${letter}: other route excluded`)
      assert.doesNotMatch(output.css, /debug-outline/)
    }
  } finally { await scanner.dispose(); collection.dispose(); fixture.dispose() }
})

test('the shared native source has independent outputs under each documented root', async () => {
  const fixture = deliveryFixture()
  const scanner = new MasterCSSScanner({ manifest: preset as unknown as MasterCSSManifest }, fixture.root)
  const collection = createStylesheetCollection()
  try {
    const fences = deliveryFences(deliverySection('native-css-pruning', 'Root scope'))
    for (const fence of fences.filter(fence => /^(css|html)$/.test(fence.language))) fixture.write(fence.name, fence.text)
    await scanner.init()
    for (const name of ['app/a/a.css', 'app/b/b.css']) {
      const source = fences.find(fence => fence.name === name)!.text
      await collection.register(scanner, `${fixture.root}/${name}`, source, { baseManifest: preset as unknown as MasterCSSManifest, projectDir: fixture.root })
    }
    for (const letter of ['b', 'a', 'b']) {
      const output = await collection.compose({ scanner, baseManifest: preset as unknown as MasterCSSManifest, projectDir: fixture.root, sourceIds: [`${fixture.root}/app/${letter}/${letter}.css`] })
      assert.match(output.css, /\.shared-card\s*\{/)
      assert.equal(output.css.includes('.only-used-in-b'), letter === 'b', `${letter}: shared rules follow this root's usage`)
      assert.ok(output.css.includes(`.${letter}-page`))
      assert.ok(!output.css.includes(letter === 'a' ? '.b-page' : '.a-page'))
    }
    assert.equal(readFileSync(`${fixture.root}/app/shared.css`, 'utf8'), fences.find(fence => fence.name === 'app/shared.css')!.text)
  } finally { await scanner.dispose(); collection.dispose(); fixture.dispose() }
})
