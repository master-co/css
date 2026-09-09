import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const parent = fileURLToPath(new URL('../../../../packages/vite/tmp/', import.meta.url));mkdirSync(parent, { recursive: true })
const qualified = process.env.BH_QUALIFIED !== '0'
for (const mode of process.env.BH_MODE ? [process.env.BH_MODE] : ['pre-render', 'progressive']) {
  const root = mkdtempSync(join(parent, 'qualified-dev-status-'))
  let server
  try {
    writeFileSync(join(root, 'index.html'), '<!doctype html><div></div>')
    writeFileSync(join(root, 'style.css'), qualified ? '@import "./branch.css" layer(shared) supports(display:grid);@master entry;' : '@master entry;')
    writeFileSync(join(root, 'branch.css'), '@import "https://example.invalid/external.css";.child{color:red}')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls.local[0]
    const stylesheet = await fetch(new URL('style.css', origin), { headers: { Accept: 'text/css' } })
    const text = await stylesheet.text()
    const runtime = await fetch(new URL('@id/__x00__virtual:master-css-runtime', origin))
    await runtime.text()
    console.log(JSON.stringify({ qualified, mode, stylesheetStatus: stylesheet.status, runtimeStatus: runtime.status, legacyFlattenError: text.includes('Cannot inline a qualified CSS import containing unresolved imports'), localCompose: text.includes('master-css:local-compose') }))
    assert.equal(runtime.status, 200)
    assert.equal(stylesheet.status, qualified ? 500 : 200)
    assert.equal(text.includes('Cannot inline a qualified CSS import containing unresolved imports'), qualified)
  } finally {
    // This probe checks CSS delivery, so finish Vite's queued transforms before closing.
    // Direct-close host behavior has separate shutdown-handles reproductions.
    await server?.environments.client.waitForRequestsIdle()
    console.log(JSON.stringify({ mode, requestsIdle: true }))
    await server?.close();rmSync(root, { recursive: true, force: true });console.log(JSON.stringify({ mode, closed: true }))
  }
}
console.log(JSON.stringify({ observationsFinished: true }))
setTimeout(() => console.log(JSON.stringify({ residualNativeHandles: process.report.getReport().libuv.filter(h => h.is_active && h.is_referenced), resources: process.getActiveResourcesInfo() })), 5000).unref()
