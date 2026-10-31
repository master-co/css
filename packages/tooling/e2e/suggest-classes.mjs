// Run after building bindings/tooling: node packages/tooling/e2e/suggest-classes.mjs
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { createToolingSessionSync } from '@master/css-tooling/node'

const fixtures = [
  ['display:flex;align-items:center;padding:16px;gap:1rem', ['display', 'alignItems', 'padding', 'gap']],
  ['margin:12px;opacity:.5!important', ['margin', 'opacity']],
  ['padding:var(--spacing-md);color:var(--color-red)', ['padding', 'color']],
  ['width:calc(100% - 2rem);border-radius:8px', ['width', 'borderRadius']],
  ['display:block;display:grid;padding:1rem;padding-left:0', ['display', 'padding'], 'preserved'],
  ['font-size:1rem;line-height:1.5', ['fontSize', 'lineHeight'], 'preserved'],
  ['background-color:var(--color-blue);color:white', ['backgroundColor', 'color']],
  ['border:1px solid currentColor;border-left-width:4px', ['borderWidth', 'borderStyle', 'borderColor'], 'preserved'],
  ['transform:translateX(2px);position:relative', ['transform', 'position']],
  ['--custom:8px;padding:var(--custom)', ['padding'], 'preserved'],
  ['white-space:pre-wrap;overflow-wrap:anywhere', ['whiteSpace', 'overflowWrap'], 'preserved'],
  ['padding:-1px;display:flex', ['padding', 'display']]
]

const session = createToolingSessionSync({ manifest: preset })
const browser = await chromium.launch({ headless: true })
let comparisons = 0
try {
  const page = await browser.newPage()
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 720 })
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      for (const [declarations, properties, status = 'suggested'] of fixtures) {
        const report = session.suggestClasses(declarations)
        assert.equal(report.status, status, declarations)
        await page.setContent('<!doctype html><html><body><section><button id="source">Source</button></section><section><button id="target">Target</button></section></body></html>')
        await page.addStyleTag({ content: `@layer base{html{color-scheme:${colorScheme}}section{width:240px}button{box-sizing:border-box;font:inherit}}#source{${declarations}}${report.css}#target{${report.remainingCss}}` })
        await page.locator('#target').evaluate((element, classes) => element.classList.add(...classes), report.classes)
        const values = async id => page.locator(id).evaluate((element, properties) => {
          const css = getComputedStyle(element)
          return Object.fromEntries(properties.map(property => [property, css[property]]))
        }, properties)
        assert.deepEqual(await values('#target'), await values('#source'), `${width}/${colorScheme}: ${declarations}`)
        comparisons++
      }
    }
  }
  process.stdout.write(`Passed ${comparisons} computed-style comparisons across 12 declaration blocks, two widths and two color schemes. Surrounding cascade and Tailwind migration fidelity are not implied.\n`)
} finally {
  session.dispose()
  await browser.close()
}
