// Retained JavaScript cost of layer and reverse-owner indexes, isolated from Wasm/CSSOM.
// node benchmarks/performance-memory.mjs
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const output = resolve('benchmarks/.results/performance-audit')
const baseline = resolve(output, 'host-baseline')
const files = ['host.ts', 'layer.ts', 'theme-layer.ts', 'utility-layer.ts']
await mkdir(baseline, { recursive: true })
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
for (const file of files) {
  const source = execFileSync('git', ['show', `${revision}:packages/runtime/src/${file}`], { encoding: 'utf8' })
    .replace(/from '(\.\/[^']+)'/g, (match, path) => {
      const name = path.slice(2) + '.ts'
      return `from '${files.includes(name) ? './' + name : resolve('packages/runtime/src', name)}'`
    })
  await writeFile(resolve(baseline, file), source)
}
const server = await createServer({ appType: 'custom', configFile: false, root: resolve('.'),
  define: { 'process.env.NODE_ENV': JSON.stringify('production') }, logLevel: 'error',
  server: { cors: true, host: '127.0.0.1', port: 0 } })
const report = { revision, browser: '', samples: 5, warmup: 1, measurements: [],
  limits: ['Same-browser advisory heap measurement after explicit garbage collection.',
    'Uses actual baseline/current host, layer and ownership code with identical generated rule objects.',
    'Excludes Wasm, native allocations and CSSOM; measures host index retention, not total application memory.'] }
let browser
try {
  await server.listen()
  browser = await chromium.launch()
  report.browser = browser.version()
  const page = await browser.newPage()
  page.on('requestfailed', request => console.error(request.url(), request.failure()?.errorText))
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()) })
  const cdp = await page.context().newCDPSession(page)
  await page.evaluate(async (baseURL) => {
    const [{ default: before }, { default: after }, { default: Rule }] = await Promise.all([
      import(baseURL + 'benchmarks/.results/performance-audit/host-baseline/host.ts'),
      import(baseURL + 'packages/runtime/src/host.ts'),
      import(baseURL + 'packages/runtime/src/generated-rule.ts')
    ])
    globalThis.memoryProbe = { before, after, Rule }
  }, server.resolvedUrls.local[0])
  for (const count of [1000, 5000]) {
    for (const variant of ['before', 'after']) {
      const deltas = []
      for (let sample = 0; sample < 6; sample++) {
        await page.evaluate(() => { delete globalThis.retainedHost })
        await cdp.send('HeapProfiler.collectGarbage')
        const before = await cdp.send('Runtime.getHeapUsage')
        await page.evaluate(({ count, variant }) => {
          const { Rule, [variant]: Host } = globalThis.memoryProbe
          const host = new Host(document, { version: 1 }, undefined, undefined, {})
          globalThis.retainedHost = host
          for (let index = 0; index < count; index++) {
            const name = `c${index}`
            const rule = new Rule({ className: name, key: name, layer: 'utilities', type: 0,
              sortTier: 0, priority: { selector: 0 }, text: `.${name}{color:red}` }, host.utilitiesLayer)
            host.utilitiesLayer.insert(rule)
            host.registerClassRule(rule)
          }
          if (host.classUtilities.size !== count) throw new Error('Lost class ownership')
        }, { count, variant })
        await cdp.send('HeapProfiler.collectGarbage')
        const after = await cdp.send('Runtime.getHeapUsage')
        if (sample) deltas.push(after.usedSize - before.usedSize)
      }
      const sorted = deltas.toSorted((a, b) => a - b)
      report.measurements.push({ count, variant, medianBytes: sorted[2], p90Bytes: sorted[4], samples: deltas })
    }
  }
} finally {
  await browser?.close()
  await server.close()
}
await writeFile(resolve(output, 'memory.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
