import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createServer, type ServerResponse } from 'node:http'

const runtimeScript = readFileSync(new URL('../dist/global.min.js', import.meta.url))
const defaultProgram = readFileSync(new URL('../dist/default-program.bin', import.meta.url))

for (const [scriptURL, programURL] of [
  ['https://cdn.master.co/css-runtime@rc', 'https://cdn.jsdelivr.net/npm/@master/css-runtime@rc/dist/default-program.bin'],
  ['https://cdn.master.co/css-runtime@2.0.0/', 'https://cdn.jsdelivr.net/npm/@master/css-runtime@2.0.0/dist/default-program.bin'],
  ['https://cdn.jsdelivr.net/npm/@master/css-runtime@2.0.0', 'https://cdn.jsdelivr.net/npm/@master/css-runtime@2.0.0/dist/default-program.bin'],
  ['https://assets.example/css-runtime@2.0.0', 'https://assets.example/css-runtime@2.0.0/default-program.bin'],
  ['https://assets.example/css-runtime', 'https://assets.example/css-runtime/default-program.bin'],
  ['https://assets.example/css-runtime/', 'https://assets.example/css-runtime/default-program.bin'],
  ['https://assets.example/runtime/global.min.js?cache=1#runtime', 'https://assets.example/runtime/default-program.bin'],
  ['https://assets.example/runtime/', 'https://assets.example/runtime/default-program.bin'],
  ['https://assets.example/runtime', 'https://assets.example/runtime/default-program.bin']
]) {
  test(`loads the matching program for ${scriptURL}`, async ({ page }) => {
    const programRequests: string[] = []
    await page.route('https://**/*', route => {
      const requestURL = new URL(route.request().url())
      const expectedScriptURL = new URL(scriptURL)
      expectedScriptURL.hash = ''
      if (requestURL.href === expectedScriptURL.href) {
        return route.fulfill({ contentType: 'text/javascript', body: runtimeScript })
      }
      programRequests.push(requestURL.href)
      return route.fulfill({
        status: requestURL.href === programURL ? 200 : 404,
        contentType: 'application/octet-stream',
        headers: { 'access-control-allow-origin': '*' },
        body: defaultProgram
      })
    })
    await page.setContent('<html hidden><head></head><body><h1 class="font-5xl">Hello World</h1></body></html>')
    await page.addScriptTag({ url: scriptURL })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
    expect(programRequests).toEqual([programURL])
    await expect(page.locator('h1')).toHaveCSS('font-size', '40px')
    expect(await page.locator('html').getAttribute('hidden')).toBeNull()
  })
}

for (const failure of ['http', 'invalid-program', 'timeout'] as const) {
  test(`reveals content when the default program fails: ${failure}`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await page.route('https://assets.example/runtime/global.min.js', route => route.fulfill({ contentType: 'text/javascript', body: runtimeScript }))
    await page.route('https://assets.example/runtime/default-program.bin', async route => {
      if (failure === 'timeout') return
      await route.fulfill({
        status: failure === 'http' ? 404 : 200,
        headers: { 'access-control-allow-origin': '*' },
        body: 'invalid program'
      })
    })
    await page.setContent('<html hidden><head></head><body><h1>Hello World</h1></body></html>')
    await page.addScriptTag({ url: 'https://assets.example/runtime/global.min.js' })
    await expect(page.locator('html')).not.toHaveAttribute('hidden', '', { timeout: 5000 })
    expect(await page.evaluate(() => Boolean(globalThis.masterCSSRuntime))).toBe(false)
    expect(errors.length).toBeGreaterThan(0)
  })
}

test('keeps streamed HTML hidden until all initial classes can be rendered', async ({ page }) => {
  let documentResponse: ServerResponse | undefined
  let programRequests = 0
  const server = createServer((request, response) => {
    if (request.url === '/runtime/global.min.js') {
      response.writeHead(200, { 'content-type': 'text/javascript' }).end(runtimeScript)
    } else if (request.url === '/runtime/default-program.bin') {
      programRequests++
      response.writeHead(200, { 'content-type': 'application/octet-stream' }).end(defaultProgram)
    } else if (request.url === '/') {
      documentResponse = response
      response.writeHead(200, { 'content-type': 'text/html' })
      // Firefox buffers small initial responses before committing navigation.
      response.write('<!doctype html><html hidden><head><script src="/runtime/global.min.js"></script></head><body><!--' + ' '.repeat(2048) + '-->')
    } else response.writeHead(404).end()
  })
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing streaming fixture address')
    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'commit' })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().engine === 'ready')
    expect(programRequests).toBe(1)
    expect(await page.evaluate(() => ({
      readyState: document.readyState,
      hidden: document.documentElement.hasAttribute('hidden'),
      observing: globalThis.masterCSSRuntime!.snapshot().observing
    }))).toEqual({ readyState: 'loading', hidden: true, observing: false })

    // Capture the first visible state, before any animation-frame mutation work.
    await page.evaluate(() => {
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute('hidden')) return
        const heading = document.querySelector('h1')
        Object.assign(globalThis, { firstVisibleHeading: heading && getComputedStyle(heading).fontSize })
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['hidden'] })
    })
    documentResponse!.end('<h1 class="font-5xl">Hello World</h1></body></html>')
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.snapshot().observing)
    expect(await page.locator('html').getAttribute('hidden')).toBeNull()
    expect(await page.evaluate(() => (globalThis as typeof globalThis & { firstVisibleHeading: string }).firstVisibleHeading)).toBe('40px')
    await expect(page.locator('h1')).toHaveCSS('font-size', '40px')
    await page.locator('h1').evaluate(element => element.className = 'font-6xl')
    await expect(page.locator('h1')).toHaveCSS('font-size', '48px')
  } finally {
    documentResponse?.end()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
