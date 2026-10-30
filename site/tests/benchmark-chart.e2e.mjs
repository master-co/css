/** Run against a local site: node --test site/tests/benchmark-chart.e2e.mjs. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'

const browserName = process.env.MASTER_BENCH_BROWSER ?? 'chromium'
const url = process.env.MASTER_BENCH_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

async function values({ js, motion = 'no-preference' }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: js, reducedMotion: motion })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chart = page.locator('#css-cost .home-bench-chart')
  const read = () => chart.locator('.home-bench-value').allTextContents()
  const offscreen = await read()
  await chart.scrollIntoViewIfNeeded()
  // The count settles within the bars' animation; poll instead of guessing its length.
  let settled = await read()
  for (let i = 0; js && i < 40; i++) {
    await page.waitForTimeout(250)
    const next = await read()
    if (next.join() === settled.join() && i > 4) break
    settled = next
  }
  await context.close()
  return { offscreen, settled, errors }
}

test(`${browserName}: the CSS size chart reads its measured sizes without scripts`, async () => {
  const withoutScripts = await values({ js: false })
  const animated = await values({ js: true })
  assert.ok(new Set(withoutScripts.settled).size > 1, `rows show distinct sizes: ${withoutScripts.settled}`)
  assert.deepEqual(withoutScripts.settled, animated.settled, 'server output matches where the animation ends')
  assert.deepEqual(animated.errors, [])
})

test(`${browserName}: reduced motion shows the measured sizes at once`, async () => {
  const reduced = await values({ js: true, motion: 'reduce' })
  const withoutScripts = await values({ js: false })
  assert.deepEqual(reduced.offscreen, withoutScripts.settled)
})
