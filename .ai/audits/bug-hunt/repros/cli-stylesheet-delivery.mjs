import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../package.json', import.meta.url))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const cli = process.env.BH_CLI_BUILT ? join(root, 'packages/cli/dist/bin/index.js') : join(root, 'packages/cli/src/bin/index.ts')
const remote = "@import 'https://remote.test/external.css'"
const cases = [
  { id: 'local-control', source: "@import './styles/local.css';@master entry;", local: '.example{color:red}', color: 'rgb(255, 0, 0)' },
  { id: 'root-resource-control', source: "@import './styles/local.css';@master entry;", local: ".example{color:red;background-image:url('/styles/image.svg')}", color: 'rgb(255, 0, 0)', image: true },
  { id: 'external-only', source: `${remote};@master entry;`, color: 'rgb(0, 0, 255)' },
  { id: 'external-after-local', source: `@import './styles/local.css';${remote};@master entry;`, local: '.example{color:red}', color: 'rgb(0, 0, 255)' },
  { id: 'qualified-nested-external', source: "@import './styles/local.css' layer;@master entry;", local: `${remote};.example{color:red}`, color: 'rgb(255, 0, 0)' },
  { id: 'local-resource-owner', source: "@import './styles/local.css';@master entry;", local: ".example{color:red;background-image:url('./image.svg')}", color: 'rgb(255, 0, 0)', image: true }
]
const workspace = mkdtempSync(join(tmpdir(), 'master-css-bh-delivery-'))
const results = []
let failures = 0
try {
  for (const item of cases) {
    item.cwd = join(workspace, item.id)
    mkdirSync(join(item.cwd, 'styles'), { recursive: true })
    writeFileSync(join(item.cwd, 'entry.css'), item.source)
    writeFileSync(join(item.cwd, 'index.html'), '<div class="example block">test</div>')
    writeFileSync(join(item.cwd, 'styles/local.css'), item.local || '.example{color:red}')
    writeFileSync(join(item.cwd, 'styles/image.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="red"/></svg>')
    const child = spawnSync(process.execPath, [
      ...(process.env.BH_CLI_BUILT ? [] : ['--import', require.resolve('tsx')]),
      cli, 'generate', '--output', 'dist/output.css', '--verbose', '0'
    ], { cwd: item.cwd, encoding: 'utf8', timeout: 60000, env: { ...process.env, TSX_TSCONFIG_PATH: join(root, 'tsconfig.json') } })
    assert(!child.error, String(child.error))
    item.status = child.status
    item.stderr = child.stderr
    item.output = existsSync(join(item.cwd, 'dist/output.css')) ? readFileSync(join(item.cwd, 'dist/output.css'), 'utf8') : undefined
    console.log(JSON.stringify({ stage: 'cli', id: item.id, status: child.status, output: item.output, stderr: child.stderr }))
  }
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const item of cases) {
        const observed = {}
        for (const version of ['original', ...(item.status === 0 ? ['exported'] : [])]) {
          const page = await browser.newPage()
          const requests = []
          try {
            await page.route('**/*', async route => {
              const url = new URL(route.request().url())
              if (url.hostname === 'remote.test') {
                requests.push({ path: url.href, status: 200 })
                return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              }
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><link rel="stylesheet" href="${version === 'original' ? '/entry.css' : '/dist/output.css'}"><div class="example block">test</div>` })
              const file = join(item.cwd, decodeURIComponent(url.pathname))
              const status = existsSync(file) ? 200 : 404
              requests.push({ path: url.pathname, status })
              return route.fulfill({ status, contentType: file.endsWith('.svg') ? 'image/svg+xml' : 'text/css', body: status === 200 ? readFileSync(file) : '' })
            })
            await page.goto('http://delivery.test/', { waitUntil: 'networkidle' })
            observed[version] = { color: await page.locator('.example').evaluate(el => getComputedStyle(el).color), requests }
          } finally { await page.close() }
        }
        assert.equal(observed.original.color, item.color, `${name}/${item.id}: original CSS control`)
        if (item.image) assert(observed.original.requests.some(r => r.path === '/styles/image.svg' && r.status === 200))
        const exported = observed.exported
        const pass = item.status === 0 && exported.color === observed.original.color
          && (!item.image || exported.requests.some(r => r.path.endsWith('.svg') && r.status === 200))
        if (!pass) failures++
        const result = { browser: name, id: item.id, ...observed, result: pass ? 'PASS' : 'FAIL' }
        results.push(result)
        console.log(JSON.stringify(result))
      }
    } finally { await browser.close() }
  }
} finally { rmSync(workspace, { recursive: true, force: true }) }
const summary = { comparisons: results.length, failures, builtCLI: Boolean(process.env.BH_CLI_BUILT), cleanup: !existsSync(workspace) }
console.log(JSON.stringify(summary))
if (process.env.BH_DELIVERY_RESULT) {
  mkdirSync(dirname(process.env.BH_DELIVERY_RESULT), { recursive: true })
  writeFileSync(process.env.BH_DELIVERY_RESULT, JSON.stringify({ summary, cases: cases.map(({ cwd, ...item }) => item), results }, null, 2))
}
assert.equal(failures, 0, 'CLI exported CSS must preserve stylesheet imports and resource ownership')
