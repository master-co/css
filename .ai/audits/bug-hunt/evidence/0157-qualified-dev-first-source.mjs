import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const parent = fileURLToPath(new URL('../../../../packages/vite/tmp/', import.meta.url));mkdirSync(parent, { recursive: true })
for (const mode of ['pre-render', 'progressive']) {
  const root = mkdtempSync(join(parent, 'qualified-dev-status-'))
  let server
  try {
    writeFileSync(join(root, 'index.html'), '<!doctype html><div></div>')
    writeFileSync(join(root, 'style.css'), '@import "./branch.css" layer(shared) supports(display:grid);@master entry;')
    writeFileSync(join(root, 'branch.css'), '@import "https://example.invalid/external.css";.child{color:red}')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: createMasterCSSVitePlugin({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls.local[0]
    const stylesheet = await fetch(new URL('style.css', origin), { headers: { Accept: 'text/css' } })
    const text = await stylesheet.text()
    const runtime = await fetch(new URL('@id/__x00__virtual:master-css-runtime', origin))
    console.log(JSON.stringify({ mode, stylesheetStatus: stylesheet.status, runtimeStatus: runtime.status, legacyFlattenError: text.includes('Cannot inline a qualified CSS import containing unresolved imports'), localCompose: text.includes('master-css:local-compose') }))
    assert.equal(runtime.status, 200)
    assert.equal(stylesheet.status, 500)
    assert.ok(text.includes('Cannot inline a qualified CSS import containing unresolved imports'))
  } finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
}
