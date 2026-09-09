import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'

assert(process.cwd().includes('master-css-bh-isolated-'))
const load = (path) => import(pathToFileURL(resolve(path)).href)
const { createMasterDeliveryModePage } = await load('shared/delivery-modes.ts')
const { createInteractionPage } = await load('shared/interaction-cost.ts')
const { startBrowserLifecycleServer } = await load('shared/browser-lifecycle-server.ts')
const require = createRequire(resolve('package.json'))
const { chromium, firefox, webkit } = require('@playwright/test')
const missing = process.env.BH_EXPECT === 'missing'
const progressiveControl = process.env.BH_PROGRESSIVE_CONTROL === '1'
const artifactPath = 'artifacts/mastercss_binding_wasm_engine_bg.wasm'
const expected = await readFile(resolve('node_modules/@master/css-runtime', artifactPath))
const hash = (value) => createHash('sha256').update(value).digest('hex')
const sizes = { raw: expected.length, gzip: gzipSync(expected).length, brotli: brotliCompressSync(expected).length }
const pages = []
for (const modeId of progressiveControl ? ['master-progressive'] : ['master-runtime', 'master-progressive', ...(missing ? [] : ['master-static', 'tailwind-static'])]) {
  pages.push({ name: `delivery-${modeId}`, modeId, ...await createMasterDeliveryModePage({
    fixtureId: 'minimal', modeId, variantId: `bh-0169-${modeId}`
  }) })
  pages.push({ name: `interaction-${modeId}`, modeId, ...await createInteractionPage({
    fixtureId: 'dynamic', modeId, scenarioId: 'existing-class-toggle', variantId: `bh-0169-${modeId}`
  }) })
}
if (process.env.BH_LIFECYCLE_PAGES === '1') {
  for (const id of await readdir('.results/browser-lifecycle/pages')) {
    pages.push({ name: id, modeId: id.includes('master-runtime') ? 'master-runtime' : id.includes('master-progressive') ? 'master-progressive' : 'static', root: resolve('.results/browser-lifecycle/pages', id) })
  }
}
for (const [engine, launcher] of Object.entries(missing ? { chromium } : { chromium, firefox, webkit })) {
  const browser = await launcher.launch()
  try {
    for (const generated of pages) {
      const server = await startBrowserLifecycleServer(generated.root)
      const page = await browser.newPage()
      const responses = []
      const errors = []
      page.on('response', (response) => {
        if (response.url().endsWith('.wasm')) responses.push({ status: response.status(), mime: response.headers()['content-type'] })
      })
      page.on('pageerror', (error) => errors.push(error.message))
      try {
        const usesRuntime = ['master-runtime', 'master-progressive'].includes(generated.modeId)
        await page.goto(server.origin)
        await page.waitForFunction('globalThis.__benchmarkReady === true', undefined, { timeout: missing ? 1500 : 10000 }).catch((error) => { if (!missing) throw error })
        const actual = await page.evaluate(`(() => {
          const snapshot = globalThis.masterCSSRuntime?.snapshot()
          const probe = document.getElementById('benchmark-style-probe') || document.getElementById('interaction-style-probe')
          return { ready: globalThis.__benchmarkReady === true, hydration: snapshot?.hydration, legacyProgressive: Boolean(globalThis.masterCSSRuntime?.progressive), rules: Object.keys(snapshot?.classRules || {}).length,
            cssBytes: new TextEncoder().encode(snapshot?.cssText || '').length,
            probe: probe ? getComputedStyle(probe).textAlign : null,
            hidden: getComputedStyle(document.documentElement).visibility === 'hidden' }
        })()`)
        if (missing) {
          assert(responses.some((entry) => entry.status === 404))
          assert.equal(actual.ready, false)
        } else {
          assert(actual.ready)
          assert.equal(actual.hidden, false)
          assert.deepEqual(errors, [])
          if (usesRuntime) {
            assert(actual.rules > 0 && actual.cssBytes > 0)
            if (progressiveControl) {
              assert.equal(actual.hydration.state, 'progressive')
              assert.equal(actual.legacyProgressive, false)
              assert.equal(actual.probe, 'center')
            }
            assert(responses.length > 0)
            assert(responses.every((entry) => entry.status === 200 && entry.mime === 'application/wasm'))
            const response = await fetch(new URL(artifactPath, server.origin))
            assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(expected))
            if (generated.artifacts) {
              const artifact = generated.artifacts.find((entry) => entry.path.endsWith(artifactPath))
              assert(artifact)
              assert.equal(artifact.sha256, hash(expected))
              for (const [kind, bytes] of Object.entries(sizes)) assert.equal(artifact[`${kind}Bytes`], bytes)
            }
          } else {
            assert.equal(responses.length, 0)
            assert.equal((await fetch(new URL(artifactPath, server.origin))).status, 404)
          }
          if (generated.samples) {
            for (const [kind, bytes] of Object.entries(sizes)) {
              assert.equal(generated.samples.find((sample) => sample.metricId === `runtime-wasm-${kind}-bytes`)?.value, usesRuntime ? bytes : 0)
            }
          }
        }
        console.log(JSON.stringify({ engine, browser: browser.version(), page: generated.name, expected: missing ? 'missing' : 'delivered', actual, responses, errors, pass: true }))
      } finally { await page.close(); await server.close() }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ sizes, sha256: hash(expected), pass: true }))
