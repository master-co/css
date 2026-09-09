import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createRenderBindingSession } from '../../../../packages/binding/src/engine-binding.ts'

const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const values = ['auto', 'auto 1s', 'auto fade']
const observations = Object.fromEntries(values.map(value => [value, new Set()]))
const manifest = { version: 1, utilities: [], animations: { auto: { to: { opacity: '1' } }, fade: { to: { opacity: '1' } } } }
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const value of values) {
      await page.setContent(`<style>.x{animation:${value}}</style><div class="x">probe</div>`)
      const result = await page.evaluate(value => ({ name: getComputedStyle(document.querySelector('.x')).animationName, supported: CSS.supports('animation', value) }), value)
      if (result.name !== 'none') observations[value].add(result.name)
      console.log(JSON.stringify({ browser: browserName, value, ...result }))
    }
  } finally { await browser.close() }
}
let failures = 0
for (const value of values) {
  const session = await createRenderBindingSession({ manifest }, { binding: 'native' })
  try {
    session.ensureStylesheetResources(`.x{animation:${value}}`)
    const text = session.snapshot().snapshot.text
    const generated = ['auto', 'fade'].filter(name => text.includes(`@keyframes ${name}`))
    const expected = [...observations[value]].sort()
    const pass = JSON.stringify(generated) === JSON.stringify(expected)
    if (!pass) failures++
    console.log(JSON.stringify({ value, generated, expected, result: pass ? 'PASS' : 'FAIL' }))
  } finally { session.dispose() }
}
assert.equal(failures, 0, 'Retain names required by any supported browser grammar')
