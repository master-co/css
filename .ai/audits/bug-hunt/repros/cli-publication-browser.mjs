import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../package.json', import.meta.url))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const built = Boolean(process.env.BH_CLI_BUILT)
const cli = join(root, built ? 'packages/cli/dist/bin/index.js' : 'packages/cli/src/bin/index.ts')
const cwd = mkdtempSync(join(tmpdir(), 'master-css-publication-browser-'))
const directory = join(cwd, 'dist')
const browsers = []
const records = []
const image = color => `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="${color}"/></svg>`
const run = () => spawnSync(process.execPath, [...(built ? [] : ['--import', require.resolve('tsx')]), cli, 'generate', '--output', 'dist/output.css', '--verbose', '0'], {
  cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') }
})
const snapshot = () => Object.fromEntries(readdirSync(directory).map(file => [file, readFileSync(join(directory, file)).toString('base64')]))
const prepare = color => {
  writeFileSync(join(cwd, 'entry.css'), "@import './child.css';@master entry;")
  writeFileSync(join(cwd, 'child.css'), `.example{color:${color};background-image:url('./image.svg')}`)
  writeFileSync(join(cwd, 'image.svg'), image(color))
  writeFileSync(join(cwd, 'index.html'), '<!doctype html><link rel="stylesheet" href="/dist/output.css"><div class="example block">test</div>')
}
async function observe(stage, color, resourceColor, previousEntry) {
  for (const [name, browser] of browsers) {
    const page = await browser.newPage()
    const requests = []
    try {
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        const file = url.pathname === '/' ? join(cwd, 'index.html') : join(cwd, decodeURIComponent(url.pathname))
        const status = existsSync(file) ? 200 : 404
        const bytes = previousEntry && url.pathname === '/dist/output.css'
          ? Buffer.from(previousEntry, 'base64') : status === 200 ? readFileSync(file) : Buffer.from('missing')
        requests.push({ path: url.pathname, status, ...(file.endsWith('.svg') ? { body: bytes.toString() } : {}) })
        return route.fulfill({ status, contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/css', body: bytes })
      })
      await page.goto('http://publication.test/', { waitUntil: 'networkidle' })
      const actual = await page.locator('.example').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundImage }))
      assert.equal(actual.color, color)
      assert(requests.every(request => request.status === 200))
      assert(requests.some(request => request.path.endsWith('.svg') && request.body === image(resourceColor)))
      const record = { stage, browser: name, actual, requests, result: 'PASS' }
      records.push(record); console.log(JSON.stringify(record))
    } finally { await page.close() }
  }
}
try {
  prepare('red')
  const first = run(); assert.equal(first.status, 0, first.stderr)
  const before = snapshot()
  for (const name of ['chromium', 'firefox', 'webkit']) browsers.push([name, await engines[name].launch()])
  await observe('initial', 'rgb(255, 0, 0)', 'red')
  prepare('blue')
  chmodSync(directory, 0o555)
  const failed = run(); assert.notEqual(failed.status, 0); assert.match(failed.stderr, /EACCES|EPERM/)
  assert.deepEqual(snapshot(), before)
  await observe('publication-failed', 'rgb(255, 0, 0)', 'red')
  chmodSync(directory, 0o755)
  const retry = run(); assert.equal(retry.status, 0, retry.stderr)
  const after = snapshot()
  assert.notEqual(after['output.css'], before['output.css'])
  for (const [file, bytes] of Object.entries(before)) if (file !== 'output.css' && !file.endsWith('.master-css.json')) assert.equal(after[file], bytes)
  await observe('retried', 'rgb(0, 0, 255)', 'blue')
  // A reader that already obtained the old entry must still load its dependencies.
  await observe('previous-entry-after-success', 'rgb(255, 0, 0)', 'red', before['output.css'])
  const repeat = run(); assert.equal(repeat.status, 0, repeat.stderr)
  assert.deepEqual(snapshot(), after)
  console.log(JSON.stringify({ built, comparisons: records.length, failures: 0, oldBytesPreserved: true, unchangedRetryBytes: true, failure: failed.stderr, retainedOldAssets: Object.keys(before).filter(file => file !== 'output.css' && !file.endsWith('.master-css.json')), output: Object.fromEntries(Object.entries(after).filter(([file]) => !file.endsWith('.master-css.json'))) }))
} finally {
  for (const [, browser] of browsers) await browser.close()
  if (existsSync(directory)) chmodSync(directory, 0o755)
  rmSync(cwd, { recursive: true, force: true })
}
