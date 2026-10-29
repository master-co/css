/** Capture the complete route inventory against one frozen preview, with resumable evidence. */
import { chromium, webkit } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const siteRoot = fileURLToPath(new URL('../', import.meta.url))
const evidence = path.join(siteRoot, 'test-results/interior-redesign')
const base = process.env.MASTER_SWEEP_URL
const label = process.env.MASTER_SWEEP_LABEL
if (!base || !label || !/^[a-z0-9-]+$/.test(label)) throw new Error('Set MASTER_SWEEP_URL and a lowercase MASTER_SWEEP_LABEL.')
const inventory = JSON.parse(await readFile(path.join(evidence, 'inventory.json'), 'utf8'))
const match = process.env.MASTER_SWEEP_MATCH && new RegExp(process.env.MASTER_SWEEP_MATCH)
const routes = inventory.routes.filter(route => !match || match.test(route.pathname))
const engines = (process.env.MASTER_SWEEP_ENGINES ?? 'chromium,webkit').split(',')
const widths = (process.env.MASTER_SWEEP_WIDTHS ?? '320,390,768,1280,1440').split(',').map(Number)
const schemes = (process.env.MASTER_SWEEP_SCHEMES ?? 'light,dark').split(',')
const limit = Number(process.env.MASTER_SWEEP_LIMIT ?? Infinity)
const force = process.env.MASTER_SWEEP_FORCE === '1'
const staticDelivery = process.env.MASTER_SWEEP_DELIVERY === 'static'
const output = path.join(evidence, label)
const started = Date.now()
const results = []
let completed = 0
let reused = 0
let failures = 0
await mkdir(output, { recursive: true })

async function saveJSON(file, value) {
  await writeFile(`${file}.tmp`, JSON.stringify(value, null, 2) + '\n')
  await rename(`${file}.tmp`, file)
}

async function readJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')) } catch { return null }
}

function hasFailure(result) {
  // Working HTML specimens can legitimately contain their own h1 alongside the page title.
  return !!(result.failure || result.status !== result.expectedStatus || result.metrics?.overflow || result.errors?.length || result.metrics?.brokenImages?.length || (result.section !== 'examples' && !result.metrics?.headings.length))
}

async function visitContent(page) {
  let y = 0
  let screens = 0
  let height = await page.evaluate(() => document.documentElement.scrollHeight)
  while (y < height && screens < 100) {
    await page.evaluate(top => window.scrollTo(0, top), y)
    // Give viewport-owned enhancements a rendering turn before leaving their scene.
    await page.waitForTimeout(50)
    height = await page.evaluate(() => document.documentElement.scrollHeight)
    y += 850
    screens++
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo(0, 0))
  return { screens, height, bounded: screens === 100 && y < height }
}

async function measure(page) {
  return page.evaluate(() => {
    const visible = element => !!element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden'
    const box = selector => {
      const element = document.querySelector(selector)
      if (!element || !visible(element)) return null
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, paddingInlineStart: style.paddingInlineStart, paddingInlineEnd: style.paddingInlineEnd }
    }
    const main = document.querySelector('main')
    const controls = [...document.querySelectorAll('button, input:not([type="hidden"]), select, textarea')].filter(visible)
    const possibleUnnamedControls = controls.filter(element => {
      if (element.getAttribute('aria-hidden') === 'true') return false
      const namedBy = element.getAttribute('aria-labelledby')?.split(/\s+/).map(id => document.getElementById(id)?.textContent ?? '').join(' ')
      const labels = [...element.labels ?? []].map(label => label.textContent).join(' ')
      return !(element.getAttribute('aria-label') || namedBy || labels || element.getAttribute('title') || element.textContent?.trim() || element.getAttribute('alt'))
    }).map(element => ({ tag: element.tagName, type: element.getAttribute('type'), className: element.className, inSpecimen: !!element.closest('.site-demo, [data-demo-container], .demo') }))
    const nativeHome = document.querySelector('.home-page')
    return {
      title: document.title,
      language: document.documentElement.lang,
      headings: [...document.querySelectorAll('h1')].map(element => element.textContent.trim()),
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      columns: { article: box('article.prose'), sidebar: box('#sidebar'), contents: box('.doc-page-contents') },
      main: box('main'),
      ids: [...document.querySelectorAll('[id]')].map(element => element.id),
      links: [...document.querySelectorAll('a[href]')].filter(element => !element.closest('.site-demo, [data-demo-container]')).map(element => ({ href: element.getAttribute('href'), text: element.textContent.trim().slice(0, 120) })),
      brokenImages: [...document.querySelectorAll('img')].filter(element => visible(element) && element.complete && !element.naturalWidth).map(element => element.getAttribute('src')),
      possibleUnnamedControls,
      iframeCount: document.querySelectorAll('iframe').length,
      fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => ({ family: font.family, weight: font.weight })),
      homeStyles: nativeHome ? [...nativeHome.querySelectorAll('section, h1, h2, h3, p, a, button')].map(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return { tag: element.tagName, className: element.className, text: element.textContent.trim().slice(0, 80), x: rect.x, width: rect.width, font: style.font, color: style.color, background: style.backgroundColor, shadow: style.boxShadow, border: style.border, padding: style.padding }
      }) : undefined,
      bodyClass: document.body.className,
      mainText: main?.textContent.trim().slice(0, 300),
    }
  })
}

matrix: for (const engine of engines) {
  const browser = await ({ chromium, webkit })[engine].launch()
  try {
    for (const width of widths) for (const scheme of schemes) {
      const directory = path.join(output, engine, `${width}-${scheme}`)
      await mkdir(directory, { recursive: true })
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', colorScheme: scheme, deviceScaleFactor: 1 })
      let page = await context.newPage()
      let errors = []
      let resourceFailures = []
      const listen = current => {
        current.on('pageerror', error => errors.push(error.message))
        current.on('response', response => {
          if (response.status() >= 400 && response.request().resourceType() !== 'document' && response.url().startsWith(base)) resourceFailures.push({ status: response.status(), url: response.url().slice(base.length) })
        })
      }
      listen(page)
      try {
        for (const route of routes) {
          if (completed >= limit) break matrix
          // A named /404 HTML resource is 200 in static preview; missing paths must still be 404.
          const expectedStatus = staticDelivery && route.pathname === '/404' ? 200 : route.expectedStatus
          const key = createHash('sha256').update(route.pathname).digest('hex').slice(0, 14)
          const file = path.join(directory, `${route.section}-${key}.json`)
          const cached = force ? null : await readJSON(file)
          if (cached?.complete && cached.base === base && cached.pathname === route.pathname && cached.expectedStatus === expectedStatus) { reused++; if (hasFailure(cached)) failures++; results.push(cached); continue }
          const began = Date.now()
          errors = []; resourceFailures = []
          let result = { ...route, expectedStatus, delivery: staticDelivery ? 'static' : 'development', engine, width, scheme, base, label, capturedAt: new Date().toISOString() }
          try {
            const response = await page.goto(`${base}${route.pathname}`, { waitUntil: 'networkidle', timeout: 60000 })
            await page.evaluate(() => document.fonts.ready)
            await page.mouse.move(-1, -1)
            const visit = await visitContent(page)
            const metrics = await measure(page)
            const image = path.basename(file, '.json') + '.png'
            await page.screenshot({ path: path.join(directory, image) })
            let fullImage
            if ([390, 1440].includes(width) && metrics.height <= 32000) {
              fullImage = path.basename(file, '.json') + '-full.png'
              await page.screenshot({ path: path.join(directory, fullImage), fullPage: true })
            }
            result = { ...result, status: response.status(), visit, metrics, image, fullImage, errors: [...errors], resourceFailures: [...resourceFailures], durationMs: Date.now() - began, complete: true }
          } catch (error) {
            result = { ...result, failure: error.message, errors: [...errors], resourceFailures: [...resourceFailures], durationMs: Date.now() - began, complete: true }
            await page.screenshot({ path: file.replace(/\.json$/, '-error.png') }).catch(() => {})
            await page.close().catch(() => {})
            page = await context.newPage()
            listen(page)
          }
          if (hasFailure(result)) failures++
          await saveJSON(file, result)
          results.push(result)
          completed++
          await saveJSON(path.join(output, 'progress.json'), { label, base, startedAt: new Date(started).toISOString(), elapsedMs: Date.now() - started, completed, reused, failures, totalPlanned: routes.length * engines.length * widths.length * schemes.length, last: { pathname: route.pathname, engine, width, scheme }, lastCompletedAt: new Date().toISOString() })
          if (completed % 10 === 0 || result.failure) console.log(JSON.stringify({ label, completed, reused, failures, route: route.pathname, engine, width, scheme, elapsedMinutes: Math.round((Date.now() - started) / 6000) / 10 }))
        }
      } finally { await context.close() }
    }
  } finally { await browser.close() }
}

await saveJSON(path.join(output, 'summary.json'), { label, base, startedAt: new Date(started).toISOString(), completedAt: new Date().toISOString(), elapsedMs: Date.now() - started, completed, reused, failures, totalRecords: results.length })
console.log(JSON.stringify({ label, completed, reused, failures, elapsedMinutes: Math.round((Date.now() - started) / 6000) / 10 }))
process.exitCode = failures ? 1 : 0
