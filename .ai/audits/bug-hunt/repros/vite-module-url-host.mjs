import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const rows = []
for (const extension of ['css', 'scss']) for (const managed of [false, true]) for (const modulesDisabled of [false, true]) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-module-url-host-')))
  let server
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    const file = `style.module.${extension}`
    writeFileSync(join(root, file), (managed ? '@master entry;@preserve native;' : '') + '.example{color:red}')
    server = await createServer({ root, css: modulesDisabled ? { modules: false } : undefined, configFile: false, logLevel: 'silent', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    let error
    try { await server.transformRequest(`/${file}?url`) } catch (cause) { error = { message: cause.message, plugin: cause.plugin, id: cause.id } }
    const response = await fetch(new URL(`${file}?url`, server.resolvedUrls.local[0]))
    await response.text()
    const hostUnsupported = error?.message.includes('?url is not supported with CSS modules.') && response.status === 500
    const row = { extension, managed, modulesDisabled, status: response.status, error, classification: hostUnsupported ? 'HOST_UNSUPPORTED' : 'UNEXPECTED' }
    rows.push(row);console.log(JSON.stringify(row))
  } finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
}
const summary = { controls: rows.length, hostUnsupported: rows.filter(row => row.classification === 'HOST_UNSUPPORTED').length }
console.log(JSON.stringify(summary));assert.equal(summary.hostUnsupported, 8)
