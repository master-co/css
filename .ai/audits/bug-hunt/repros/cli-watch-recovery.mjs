import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../package.json', import.meta.url))
const engines = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cwd = mkdtempSync(join(tmpdir(), 'master-css-cli-recovery-browser-'))
const image = color => `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="${color}"/></svg>`
const html = classes => `<!doctype html><link rel="stylesheet" href="/dist/output.css"><div class="example ${classes}">test</div>`
writeFileSync(join(cwd, 'entry.css'), "@import './child.css';@master entry;")
writeFileSync(join(cwd, 'child.css'), ".example{color:red;background-image:url('./image.svg')}")
writeFileSync(join(cwd, 'image.svg'), image('red'))
writeFileSync(join(cwd, 'index.html'), html('block'))
const built = Boolean(process.env.BH_CLI_BUILT)
const cli = join(root, built ? 'packages/cli/dist/bin/index.js' : 'packages/cli/src/bin/index.ts')
const child = spawn(process.execPath, [...(built ? [] : ['--import', require.resolve('tsx')]), cli, 'generate', '--watch', '--output', 'dist/output.css', '--verbose', '0'], { cwd, env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') } })
let stderr = ''
child.stderr.on('data', chunk => { stderr += chunk })
child.stdout.resume()
const browsers = []
const records = []
const alive = () => child.exitCode === null && child.signalCode === null
const wait = async check => {
  const end = Date.now() + 10000
  while (!check() && alive() && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 25))
  assert(check(), stderr)
  assert(alive(), stderr)
}
const restarts = () => (stderr.match(/Restart watching source changes/g) || []).length
const failures = () => (stderr.match(/Cannot rebuild CSS:/g) || []).length
const files = () => Object.fromEntries(readdirSync(join(cwd, 'dist')).map(file => [file, readFileSync(join(cwd, 'dist', file)).toString('base64')]))
async function observe(stage, color, resourceColor) {
  for (const [name, browser] of browsers) {
    const page = await browser.newPage()
    const requests = []
    try {
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        const file = url.pathname === '/' ? join(cwd, 'index.html') : join(cwd, decodeURIComponent(url.pathname))
        const status = existsSync(file) ? 200 : 404
        const bytes = status === 200 ? readFileSync(file) : Buffer.from('missing')
        requests.push({ path: url.pathname, status, ...(file.endsWith('.svg') ? { body: bytes.toString() } : {}) })
        return route.fulfill({ status, contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/css', body: bytes })
      })
      await page.goto('http://watch-recovery.test/', { waitUntil: 'networkidle' })
      const actual = await page.locator('.example').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundImage }))
      assert.equal(actual.color, color)
      assert(requests.every(request => request.status === 200))
      const images = requests.filter(request => request.path.endsWith('.svg'))
      if (resourceColor) assert(images.some(request => request.body === image(resourceColor)))
      else { assert.equal(images.length, 0); assert.equal(actual.background, 'none') }
      const record = { stage, browser: name, actual, requests, result: 'PASS' }
      records.push(record); console.log(JSON.stringify(record))
    } finally { await page.close() }
  }
}
try {
  await wait(() => stderr.includes('Start watching source changes'))
  for (const name of ['chromium', 'firefox', 'webkit']) browsers.push([name, await engines[name].launch()])
  await observe('initial', 'rgb(255, 0, 0)', 'red')
  const before = files()
  rmSync(join(cwd, 'image.svg'))
  await wait(() => failures() >= 1)
  assert.deepEqual(files(), before)
  const errors = failures()
  writeFileSync(join(cwd, 'child.css'), ".example{color:blue;background-image:url('./image.svg')}")
  writeFileSync(join(cwd, 'index.html'), html('block fg:blue'))
  await wait(() => failures() > errors)
  assert.deepEqual(files(), before)
  await observe('missing-resource-and-further-edits', 'rgb(255, 0, 0)', 'red')
  const resets = restarts()
  writeFileSync(join(cwd, 'image.svg'), image('blue'))
  await wait(() => restarts() > resets)
  assert(readFileSync(join(cwd, 'dist/output.css'), 'utf8').includes('.fg\\:blue'))
  await observe('restored-without-process-restart', 'rgb(0, 0, 255)', 'blue')
  const currentResets = restarts()
  writeFileSync(join(cwd, 'entry.css'), '@master entry;.example{color:green}')
  await wait(() => restarts() > currentResets)
  await observe('import-removed', 'rgb(0, 128, 0)', undefined)
  const settled = restarts()
  writeFileSync(join(cwd, 'child.css'), '.example{color:purple}')
  await new Promise(resolve => setTimeout(resolve, 400))
  assert.equal(restarts(), settled, 'Removed dependency must not trigger resets')
  console.log(JSON.stringify({ built, comparisons: records.length, failures: 0, processSurvived: alive(), originalOutputPreservedOnPreparationFailure: true, removedDependencyUnwatched: true, retainedSidecars: readdirSync(join(cwd, 'dist')).filter(file => file.endsWith('.svg')), stderr }))
} finally {
  for (const [, browser] of browsers) await browser.close()
  if (alive()) {
    const exited = once(child, 'exit'); child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
    await exited; clearTimeout(timer)
  }
  rmSync(cwd, { recursive: true, force: true })
}
