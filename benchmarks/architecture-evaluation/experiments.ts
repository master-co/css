import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'
import { compileManifestSync } from '@master/css-compiler/node'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { compileRuntimeProgramSync, createEngineSync } from '@master/css/node'
import { analyzeCSSStructure } from '../shared/css-structure'
import { summarizeBytes } from '../shared/bytes'
import { environment, resultRoot, digest } from './acceptance'

const baseManifest = { version: 6 as const, languageVersion: 16 as const }
const folder = resolve(resultRoot, 'bounded')
mkdirSync(folder, { recursive: true })
const bytes = (value: string | Uint8Array) => summarizeBytes(Buffer.from(value))
const write = (name: string, value: string | Uint8Array) => writeFileSync(resolve(folder, name), value)

// This is ordinary finite-set CSS generation, not a proposed VM or grammar change.
const source = `
@theme { --color-brand: #2563eb; }
@utility card { color: var(--color-brand); padding: 8px; }
@utility label { color: #7c3aed; padding: 4px; }
@utility space(--size) { padding: var(--size); }
@mixin --wide { @media (width >= 768px) { @contents; } }
@mixin --interactive { &:hover { @contents; } }
`
const compiled = compileManifestSync(source, { baseManifest })
assert.equal(compiled.diagnostics.filter(item => item.severity === 'error').length, 0)
const classes = ['card', 'label', 'space(12px)'].flatMap(name => [name, `${name}@apply(--wide)`, `${name}@apply(--interactive)`, `${name}@apply(--wide)@apply(--interactive)`])
const program = compileRuntimeProgramSync(compiled.manifest)
using manifestEngine = createEngineSync({ manifest: compiled.manifest })
using programEngine = createEngineSync({ program })
manifestEngine.ensureClassRules(classes)
programEngine.ensureClassRules(classes)
const finiteCSS = manifestEngine.snapshot().text
assert.equal(programEngine.snapshot().text, finiteCSS)
for (const name of classes) assert.equal(manifestEngine.inspect(name).matchStatus, 'matched')
write('fixed-input.css', source)
write('fixed-manifest.json', JSON.stringify(compiled.manifest))
write('fixed-program.bin', program)
write('fixed-materialized.css', finiteCSS)
write('fixed-classes.json', JSON.stringify(classes, null, 2))

const browser = await chromium.launch({ headless: true })
let browserComparisons = 0
try {
  const staticPage = await browser.newPage()
  const dynamicPage = await browser.newPage()
  using single = createEngineSync({ program })
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  const html = (css: string, name: string) => `<style>body{color:rgb(1,2,3)}${css}</style><div id="target" class="${escape(name)}">fixture</div>`
  for (const name of classes) {
    single.ensureClassRules([name])
    await staticPage.setContent(html(finiteCSS, name))
    await dynamicPage.setContent(html(single.snapshot().text, name))
    for (const width of [600, 900]) for (const hovered of [false, true]) {
      for (const page of [staticPage, dynamicPage]) {
        await page.setViewportSize({ width, height: 400 })
        if (hovered) await page.locator('#target').hover()
        else await page.mouse.move(0, 0)
      }
      const snapshot = (page: typeof staticPage) => page.locator('#target').evaluate(element => {
        const css = getComputedStyle(element)
        return { color: css.color, padding: css.padding, display: css.display }
      })
      assert.deepEqual(await snapshot(staticPage), await snapshot(dynamicPage), `${name}/${width}/${hovered}`)
      browserComparisons++
    }
    single.deleteClassRules([name])
    assert.equal(single.snapshot().text, '')
  }
  const unseen = 'space(13px)'
  assert(!classes.includes(unseen))
  assert.equal(single.inspect(unseen).matchStatus, 'matched')
  single.ensureClassRules([unseen])
  await staticPage.setContent(html(finiteCSS, unseen))
  await dynamicPage.setContent(html(single.snapshot().text, unseen))
  assert.equal(await staticPage.locator('#target').evaluate(element => getComputedStyle(element).padding), '0px')
  assert.equal(await dynamicPage.locator('#target').evaluate(element => getComputedStyle(element).padding), '13px')

  const motion = `
@reference "./reference.css";
@layer components {
  @keyframes used-motion { to { opacity: 1; } }
  .used { animation: used-motion 1s; }
  .unused { animation: spare 1s; }
  @keyframes spare { to { transform: rotate(1turn); } }
  @media (min-width:768px) { @keyframes used-motion { to { opacity: .8; } } }
}
@keyframes orphan { to { opacity: .2; } }
`
  write('reference.css', '@keyframes reference-only { to { opacity: .4; } } .reference-root { animation: reference-only 1s; }')
  const keyframes: Record<string, unknown> = {}
  for (const [id, pruneNativeCSS, live, extension, expected] of [
    ['preserve', false, ['used'], '', 4],
    ['prune', true, ['used'], '', 2],
    ['dynamic-prune', true, ['dynamic'], '.dynamic { animation-name: var(--unknown); }', 5]
  ] as const) {
    const input = motion + extension
    const entry = resolve(folder, `${id}.input.css`)
    writeFileSync(entry, input)
    const result = await compileRenderedStylesheet(entry, input, { projectDir: folder, baseManifest, classes: [...live], pruneNativeCSS })
    const css = result.css
    const structure = analyzeCSSStructure(css)
    assert.equal(structure.keyframesCount, expected, id)
    assert.equal(result.diagnostics.filter(item => item.severity === 'error').length, 0, id)
    if (id !== 'dynamic-prune') {
      assert(!css.includes('@keyframes reference-only'), 'A reference-only definition is not a preservation root')
      assert(css.includes('@keyframes used-motion'))
      assert.equal((css.match(/@keyframes used-motion/g) ?? []).length, 2, 'Same-name definitions retain identity and containers')
    }
    write(`${id}.css`, css)
    keyframes[id] = { ...bytes(css), structure, cssSHA256: digest(css), definitionCount: result.manifest.keyframes?.length ?? 0 }
  }
  const report = {
    kind: 'bounded-architecture-experiment', environment: environment(), browser: browser.version(),
    fixedSet: {
      classCount: classes.length, browserComparisons,
      manifest: bytes(JSON.stringify(compiled.manifest)), program: bytes(program), materializedCSS: bytes(finiteCSS),
      structure: analyzeCSSStructure(finiteCSS), unseenClass: { name: unseen, regularEngine: '13px', finiteCSS: '0px' }
    },
    keyframes,
    limits: [
      'No production grammar, runtime program format, public API or pruning default changed.',
      'Finite materialization covers only the enumerated classes; unseen values require regeneration or the regular engine.',
      'Payloads exclude the JavaScript engine, DOM observer, delivery code, base preset and HTTP costs; they are not total app sizes.',
      'Browser comparisons cover color/padding/display for this bounded fixture in one Chromium version, not all CSS semantics.',
      'Keyframe pruning is opt-in; reference-only definitions are not roots, but dynamic names conservatively retain candidates including reference definitions.',
      'Native preserved keyframes and same-name definitions are intentional; smaller bytes alone do not justify changing preservation policy.',
      'No CPU/startup/latency measurements or model trials were performed; no speed or AI productivity claim follows.'
    ]
  }
  write('report.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
