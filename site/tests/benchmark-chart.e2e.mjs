/** Run against a local site: MASTER_BENCH_URL=http://localhost:3000 node --test site/tests/benchmark-chart.e2e.mjs. */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium, webkit } from '@playwright/test'
import snapshot from '../.generated/benchmarks/docs-page-css-size.json' with { type: 'json' }

const browserName = process.env.MASTER_BENCH_BROWSER ?? 'chromium'
const url = process.env.MASTER_BENCH_URL ?? 'http://localhost:3000'
let browser
before(async () => { browser = await ({ chromium, webkit })[browserName].launch() })
after(async () => { await browser?.close() })

// The chart shows the committed snapshot, smallest page first.
const kilobytes = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const measured = kind => [...snapshot.pages]
  .sort((a, b) => a.css.total[kind] - b.css.total[kind])
  .map(page => ({ name: page.name, size: `${kilobytes.format(page.css.total[kind] / 1000)} kB` }))

async function open({ js = true, motion = 'no-preference', width = 1440, scheme = 'light', forced = 'none' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: js, reducedMotion: motion, colorScheme: scheme, forcedColors: forced })
  const page = await context.newPage()
  // Keep the scene stable while other homepage work triggers development reloads.
  await page.routeWebSocket(socket => socket.hostname === new URL(url).hostname, socket => socket.onMessage(() => undefined))
  // Every canvas frame starts by clearing it, so cleared frames count the painter's work.
  await page.addInitScript(() => {
    window.benchPaints = 0
    const clear = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList?.contains('home-bench-canvas')) window.benchPaints++
      return clear.apply(this, args)
    }
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(url, { waitUntil: 'networkidle' })
  const chart = page.locator('#css-cost .home-bench-chart')
  // The canvas paints only once the chart comes into view, so hydration is the island's own React props.
  if (js) await page.waitForFunction(() => { const element = document.querySelector('#css-cost .home-bench-chart'); return !!element && Object.keys(element).some(key => key.startsWith('__reactProps$')) })
  return { context, page, errors, chart }
}

const paints = page => page.evaluate(() => window.benchPaints)

/** Each row's visible count and, read from the canvas in the same task, where its bar ends. */
const readRows = page => page.evaluate(() => {
  const chart = document.querySelector('#css-cost .home-bench-chart')
  const canvas = chart.querySelector('canvas')
  const box = canvas.getBoundingClientRect()
  const scale = canvas.width / box.width
  const pixels = chart.dataset.renderer === 'canvas' ? canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data : undefined
  const ticks = [...chart.querySelectorAll('.home-bench-tick')]
  const axisBytes = parseFloat(ticks.at(-1).textContent.replace(/,/g, '')) * 1000
  return [...chart.querySelectorAll('.home-bench-row')].map(row => {
    const track = row.querySelector('.home-bench-track').getBoundingClientRect()
    const readout = row.querySelector('.home-bench-readout').getBoundingClientRect()
    const fallback = row.querySelector('.home-bench-bar')
    const text = row.querySelector('.home-bench-value').textContent
    const ratio = row.querySelector('.home-bench-ratio')
    let bar
    if (pixels) {
      const y = Math.round((track.top + track.height / 2 - box.top) * scale)
      let x = Math.round((track.left - box.left) * scale)
      while (x < canvas.width && pixels[(y * canvas.width + x) * 4 + 3] > 200) x++
      bar = x / scale - (track.left - box.left)
    }
    return {
      name: row.dataset.brand,
      text,
      spoken: row.querySelector('.sr-only').textContent,
      bar,
      expected: parseFloat(text.replace(/,/g, '')) * 1000 / axisBytes * track.width,
      trackWidth: track.width,
      readout: readout.left - track.left,
      readoutWidth: readout.width,
      fallbackShown: getComputedStyle(fallback).display !== 'none',
      settled: row.hasAttribute('data-settled'),
      // The Master CSS row is the unit, so it has no ratio.
      ratio: ratio ? Number(getComputedStyle(ratio).opacity) : null
    }
  })
})

/** Poll until the counts stop changing, instead of guessing the animation's length. */
async function settle(page) {
  let rows = await readRows(page)
  for (let index = 0; index < 40; index++) {
    await page.waitForTimeout(250)
    const next = await readRows(page)
    const landed = next.every(row => row.settled && (row.ratio === null || row.ratio === 1))
    if (next.map(row => row.text).join() === rows.map(row => row.text).join() && landed && index > 2) return next
    rows = next
  }
  return rows
}

async function values({ js, motion = 'no-preference' }) {
  const { context, page, errors, chart } = await open({ js, motion })
  const read = () => chart.locator('.home-bench-value').allTextContents()
  const offscreen = await read()
  await chart.scrollIntoViewIfNeeded()
  if (js) await settle(page)
  const settled = await read()
  await context.close()
  return { offscreen, settled, errors }
}

test(`${browserName}: the CSS size chart reads its measured sizes without scripts`, async () => {
  const withoutScripts = await values({ js: false })
  const animated = await values({ js: true })
  assert.deepEqual(withoutScripts.settled, measured('brotliBytes').map(row => row.size), 'the server renders the snapshot')
  assert.deepEqual(withoutScripts.settled, animated.settled, 'server output matches where the animation ends')
  assert.deepEqual(animated.errors, [])
})

test(`${browserName}: reduced motion shows the measured sizes at once`, async () => {
  const reduced = await values({ js: true, motion: 'reduce' })
  const withoutScripts = await values({ js: false })
  assert.deepEqual(reduced.offscreen, withoutScripts.settled)
})

for (const width of [1440, 390]) {
  test(`${browserName} ${width}: the canvas counts every bar down with its readout and settles at the measured size`, { timeout: 30000 }, async () => {
    const { context, page, errors, chart } = await open({ width })
    try {
      // A screen ahead of the viewport the canvas has painted the armed bars, but nothing has played yet.
      await chart.evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY - innerHeight * 1.5))
      await page.waitForTimeout(300)
      const armed = await readRows(page)
      assert.ok(armed.every(row => !row.fallbackShown), 'the canvas replaces the DOM bars once it has painted')
      assert.ok(armed.every(row => !row.settled && !row.ratio), 'ratios wait offscreen with their bars')
      assert.ok(new Set(armed.map(row => row.text)).size === 1, `every bar starts from one shared size: ${armed.map(row => row.text)}`)
      await chart.evaluate(element => element.scrollIntoView({ block: 'center' }))
      for (const at of [450, 900]) {
        await page.waitForTimeout(at === 450 ? 450 : 450)
        const rows = await readRows(page)
        assert.ok(rows.some(row => !row.settled), `still counting at ${at}ms`)
        for (const row of rows) {
          assert.ok(Math.abs(row.bar - row.expected) <= 2, `${row.name} at ${at}ms: the bar (${row.bar.toFixed(1)}px) matches its count ${row.text} (${row.expected.toFixed(1)}px)`)
          assert.ok(row.settled || !row.ratio, `${row.name}'s ratio waits until its bar lands`)
          if (width === 1440) {
            const place = Math.min(row.bar, Math.max(row.expected, row.trackWidth - row.readoutWidth))
            assert.ok(Math.abs(row.readout - Math.min(place, row.trackWidth - row.readoutWidth)) <= 2.5, `${row.name}'s readout rides its bar at ${at}ms`)
          }
        }
      }
      const settled = await settle(page)
      assert.deepEqual(settled.map(row => row.text), measured('brotliBytes').map(row => row.size))
      assert.deepEqual(settled.map(row => row.spoken), measured('brotliBytes').map(row => row.size), 'screen readers read the measured size')
      for (const row of settled) {
        assert.ok(Math.abs(row.bar - row.expected) <= 2, `${row.name} settles at its measured length`)
        assert.ok(row.ratio === null || row.ratio === 1, `${row.name}'s ratio appears once settled`)
      }
      assert.deepEqual(errors, [])
    } finally {
      await context.close()
    }
  })
}

test(`${browserName}: the chart paints only while it moves, on screen and in a visible tab`, { timeout: 30000 }, async () => {
  const { context, page, chart } = await open()
  try {
    assert.equal(await paints(page), 0, 'far from the viewport the chart paints nothing')
    await chart.evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY - innerHeight * 1.5))
    await page.waitForTimeout(300)
    assert.equal(await paints(page) > 0, true, 'a screen ahead it paints its armed bars')
    const armed = await paints(page)
    await page.waitForTimeout(400)
    assert.equal(await paints(page), armed, 'an armed chart offscreen requests no frames')
    // Leaving mid-run stops the frames; a hidden tab does too.
    await chart.evaluate(element => element.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(300)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(150)
    const away = await paints(page)
    await page.waitForTimeout(400)
    assert.equal(await paints(page), away, 'no frames while the chart is off screen')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await chart.evaluate(element => element.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(150)
    const hidden = await paints(page)
    await page.waitForTimeout(400)
    assert.equal(await paints(page), hidden, 'no frames in a hidden tab')
    await page.evaluate(() => {
      delete document.hidden
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const rows = await settle(page)
    assert.deepEqual(rows.map(row => row.text), measured('brotliBytes').map(row => row.size))
    // At rest: no frames and no running animation anywhere in the section, the satin included.
    await page.waitForTimeout(500)
    const rest = await paints(page)
    await page.waitForTimeout(1000)
    assert.equal(await paints(page), rest, 'the settled chart requests no frames')
    const running = await page.evaluate(() => document.getAnimations()
      .filter(animation => document.querySelector('#css-cost').contains(animation.effect?.target) && animation.playState === 'running')
      .map(animation => animation.animationName ?? animation.transitionProperty))
    assert.deepEqual(running, [])
  } finally {
    await context.close()
  }
})

test(`${browserName}: changing the measure animates the bars to the other data and settles there`, { timeout: 30000 }, async () => {
  const { context, page, errors, chart } = await open()
  try {
    await chart.evaluate(element => element.scrollIntoView({ block: 'center' }))
    await settle(page)
    await page.locator('#css-cost').getByRole('button', { name: 'Raw' }).click()
    await page.waitForTimeout(200)
    const moving = await readRows(page)
    const brotli = new Map(measured('brotliBytes').map(row => [row.name, row.size]))
    const raw = new Map(measured('rawBytes').map(row => [row.name, row.size]))
    assert.ok(moving.some(row => row.text !== brotli.get(row.name) && row.text !== raw.get(row.name)), `counts move between the two measures: ${moving.map(row => row.text)}`)
    assert.ok(moving.every(row => !row.settled && !row.ratio), 'ratios step aside while the bars move')
    const settled = await settle(page)
    assert.deepEqual(settled.map(row => row.name), measured('rawBytes').map(row => row.name), 'rows take their new ranks')
    assert.deepEqual(settled.map(row => row.text), measured('rawBytes').map(row => row.size))
    for (const row of settled) assert.ok(Math.abs(row.bar - row.expected) <= 2, `${row.name} settles at its raw length`)
    assert.deepEqual(errors, [])
  } finally {
    await context.close()
  }
})

if (browserName === 'chromium') {
  test(`${browserName}: forced colors keep every bar visible at its measured length`, { timeout: 30000 }, async () => {
    const { context, page, chart } = await open({ forced: 'active', scheme: 'dark' })
    try {
      await chart.evaluate(element => element.scrollIntoView({ block: 'center' }))
      for (const row of await settle(page)) assert.ok(Math.abs(row.bar - row.expected) <= 2, `${row.name} is painted in a system color`)
    } finally {
      await context.close()
    }
  })
}
