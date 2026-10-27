import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { compileCSSSync } from '@master/css-compiler/node'
import { createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import preset from '../utils/preset-manifest'
import { deliveryFences, deliveryFixture, deliverySection, deliverySource, routeStyles } from './delivery-examples'
import { compileMigrationExample } from './migration-examples'

export async function verifyDeliveryExamples() {
  const pruning = deliveryFences(deliverySection('native-css-pruning', 'Rule filtering'))
  const source = pruning.find(f => f.name === 'src/style.css')!.text.replace(/@import[^;]+;/g, '')
  const result = compileCSSSync(source, { classes: ['card', 'title'] })
  assert.match(result.css, /\.card[\s{]/)
  assert.match(result.css, /\.card \.title/)
  assert.doesNotMatch(result.css, /unused|debug-card/)
  // The documented policy is deliberately conservative, not a DOM relationship check.
  assert.match(compileCSSSync(source, { classes: ['title'] }).css, /\.card \.title/)
  assert.doesNotMatch(compileCSSSync(source, { classes: [] }).css, /\.card/)
  assert.match(compileCSSSync(source, { classes: [] }).css, /body/)

  const fixture = deliveryFixture()
  const scanner = new MasterCSSScanner({ manifest: preset }, fixture.root)
  const collection = createStylesheetCollection()
  try {
    const fences = deliveryFences(deliverySection('native-css-pruning', 'Scoped scanning'))
    // The last a.css fence is a separate exclusion example, not part of this graph.
    for (const fence of fences.filter(f => /^(css|html)$/.test(f.language)).slice(0, 5)) fixture.write(fence.name, fence.text)
    await scanner.init()
    for (const name of ['app/a/a.css', 'app/b/b.css']) {
      const source = fences.find(f => f.name === name)!.text
      await collection.register(scanner, fixture.root + '/' + name, source, { baseManifest: preset, projectDir: fixture.root })
    }
    for (const [letter, kept, removed] of [['a', 'a-card', 'b-card'], ['b', 'b-card', 'a-card']]) {
      const output = await collection.compose({ scanner, baseManifest: preset, projectDir: fixture.root, sourceIds: [fixture.root + `/app/${letter}/${letter}.css`] })
      assert.ok(output.css.includes('.' + kept), `${letter}: own source retained`)
      assert.ok(output.css.includes('.shared-card'), `${letter}: imported safelist retained`)
      assert.ok(!output.css.includes('.' + removed), `${letter}: other route removed`)
      assert.doesNotMatch(output.css, /debug-outline/)
    }
  } finally { await scanner.dispose(); collection.dispose(); fixture.dispose() }

  const css = await routeStyles()
  assert.doesNotMatch(css, /@reference|@compose|@variant/)
  assert.match(css, /@container home-feature-grid/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /home-cta:focus-visible/)

  const rendering = deliveryFences(deliverySource('rendering-modes'))
  const html = rendering.find(f => f.name === 'index.html')!.text
  const script = rendering.find(f => f.name === 'server.ts')!.text
  const output = compileMigrationExample(script)
  assert.equal(output.diagnostics?.length, 0)
  const files = new Map<string, string>()
  const require = createRequire(import.meta.url)
  const controlledRequire = (specifier: string) => {
    if (specifier === 'virtual:master-css-manifest') return { __esModule: true, default: preset }
    if (specifier === 'node:fs') return {
      readFileSync: () => html, mkdirSync: () => undefined,
      writeFileSync: (name: string, content: string) => files.set(name, content)
    }
    return require(specifier)
  }
  // Execute only the authored example with its filesystem writes captured in memory.
  new Function('require', 'exports', output.outputText)(controlledRequire, {})
  const rendered = files.get('./dist/index.html')!
  assert.match(rendered, /class="font-5xl font-heavy"/)
  const url = rendered.match(/data-master-css-hydration-manifest="([^"]+)"/)![1]
  const manifest = JSON.parse(files.get('./dist' + url)!)
  assert.equal(manifest.version, 1)
  assert.equal(manifest.rules.length, 2)
  assert.match(rendered, /font-weight:var\(--font-weight-heavy\)/)
}
