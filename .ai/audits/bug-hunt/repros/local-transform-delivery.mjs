import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { transformStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'

const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const engines = require('@playwright/test')
const baseManifest = createRequire(new URL('../../../../packages/compiler/package.json', import.meta.url))('@master/css-preset/default-manifest.json')
const rows = []
for (const supported of [true, false]) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'local-delivery-browser-')))
  const assets = new Map(), browsers = []
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    const asset = assets.get(pathname)
    response.writeHead(asset ? 200 : 404, { 'Content-Type': asset?.type ?? 'text/plain' })
    response.end(asset?.body ?? 'Missing')
  })
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    writeFileSync(child, '@import "/external.css";@utilities{paint{color:blue}}.child{@compose p:2rem;background-image:url(pixel.svg?q=1#part)}')
    writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>')
    const source = `@import "./child.css" layer(guard) supports(display:${supported ? 'grid' : 'not-a-real-display'}) screen and (min-width:700px);.root{@compose block paint;}`
    const result = await transformStylesheet(entry, source, { baseManifest, projectDir: root, delivery: {
      entryURL: '/assets/entry.css', stylesheetURL: file => '/assets/' + basename(file), resourceURL: file => '/assets/' + basename(file)
    } })
    assets.set('/assets/entry.css', { type: 'text/css', body: result.code })
    for (const asset of result.stylesheets ?? []) assets.set(asset.href, { type: 'text/css', body: asset.css })
    for (const asset of result.resources ?? []) assets.set(asset.href, { type: 'image/svg+xml', body: readFileSync(asset.file) })
    assets.set('/external.css', { type: 'text/css', body: '.child{border-left:7px solid black}' })
    assets.set('/', { type: 'text/html', body: '<!doctype html><link rel="stylesheet" href="/assets/entry.css"><div class="root">root</div><div class="child">child</div>' })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[name].launch({ headless: true }); browsers.push(browser)
      const page = await browser.newPage(), errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
      await page.goto(origin)
      for (const width of [900, 500, 900]) {
        await page.setViewportSize({ width, height: 600 })
        const active = supported && width >= 700
        await page.waitForFunction(active => getComputedStyle(document.querySelector('.child')).paddingTop === (active ? '32px' : '0px'), active)
        const value = await page.evaluate(() => {
          const root = getComputedStyle(document.querySelector('.root')), child = getComputedStyle(document.querySelector('.child'))
          return { color: root.color, display: root.display, padding: child.paddingTop, border: child.borderLeftWidth, background: child.backgroundImage }
        })
        assert.equal(value.color, 'rgb(0, 0, 255)'); assert.equal(value.display, 'block')
        assert.equal(value.border, active ? '7px' : '0px')
        if (active) {
          const url = value.background.match(/url\(["']?(.*?)["']?\)/)?.[1]; assert.ok(url)
          assert.ok(url.endsWith('?q=1#part'))
          const response = await page.request.get(url); assert.equal(response.status(), 200)
          assert.ok(response.headers()['content-type'].includes('image/svg+xml'))
          const pixel = await page.evaluate(async url => {
            const image = new Image(); image.src = url; await image.decode()
            const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
            return [...context.getImageData(0, 0, 1, 1).data]
          }, url)
          assert.deepEqual(pixel, [255, 0, 0, 255])
        } else assert.equal(value.background, 'none')
        assert.deepEqual(errors, [])
        const row = { supported, browser: name, width, value, errors: [...errors], result: 'PASS' }
        rows.push(row); console.log(JSON.stringify(row))
      }
      await page.close()
    }
  } finally {
    for (const browser of browsers) await browser.close()
    await new Promise(resolve => server.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ observations: rows.length, failures: 0 }))
