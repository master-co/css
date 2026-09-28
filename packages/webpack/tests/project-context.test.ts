import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import webpack from 'webpack'
import { expect, test } from 'vitest'
import Plugin from '../dist/index.js'

test('css-loader Modules reference theme tokens while native keyframes require an import', async () => {
  const root = mkdtempSync(join(tmpdir(), 'webpack-project-context-'))
  const require = createRequire(new URL('../../../examples/webpack/package.json', import.meta.url))
  const compiler = webpack({
    mode: 'production', context: root, entry: './main.js', resolve: { tsconfig: false },
    output: { path: join(root, 'out'), filename: 'main.js' },
    module: { rules: [{ test: /\.css$/, use: [require.resolve('style-loader'), { loader: require.resolve('css-loader'), options: { modules: { auto: true, namedExport: false } } }] }] },
    plugins: [new Plugin({ mode: 'static', runtime: false }, root)]
  })
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  const server = createServer((request, response) => {
    response.setHeader('content-type', request.url === '/main.js' ? 'text/javascript' : 'text/html')
    response.end(request.url === '/main.js' ? readFileSync(join(root, 'out/main.js')) : '<!doctype html><body><script src="/main.js"></script></body>')
  })
  try {
    writeFileSync(join(root, 'app.css'), "@import \"@master/css\";@theme { :root, :host {--color-brand:#123456;} }\n@keyframes pop{from{opacity:.5}to{opacity:.5}}\n.never{color:red}")
    writeFileSync(join(root, 'card.module.css'), '.card{color:var(--color-brand);animation:pop 1s linear infinite;--local:3px;padding:var(--local)}.other{animation:own 1s linear infinite}@keyframes own{from{opacity:.75}to{opacity:.75}}')
    writeFileSync(join(root, 'main.js'), 'import styles from "./card.module.css";document.body.innerHTML=`<div id="card" class="${styles.card}">Card</div><div id="other" class="${styles.other}">Other</div>`')
    await new Promise<void>((resolve, reject) => compiler.run((error, stats) => {
      if (error || !stats || stats.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })))
      else resolve()
    }))
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server address')
    browser = await chromium.launch()
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`http://127.0.0.1:${address.port}`)
    expect(errors).toEqual([])
    const styles = () => page.locator('#card').evaluate(element => {
      const style = getComputedStyle(element)
      return { color: style.color, opacity: style.opacity, padding: style.padding }
    })
    await expect.poll(styles).toEqual({ color: 'rgb(18, 52, 86)', opacity: '1', padding: '3px' })
    await expect.poll(() => page.locator('#other').evaluate(element => getComputedStyle(element).opacity)).toBe('0.75')
    await page.evaluate(() => document.documentElement.style.setProperty('--color-brand', 'white'))
    expect((await styles()).color).toBe('rgb(255, 255, 255)')
    expect(await page.locator('style').allTextContents()).not.toEqual(expect.arrayContaining([expect.stringContaining('.never')]))
    expect(errors).toEqual([])
  } finally {
    await browser?.close()
    server.closeAllConnections()
    if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
