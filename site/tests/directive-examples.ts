import { stylesheetExamples } from './stylesheet-examples'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inspectCSSSync, compileManifestSync } from '@master/css-compiler/node'
import { compileRenderedStylesheet, createStylesheetCollection } from '@master/css-compiler/stylesheet'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { stylesheetExampleCSS } from '../reference/stylesheet-example'
import { configuredExampleCSS } from '../reference/configured-example'
import { generatePresetCSS } from '../common/generate-preset-css'
import preset from '../utils/preset-manifest'
import { deliveryFences, deliveryFixture } from './delivery-examples'

export const directiveSource = readFileSync(new URL('../app/[locale]/guide/directives/contract.mdx', import.meta.url), 'utf8')
export function directiveSection(id: string) {
  const start = directiveSource.indexOf(`\\{#${id}\\}`)
  assert.ok(start >= 0, id)
  const end = directiveSource.indexOf('\n## ', start)
  return directiveSource.slice(start, end < 0 ? undefined : end)
}
export const directiveExamples = stylesheetExamples(directiveSource)

export async function verifyDirectiveExamples() {
  assert.equal(directiveExamples.length, 4)
  const output = new Map<string, string>()
  for (const example of directiveExamples) {
    const actual = (await stylesheetExampleCSS(example.source)).replace(/\s+/g, '')
    const rendered = await compileRenderedStylesheet('/tmp/master-directive-example.css', example.source, { baseManifest: preset, preserveNativeCSS: true, classes: [...compileManifestSync(example.source, { baseManifest: preset }).directiveSummary.extractionPolicy.safelist] })
    // The two entry points intentionally have different source identities.
    const comparable = (css: string) => css.replace(/\s+/g, '').replace(/master-css-keyframe-[\w-]+/g, 'master-css-keyframe-source')
    assert.equal(comparable(actual), comparable(rendered.css), example.title)
    output.set(example.title, actual)
  }
  assert.match(output.get('Scoped tokens in native CSS')!, /color:var\(--color-brand\)/)
  assert.match(output.get('Scoped tokens in native CSS')!, /\.dark\{--color-brand:#111827/)
  assert.match(output.get('Native keyframes')!, /@keyframesfade-in/)
  assert.match(output.get('A parameter mixin')!, /width:2rem;height:2rem/)
  assert.match(output.get('A named media condition')!, /@media\(width>=40rem\)/)
  await assert.rejects(stylesheetExampleCSS('@theme unknown { --color-brand: red; }'), /accepts only static and inline modifiers/)
  assert.throws(() => configuredExampleCSS('@settings { important: true; }', ['padding:1rem']), /removed/)
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
