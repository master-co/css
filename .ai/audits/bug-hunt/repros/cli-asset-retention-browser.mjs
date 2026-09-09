import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../package.json', import.meta.url))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const built = Boolean(process.env.BH_CLI_BUILT)
const cli = join(root, built ? 'packages/cli/dist/bin/index.js' : 'packages/cli/src/bin/index.ts')
const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-retention-browser-'))
const directory = join(cwd, 'dist')
const browsers = []
const records = []
const day = 24 * 60 * 60 * 1000
const image = color => `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="${color}"/></svg>`
const prepare = color => {
  fs.writeFileSync(join(cwd, 'entry.css'), `@master entry;.example{color:${color};background-image:url('./image.svg')}`)
  fs.writeFileSync(join(cwd, 'image.svg'), image(color))
  fs.writeFileSync(join(cwd, 'index.html'), '<div class="example block">test</div>')
}
const run = (output, now) => {
  // Control only the CLI process clock; filesystem writes and the actual binary
  // remain real. This verifies retention thresholds without waiting a day.
  const script = `Date.now = () => ${now}; process.argv = [process.execPath, ${JSON.stringify(cli)}, 'generate', '--output', ${JSON.stringify(`dist/${output}`)}, '--verbose', '0']; await import(${JSON.stringify(pathToFileURL(cli).href)});`
  const result = spawnSync(process.execPath, [...(built ? [] : ['--import', require.resolve('tsx')]), '--input-type=module', '-e', script], { cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') } })
  assert.equal(result.status, 0, result.stderr)
}
const state = output => JSON.parse(fs.readFileSync(join(directory, `.${output}.master-css.json`), 'utf8'))
async function observe(stage, output, color, resourceColor, previousEntry) {
  for (const [name, browser] of browsers) {
    const page = await browser.newPage()
    const requests = []
    try {
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><link rel="stylesheet" href="/dist/${output}"><div class="example block">test</div>` })
        const file = join(cwd, decodeURIComponent(url.pathname))
        const status = fs.existsSync(file) ? 200 : 404
        const bytes = previousEntry && url.pathname === `/dist/${output}` ? previousEntry : status === 200 ? fs.readFileSync(file) : Buffer.from('missing')
        requests.push({ path: url.pathname, status, ...(file.endsWith('.svg') ? { body: bytes.toString() } : {}) })
        return route.fulfill({ status, contentType: file.endsWith('.svg') ? 'image/svg+xml' : 'text/css', body: bytes })
      })
      await page.goto('http://retention.test/', { waitUntil: 'networkidle' })
      const actual = await page.locator('.example').evaluate(el => getComputedStyle(el).color)
      assert.equal(actual, color)
      assert(requests.every(request => request.status === 200))
      assert(requests.some(request => request.body === image(resourceColor)))
      const record = { stage, browser: name, actual, requests, result: 'PASS' }
      records.push(record); console.log(JSON.stringify(record))
    } finally { await page.close() }
  }
}
try {
  prepare('red'); run('a.css', 0); run('b.css', 0)
  const redEntry = fs.readFileSync(join(directory, 'a.css'))
  const redAssets = state('a.css').current.assets
  const otherFiles = ['b.css', '.b.css.master-css.json', ...state('b.css').current.assets]
  const otherBytes = Object.fromEntries(otherFiles.map(file => [file, fs.readFileSync(join(directory, file)).toString('base64')]))
  for (const name of ['chromium', 'firefox', 'webkit']) browsers.push([name, await engines[name].launch()])
  await observe('initial', 'a.css', 'rgb(255, 0, 0)', 'red')
  prepare('blue'); run('a.css', 10)
  const blueEntry = fs.readFileSync(join(directory, 'a.css'))
  prepare('green'); run('a.css', 20)
  run('a.css', day + 9)
  for (const file of redAssets) assert(fs.existsSync(join(directory, file)))
  await observe('before-retention-expiry', 'a.css', 'rgb(255, 0, 0)', 'red', redEntry)
  const modified = redAssets.find(file => file.endsWith('.svg'))
  fs.writeFileSync(join(directory, modified), 'user-modified asset bytes')
  fs.writeFileSync(join(directory, 'master-a-unrelated.svg'), 'unrelated user bytes')
  run('a.css', day + 10)
  const removed = redAssets.filter(file => file !== modified)
  for (const file of removed) assert(!fs.existsSync(join(directory, file)))
  assert.equal(fs.readFileSync(join(directory, modified), 'utf8'), 'user-modified asset bytes')
  assert.equal(state('a.css').owned[modified], undefined)
  assert.equal(fs.readFileSync(join(directory, 'master-a-unrelated.svg'), 'utf8'), 'unrelated user bytes')
  for (const [file, bytes] of Object.entries(otherBytes)) assert.equal(fs.readFileSync(join(directory, file)).toString('base64'), bytes)
  await observe('current-after-cleanup', 'a.css', 'rgb(0, 128, 0)', 'green')
  await observe('previous-after-cleanup', 'a.css', 'rgb(0, 0, 255)', 'blue', blueEntry)
  await observe('other-output-preserved', 'b.css', 'rgb(255, 0, 0)', 'red')
  run('a.css', day * 30)
  await observe('previous-after-thirty-days', 'a.css', 'rgb(0, 0, 255)', 'blue', blueEntry)
  assert.equal(state('a.css').retained.length, 1)
  console.log(JSON.stringify({ built, comparisons: records.length, failures: 0, clock: 'controlled only in actual CLI child processes', removed, modifiedPreserved: modified, unrelatedPreserved: true, otherOutputBytesPreserved: true, previousGenerationRetained: true }))
} finally {
  for (const [, browser] of browsers) await browser.close()
  fs.rmSync(cwd, { recursive: true, force: true })
}
