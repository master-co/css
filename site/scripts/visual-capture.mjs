/**
 * Capture element or region screenshots of a running site for visual review.
 *
 * node site/scripts/visual-capture.mjs <url> --name hero --selector .home-hero
 *   [--scheme light,dark] [--width 1440] [--height 900] [--dpr 2] [--pad 24] [--nth 0]
 *   [--clip x,y,w,h] [--frames 0,400,1200] [--wait 1500] [--ready <selector>]
 *   [--pointer x,y] [--hover <selector>] [--hide <selector>] [--reduced-motion]
 *   [--measure <selector,...>] [--props color,font-size] [--eval <expression>] [--out <dir>]
 *
 * Captures stay PNG at the requested device scale so material, gradient and hairline
 * detail survives; crop to the region under review instead of shrinking the image.
 * Viewed images are resized to a 2000px long edge, so a capture warns when it exceeds it.
 * Prints JSON with each file, its pixel size and approximate image tokens, requested
 * measurements and page errors, so numeric checks can run before an image is opened.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const site = fileURLToPath(new URL('..', import.meta.url))
const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string', default: 'capture' },
    out: { type: 'string', default: path.join(site, 'test-results/visual') },
    selector: { type: 'string' },
    nth: { type: 'string', default: '0' },
    pad: { type: 'string', default: '24' },
    clip: { type: 'string' },
    scheme: { type: 'string', default: 'light' },
    width: { type: 'string', default: '1440' },
    height: { type: 'string', default: '900' },
    dpr: { type: 'string', default: '2' },
    frames: { type: 'string', default: '0' },
    wait: { type: 'string', default: '1500' },
    ready: { type: 'string' },
    pointer: { type: 'string' },
    hover: { type: 'string' },
    hide: { type: 'string', multiple: true, default: [] },
    'reduced-motion': { type: 'boolean', default: false },
    measure: { type: 'string' },
    props: { type: 'string', default: '' },
    eval: { type: 'string' },
  },
})
const [url] = positionals
if (!url) throw new Error('Pass the page URL, for example http://localhost:3000/.')
if (!/^[\w.-]+$/.test(options.name)) throw new Error('--name may contain letters, numbers, dots, underscores and hyphens.')
const numbers = value => value.split(',').map(Number)
const width = Number(options.width)
const height = Number(options.height)
const dpr = Number(options.dpr)
const frames = numbers(options.frames)
const props = options.props.split(',').filter(Boolean)
await mkdir(options.out, { recursive: true })

// WebGL islands need the GPU path; headless Chromium otherwise falls back to a blank canvas.
const browser = await chromium.launch({
  args: ['--ignore-gpu-blocklist', '--enable-gpu', ...process.platform === 'darwin' ? ['--use-angle=metal'] : []],
})
const report = { url, captures: [], measurements: {}, evaluations: {}, errors: [], warnings: [] }
try {
  for (const scheme of options.scheme.split(',')) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      colorScheme: scheme,
      reducedMotion: options['reduced-motion'] ? 'reduce' : 'no-preference',
    })
    page.on('pageerror', error => report.errors.push(`${scheme}: ${error.message}`))
    page.on('console', message => message.type() === 'error' && report.errors.push(`${scheme}: ${message.text()}`))
    // The document head resolves the theme from this preference before first paint.
    await page.addInitScript(value => localStorage.setItem('theme-preference', value), scheme)
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })
    if (options.ready) await page.waitForSelector(options.ready, { state: 'attached', timeout: 60000 })
    // Use opacity rather than visibility: inline SVG logos share gradient ids with the header copy.
    for (const selector of options.hide) await page.addStyleTag({ content: `${selector}{opacity:0!important}` })
    const target = options.selector ? page.locator(options.selector).nth(Number(options.nth)) : null
    if (target) await target.scrollIntoViewIfNeeded()
    if (options.hover) await page.hover(options.hover)
    if (options.pointer) {
      const [x, y] = numbers(options.pointer)
      const origin = target ? await target.boundingBox() : { x: 0, y: 0 }
      await page.mouse.move(origin.x + x - 120, origin.y + y - 40)
      await page.mouse.move(origin.x + x, origin.y + y, { steps: 8 })
    }
    await page.waitForTimeout(Number(options.wait))
    if (options.measure) {
      report.measurements[scheme] = await page.evaluate(([selectors, names]) => Object.fromEntries(selectors.map(selector => [selector, [...document.querySelectorAll(selector)].slice(0, 8).map(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, ...Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)])) }
      })])), [options.measure.split(','), props])
    }
    if (options.eval) report.evaluations[scheme] = await page.evaluate(options.eval)
    let elapsed = 0
    for (const [index, time] of frames.entries()) {
      await page.waitForTimeout(Math.max(0, time - elapsed))
      elapsed = Math.max(elapsed, time)
      let clip
      if (options.clip) {
        const [x, y, clipWidth, clipHeight] = numbers(options.clip)
        clip = { x, y, width: clipWidth, height: clipHeight }
      } else if (target) {
        const box = await target.boundingBox()
        if (!box) throw new Error(`${options.selector} has no visible box.`)
        const pad = Number(options.pad)
        const x = Math.max(0, box.x - pad)
        const y = Math.max(0, box.y - pad)
        clip = { x, y, width: Math.min(width - x, box.width + pad * 2), height: Math.min(height - y, box.height + pad * 2) }
        if (box.y + box.height > height) report.warnings.push(`${options.selector} is taller than the viewport; capture regions with --clip or a smaller selector.`)
      }
      const suffix = [scheme, frames.length > 1 ? `t${time}` : ''].filter(Boolean).join('-')
      const file = path.join(options.out, `${options.name}-${suffix}.png`)
      await page.screenshot({ path: file, clip })
      const pixels = { width: Math.round((clip?.width ?? width) * dpr), height: Math.round((clip?.height ?? height) * dpr) }
      // Image input is resized to a 2000px long edge; detail beyond it is never seen.
      const scale = Math.min(1, 2000 / Math.max(pixels.width, pixels.height))
      if (scale < 1) report.warnings.push(`${path.basename(file)} is resized to ${Math.round(scale * 100)}% when viewed; split the region into crops of at most ${Math.floor(2000 / dpr)} CSS px to keep full detail.`)
      report.captures.push({ file, scheme, time: frames.length > 1 ? time : undefined, ...pixels, approxTokens: Math.ceil(pixels.width * pixels.height * scale * scale / 750) })
    }
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(report, null, 2))
