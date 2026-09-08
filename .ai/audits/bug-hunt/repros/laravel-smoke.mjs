import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
const php = '/Users/aron/.config/herd-lite/bin/php'
const env = { ...process.env, APP_ENV: 'testing', APP_KEY: 'base64:QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE=', SESSION_DRIVER: 'array', CACHE_STORE: 'array', DB_CONNECTION: 'sqlite', DB_DATABASE: ':memory:' }
writeFileSync('.env', 'APP_ENV=testing\n') // disposable copy only; never copy user secrets
for (const [command, args] of [['pnpm', ['run', 'build:ssr']], ...(process.env.BH_BROWSER_MATRIX ? [] : [[php, ['artisan', 'test', '--display-warnings']]])]) {
 const result = spawnSync(command, args, { env, stdio: 'inherit' }); assert.equal(result.status, 0)
}
const net = createServer(); await new Promise(r => net.listen(0, '127.0.0.1', r)); const port = net.address().port; await new Promise(r => net.close(r))
const child = spawn(php, ['-S', `127.0.0.1:${port}`, resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: resolve('public'), env, stdio: 'ignore' })
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browserTypes = require('@playwright/test'); const { expect } = browserTypes; let browser
try {
 for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) break } catch {} await new Promise(r => setTimeout(r, 100)) }
 for (const name of (process.env.BH_BROWSER_MATRIX || 'chromium').split(',')) {
  assert(['chromium', 'firefox', 'webkit'].includes(name))
  browser = await browserTypes[name].launch(); const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message))
  const response = await page.goto(`http://127.0.0.1:${port}`); assert.equal(response.status(), 200)
  await expect(page.locator('h1')).toContainText('Hello World')
  await expect(page.locator('h1')).toHaveCSS('font-size', '48px')
  await page.goto(`http://127.0.0.1:${port}/login`); await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible()
  assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: name, version: browser.version(), cssFont: '48px', loginVisible: true, errors }))
  await browser.close(); browser = undefined
 }
} finally { if (browser) await browser.close(); child.kill('SIGTERM') }
