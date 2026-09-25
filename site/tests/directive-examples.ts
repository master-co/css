import { stylesheetExamples } from './stylesheet-examples'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { inspectCSSSync } from '@master/css-compiler/node'
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
  assert.equal(directiveExamples.length, 9)
  const output = new Map<string, string>()
  for (const example of directiveExamples) {
    const actual = (await stylesheetExampleCSS(example.source)).replace(/\s+/g, '')
    const rendered = await compileRenderedStylesheet('/tmp/master-directive-example.css', example.source, { baseManifest: preset, preserveNativeCSS: true })
    assert.equal(actual, rendered.css.replace(/\s+/g, ''), example.title)
    output.set(example.title, actual)
  }
  assert.match(output.get('A token used by a native rule')!, /background-color:var\(--color-brand\)/)
  assert.match(output.get('A token used by a native rule')!, /--color-brand:#4f46e5/)
  assert.match(output.get('One token in two modes')!, /@media\(prefers-color-scheme:dark\)/)
  assert.match(output.get('One token in two modes')!, /--color-panel:#111827/)
  assert.match(output.get('An inline token')!, /background-color:#4f46e5/)
  assert.doesNotMatch(output.get('An inline token')!, /--color-brand/)
  assert.match(output.get('A resource without a matching class')!, /@keyframesfade-in/)
  assert.match(output.get('A resource without a matching class')!, /--color-brand:#4f46e5/)
  assert.match(output.get('A reusable condition')!, /@media\(prefers-reduced-motion:no-preference\)\{\.notice/)
  assert.match(output.get('Map a class suffix to a CSS value')!, /background-origin:padding-box/)
  assert.match(output.get('Reuse one value for both dimensions')!, /width:1rem;height:1rem/)
  assert.match(output.get('Native declarations keep their position')!, /padding:var\(--spacing-md\);padding-inline:3rem/)
  assert.match(output.get('Native declarations keep their position')!, /padding:2rem/)
  assert.match(output.get('A condition around the current selector')!, /@media\(width<52\.125rem\)\{\.notice/)
  await assert.rejects(stylesheetExampleCSS('@theme inline static { --color-brand: red; }'), /inline and static cannot be combined/)

  const settings = deliveryFences(directiveSection('project-settings'))[0].text
  assert.match(configuredExampleCSS(settings, ['p:1rem']), /#app[^{}]*\{padding:1rem/)
  assert.throws(() => configuredExampleCSS('@settings { root-size: 20; }', ['p:1rem']), /root-size.*removed/)
  assert.match(configuredExampleCSS(settings.replace('important: off', 'important: on'), ['p:1rem']), /padding:1rem!important/)
  const entries = deliveryFences(directiveSection('entry-markers')).slice(0, 2)
  for (const entry of entries) assert.equal(inspectCSSSync(entry.text).hasMasterEntry, true)
  assert.equal(inspectCSSSync(settings).hasMasterEntry, false)
  const safelist = deliveryFences(directiveSection('candidate-policy'))[0].text
  const classes = [...safelist.matchAll(/@safelist "([^"]+)"/g)].map(match => match[1])
  assert.equal(classes.length, 3)
  for (const className of classes) assert.ok(configuredExampleCSS('', [className]), className)
  assert.match(generatePresetCSS(classes), /transform:translateY\(-(?:5px|0\.3125rem)\)/)

  const fixture = deliveryFixture()
  try {
    const references = deliveryFences(directiveSection('reference-context'))
    fixture.write('app.css', references.find(fence => fence.name === 'app.css')!.text + '\n.reference-only { color: red; }')
    const source = references.find(fence => fence.name === 'Button.module.css')!.text
    const file = fixture.write('components/Button.module.css', source)
    const result = await compileRenderedStylesheet(file, source, { baseManifest: preset, projectDir: fixture.root, preserveNativeCSS: true })
    assert.deepEqual(result.diagnostics.filter(d => d.severity === 'error'), [])
    assert.match(result.css, /\.button\{display:inline-flex/)
    assert.match(result.css, /\.button:where\(:root,:root \*\)\{background-color:var\(--color-blue-60\)/)
    assert.doesNotMatch(result.css, /\.reference-only|\.btn\{|@reference|@compose/)
    assert.match(result.css, /--spacing-md:1rem/)
  } finally { fixture.dispose() }
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
