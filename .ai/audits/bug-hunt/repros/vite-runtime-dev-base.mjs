import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const parent = fileURLToPath(new URL('../../../../packages/vite/tmp/', import.meta.url));mkdirSync(parent, { recursive: true })
const clients = [], rows = []
try {
  for (const name of ['chromium', 'firefox', 'webkit']) clients.push({ name, browser: await engines[name].launch() })
  for (const mode of ['runtime', 'progressive']) for (const base of ['/', '/base/', '/deep/base/', '', './', 'https://cdn.example.test/base/']) {
    const root = mkdtempSync(join(parent, 'runtime-dev-base-')), pages = []
    let server
    const css = color => `@master entry;@theme{--color-accent:${color}}`
    try {
      mkdirSync(join(root, 'nested'))
      const html = prefix => `<!doctype html><html><head><link rel="icon" href="data:,"></head><body><div id="target">test</div><script type="module" src="${prefix}client.js"></script></body></html>`
      writeFileSync(join(root, 'index.html'), html('./'))
      writeFileSync(join(root, 'nested/page.html'), html('../'))
      writeFileSync(join(root, 'client.js'), 'import "./style.css";window.bootID=crypto.randomUUID();window.ready=true')
      writeFileSync(join(root, 'style.css'), css('#123456'))
      server = await createServer({ root, base, configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      for (const client of clients) for (const route of ['', 'nested/page.html']) {
        const page = await client.browser.newPage(), errors = [], responses = []
        pages.push({ page, browser: client.name, route, errors, responses })
        page.on('pageerror', error => errors.push(error.message))
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
        page.on('response', response => { responses.push({ url: response.url(), status: response.status() });if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
        await page.goto(new URL(route, server.resolvedUrls.local[0]).href)
        await page.waitForFunction(() => window.ready)
        pages.at(-1).bootID = await page.evaluate(() => window.bootID)
      }
      for (const phase of ['initial', 'class-update', 'theme-update']) {
        if (phase === 'theme-update') writeFileSync(join(root, 'style.css'), css('#654321'))
        for (const item of pages) {
          const { page } = item
          const color = phase === 'theme-update' ? 'rgb(101, 67, 33)' : 'rgb(18, 52, 86)', padding = phase === 'initial' ? '2px' : '4px'
          let value, error
          try {
            if (phase !== 'theme-update') await page.evaluate(phase => { document.querySelector('#target').className = phase === 'initial' ? 'fg:accent p:0.125rem' : 'fg:accent p:0.25rem' }, phase)
            await page.waitForFunction(({ color, padding }) => { const s = getComputedStyle(document.querySelector('#target'));return s.color === color && s.paddingTop === padding }, { color, padding }, { timeout: 10000 })
            value = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('#target'));return { color: s.color, padding: s.paddingTop, bootID: window.bootID, scripts: [...document.scripts].filter(s => s.src.includes('virtual:master-css-runtime')).map(s => s.src), preloads: [...document.querySelectorAll('link[rel="modulepreload"]')].map(l => l.href), styles: document.querySelectorAll('style#master-css').length } })
            assert.equal(value.bootID, item.bootID);assert.equal(value.styles, 1);assert.equal(value.scripts.length, 1)
            const expected = new URL(server.config.base + '@id/__x00__virtual:master-css-runtime', server.resolvedUrls.local[0]).href
            assert.equal(value.scripts[0], expected)
            if (mode === 'runtime') assert.ok(value.preloads.includes(expected))
            assert.ok(item.responses.some(r => r.url === expected && r.status === 200))
            assert.deepEqual(item.errors, [])
          } catch (cause) { error = String(cause) }
          const row = { mode, base, resolvedBase: server.config.base, browser: item.browser, route: item.route, phase, value, errors: item.errors, error, result: error ? 'FAIL' : 'PASS' };rows.push(row);console.log(JSON.stringify(row))
        }
      }
    } finally { for (const { page } of pages) await page.close();await server?.close();rmSync(root, { recursive: true, force: true }) }
  }
} finally { for (const { browser } of clients) await browser.close() }
const summary = { observations: rows.length, failures: rows.filter(r => r.result === 'FAIL').length }
console.log(JSON.stringify(summary));assert.equal(summary.failures, 0)
