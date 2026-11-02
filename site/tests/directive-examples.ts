import { stylesheetExamples } from './stylesheet-examples'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inspectCSSSync, compileManifestSync } from '@master/css-compiler/node'
import { compileRenderedStylesheet, createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { stylesheetExampleCSS } from '@master/internal-site/css/stylesheet-example.ts'
import { configuredExampleCSS } from '@master/internal-site/css/configured-example.ts'
import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import preset from '@master/internal-site/css/preset-manifest.ts'
import { deliveryFences, deliveryFixture } from './delivery-examples'

export const directiveSource = readFileSync(new URL('../content/guide/directives/contract.mdx', import.meta.url), 'utf8')
export function directiveSection(id: string) {
  const start = directiveSource.indexOf(`\\{#${id}\\}`)
  assert.ok(start >= 0, id)
  const end = directiveSource.indexOf('\n## ', start)
  return directiveSource.slice(start, end < 0 ? undefined : end)
}
export const directiveExamples = stylesheetExamples(directiveSource)

export async function verifyDirectiveExamples() {
  assert.equal(directiveExamples.length, 5)
  const output = new Map<string, string>()
  for (const example of directiveExamples) {
    const actual = (await stylesheetExampleCSS(example.source)).replace(/\s+/g, '')
    const rendered = await compileRenderedStylesheet('/tmp/master-directive-example.css', example.source, { baseManifest: preset, preserveNativeCSS: true, classes: [...compileManifestSync(example.source, { baseManifest: preset }).directiveSummary.extractionPolicy.safelist] })
    assert.equal(actual, rendered.css.replace(/\s+/g, ''), example.title)
    output.set(example.title, actual)
  }
  assert.match(output.get('Scoped tokens in native CSS')!, /color:var\(--color-brand\)/)
  assert.match(output.get('Scoped tokens in native CSS')!, /\.dark\{--color-brand:#111827/)
  assert.match(output.get('Native keyframes')!, /@keyframesfade-in/)
  assert.match(output.get('A parameter utility')!, /width:2rem;height:2rem/)
  assert.match(output.get('A named media condition')!, /@media\(width>=40rem\)/)
  assert.match(output.get('A named container condition')!, /@container\(width>=40rem\)/)
  await assert.rejects(stylesheetExampleCSS('@theme unknown { --color-brand: red; }'), /accepts only static and inline modifiers/)
  const referenceFixture = deliveryFixture()
  try {
    const fences = deliveryFences(directiveSection('reference-context'))
    referenceFixture.write('app.css', fences.find(fence => fence.name === 'app.css')!.text)
    const source = fences.find(fence => fence.name === 'Button.module.css')!.text
    const file = referenceFixture.write('components/Button.module.css', source)
    const result = await compileRenderedStylesheet(file, source, { baseManifest: preset, projectDir: referenceFixture.root })
    assert.deepEqual(result.diagnostics.filter(diagnostic => diagnostic.severity === 'error'), [])
    assert.match(result.css, /padding:var\(--spacing-md\)/)
    assert.match(result.css, /data-theme=.?dark/)
    assert.match(result.css, /color:white/)
    assert.doesNotMatch(result.css, /box-sizing:border-box/, 'Referencing the app must not deliver its base stylesheet')
  } finally { referenceFixture.dispose() }
  const preservation = deliveryFences(directiveSection('native-css-preservation')).find(fence => fence.text.includes('@preserve native;'))!.text
  const pruningFixture = deliveryFixture()
  const scanner = new MasterCSSScanner({ manifest: preset }, pruningFixture.root)
  const collection = createStylesheetCollection()
  try {
    const preserved = pruningFixture.write('preserved.css', preservation)
    const prunedSource = preservation.replace('@preserve native;', '@prune native;')
    const pruned = pruningFixture.write('pruned.css', prunedSource)
    await scanner.init()
    await collection.register(scanner, preserved, preservation, { baseManifest: preset, projectDir: pruningFixture.root })
    await collection.register(scanner, pruned, prunedSource, { baseManifest: preset, projectDir: pruningFixture.root })
    const options = { scanner, baseManifest: preset, projectDir: pruningFixture.root }
    assert.match((await collection.compose({ ...options, sourceIds: [preserved] })).css, /\.injected-by-payment-widget/)
    assert.doesNotMatch((await collection.compose({ ...options, sourceIds: [pruned] })).css, /\.injected-by-payment-widget/)
  } finally { await scanner.dispose(); collection.dispose(); pruningFixture.dispose() }
}
