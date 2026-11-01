import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { captureStyleEvidence, compareStyleEvidence, inspectPageClasses } from './browser-diagnostics.mjs'
import { prepare, repository } from './trials/control.mjs'
import { check } from './trials/check.mjs'

let browser, root
before(async () => {
  browser = await chromium.launch()
  root = await mkdtemp(join(tmpdir(), 'master-browser-diagnostics-'))
})
after(async () => { await browser?.close(); if (root) await rm(root, { recursive: true, force: true }) })

test('browser evidence retains layers, inherited values, shorthand, duplicates and source positions without edits', async () => {
  const css = `@layer components, utilities;
html { font: 16px/1.5 Arial; --spacing: 4px }
body { line-height: 1.2 }
@layer components { #target { height: 40px; color: red !important } }
@layer utilities { .height { height: calc(var(--spacing)*2.5); color: blue !important } }
#target { padding: 16px; padding-left: 0; display: block; display: grid }
@media (min-width: 900px) { #target { height: 99px } }`
  await writeFile(join(root, 'rules.css'), css)
  await writeFile(join(root, 'index.html'), '<!doctype html><link rel="stylesheet" href="rules.css"><main><div id="target" class="height">Hello</div></main>')
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
  try {
    await page.goto(pathToFileURL(join(root, 'index.html')).href)
    const before = await page.content()
    const report = await captureStyleEvidence(page, '#target', ['line-height', 'height', 'padding-left', 'color', 'display'])
    assert.equal(report.element.values['line-height'], '19.2px')
    assert.equal(report.element.values.height, '10px')
    assert.equal(report.element.values.color, 'rgb(255, 0, 0)')
    assert.equal(report.element.values['padding-left'], '0px')
    assert.equal(report.element.variables['--spacing'], '4px')
    const component = report.rules.find(rule => rule.layers.includes('components'))
    const utility = report.rules.find(rule => rule.layers.includes('utilities'))
    assert.equal(component.declarations.find(prop => prop.name === 'height').value, '40px')
    assert.equal(component.declarations.find(prop => prop.name === 'height').location.line, 4)
    assert.ok(utility.declarations.some(prop => prop.name === 'height' && prop.value.includes('--spacing')))
    assert.ok(component.declarations.some(prop => prop.name === 'color' && prop.important))
    assert.ok(report.rules.some(rule => rule.declarations.some(prop => prop.name === 'padding' && prop.longhands.some(item => item.name === 'padding-left'))))
    assert.ok(report.rules.some(rule => rule.declarations.filter(prop => prop.name === 'display' && prop.location).length === 2))
    assert.ok(report.ancestors.some(item => item.element.tag === 'body' && item.rules.some(rule => rule.declarations.some(prop => prop.name === 'line-height' && prop.value === '1.2'))))
    assert.ok(report.ancestors.some(item => item.element.tag === 'html' && item.rules.some(rule => rule.declarations.some(prop => prop.name === 'font'))))
    assert.ok(report.layerOrder.subLayers.some(layer => layer.name === 'utilities'))
    assert.equal(await page.content(), before)
    assert.equal(await readFile(join(root, 'rules.css'), 'utf8'), css)
    assert.match(report.limits, /not proven winners/)
    assert.equal((await captureStyleEvidence(page, '#missing', ['height'])).status, 'missing-element')
  } finally { await page.close() }
})

test('class diagnostics retain DOM occurrences and Rust recognition while respecting active style types', async () => {
  const page = await browser.newPage()
  try {
    await page.setContent(`<style>.native { color: red }</style><style type="text/plain">.inactive { color: blue }</style>
      <div id="first" class="block native inactive invented-class"></div><p id="second" class="invented-class"></p>`)
    const manifest = JSON.parse(await readFile(new URL('../../packages/preset/src/default-manifest.json', import.meta.url), 'utf8'))
    const report = await inspectPageClasses(page, { manifest, nativeClassNames: [] })
    assert.equal(report.classes.find(item => item.className === 'block').status, 'generated')
    assert.equal(report.classes.find(item => item.className === 'native').status, 'native-css')
    assert.deepEqual(report.unresolved.map(item => item.className), ['inactive', 'invented-class'])
    const unknown = report.unresolved.find(item => item.className === 'invented-class')
    assert.deepEqual(unknown.occurrences.map(item => item.id), ['first', 'second'])
    for (const occurrence of unknown.occurrences) assert.equal(await page.locator(occurrence.selector).getAttribute('id'), occurrence.id)
  } finally { await page.close() }
})

test('source and target evidence uses the requested state, viewport and scheme', async () => {
  const html = color => `<!doctype html><style>button { color: ${color} } button:hover { color: green } button:focus-visible { color: purple } button:disabled { color: gray } @media (min-width: 900px) { button { height: 50px } } @media (prefers-color-scheme: dark) { button { background: black } }</style><button id="target">Go</button>`
  await writeFile(join(root, 'source.html'), html('red'))
  await writeFile(join(root, 'target.html'), html('blue'))
  const options = { source: pathToFileURL(join(root, 'source.html')).href, target: pathToFileURL(join(root, 'target.html')).href, selector: '#target', properties: ['color', 'height', 'background-color'], width: 1280, colorScheme: 'dark' }
  const resting = await compareStyleEvidence(browser, options)
  assert.equal(resting.source.element.values.color, 'rgb(255, 0, 0)')
  assert.equal(resting.target.element.values.color, 'rgb(0, 0, 255)')
  assert.equal(resting.target.element.values.height, '50px')
  assert.equal(resting.target.element.values['background-color'], 'rgb(0, 0, 0)')
  assert.deepEqual(resting.differences, [{ property: 'color', source: 'rgb(255, 0, 0)', target: 'rgb(0, 0, 255)' }])
  for (const [state, expected] of [['hover', 'rgb(0, 128, 0)'], ['focus', 'rgb(128, 0, 128)'], ['disabled', 'rgb(128, 128, 128)']]) {
    const report = await compareStyleEvidence(browser, { ...options, state })
    assert.equal(report.source.element.values.color, expected)
    assert.equal(report.target.element.values.color, expected)
    assert.ok(report.target.rules.some(rule => rule.selector.includes(state === 'focus' ? ':focus-visible' : ':' + state)))
  }
})

test('repository command emits a report and refuses to overwrite inputs or previous evidence', async () => {
  await writeFile(join(root, 'app.css'), '/* no utilities */')
  const output = join(root, 'report.json')
  const args = ['--import', 'tsx', 'scripts/ai-authoring/diagnose.mjs', '--source', join(root, 'source.html'), '--target', join(root, 'target.html'), '--selector', '#target', '--output', output]
  execFileSync(process.execPath, args, { timeout: 30000 })
  const report = JSON.parse(await readFile(output, 'utf8'))
  assert.equal(report.source.status, 'captured')
  assert.equal(report.target.status, 'captured')
  assert.deepEqual(report.classes.unresolved, [])
  assert.throws(() => execFileSync(process.execPath, args, { timeout: 30000, stdio: 'pipe' }), /EEXIST/)
})

test('failed import checks include source/target rule evidence and unresolved class locations', async () => {
  const work = join(root, 'failed-import')
  await prepare(work, 'tailwind-hover', true)
  const html = await readFile(join(work, 'index.html'), 'utf8')
  await writeFile(join(work, 'index.html'), html.replace('(height:calc(var(--spacing)*10))', 'h(10) invented-class'))
  await writeFile(join(work, 'app.css'), (await readFile(join(work, 'app.css'), 'utf8')) + '\nbody{line-height:1.2}\n@layer components{#target{height:40px}}')
  const result = await check(work, 'tailwind-hover', browser, repository, 'Retained reset CSS.')
  assert.equal(result.styling, false)
  assert.equal(result.invalidClasses, 1)
  assert.equal(result.diagnostics.unresolvedClasses[0].className, 'invented-class')
  assert.equal(result.diagnostics.unresolvedClasses[0].occurrences[0].id, 'target')
  const evidence = result.diagnostics.evidence.find(item => item.check === 'light-390-rest')
  assert.equal(evidence.source.element.values['line-height'], '24px')
  assert.equal(evidence.target.element.values['line-height'], '19.2px')
  assert.equal(evidence.source.element.values.height, '40px')
  assert.equal(evidence.target.element.values.height, '10px')
  assert.ok(evidence.target.rules.some(rule => rule.layers.includes('components') && rule.declarations.some(prop => prop.name === 'height' && prop.value === '40px')))
  assert.ok(evidence.target.rules.some(rule => rule.layers.includes('utilities') && rule.declarations.some(prop => prop.name === 'height' && prop.value === 'calc(10 * 1px)' && prop.authored)))
  assert.ok(evidence.target.ancestors.some(item => item.element.tag === 'body' && item.rules.some(rule => rule.declarations.some(prop => prop.value === '1.2'))))
  assert.equal(await readFile(join(work, 'diagnostics.json'), 'utf8'), JSON.stringify(result.diagnostics, null, 2))
  const baseline = join(root, 'failed-import-without-evidence')
  await prepare(baseline, 'tailwind-hover', true)
  for (const file of ['index.html', 'app.css', 'app.js']) await writeFile(join(baseline, file), await readFile(join(work, file)))
  const without = await check(baseline, 'tailwind-hover', browser, repository, 'Retained reset CSS.', baseline, { includeDiagnostics: false })
  assert.deepEqual(without.checks, result.checks)
  assert.equal(without.diagnostics, undefined)
  assert.equal(JSON.parse(await readFile(join(baseline, 'acceptance.json'), 'utf8')).diagnostics, undefined)
  await assert.rejects(readFile(join(baseline, 'diagnostics.json')), { code: 'ENOENT' })
})
