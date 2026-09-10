import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const rows = []
for (let repetition = 0; repetition < 10; repetition++) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-obsolete-reconciliation-'))), root = join(parent, 'app'), external = join(parent, 'external'), events = []
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, 'one/tokens.css'), source = join(root, 'style.css')
  writeFileSync(source, '@reference "../external/one/tokens.css";.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
  let server, phase = 'initial'
  const record = data => events.push({ phase, time: performance.now(), ...data })
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [...createMasterCSSVitePlugin({ mode: 'static', runtime: false }), { name: 'observe-source-events', enforce: 'post', hotUpdate({ file }) { record({ type: 'hotUpdate', file }) } }], server: { host: '127.0.0.1', port: 0, fs: { allow: [parent] } } });await server.listen()
    server.watcher.add = () => server.watcher
    server.watcher.on('all', (event, file) => record({ type: 'filesystem', event, file }))
    const send = server.ws.send.bind(server.ws)
    server.ws.send = (...args) => { record({ type: 'send', message: args[0] });return send(...args) }
    const transform = server.environments.client.transformRequest.bind(server.environments.client)
    server.environments.client.transformRequest = url => { record({ type: 'transformRequest', url });return transform(url) }
    const origin = server.resolvedUrls.local[0]
    await (await fetch(new URL('entry.js', origin))).text()
    const initial = await fetch(new URL('style.css', origin));assert.equal(initial.status, 500);await initial.text();await server.environments.client.waitForRequestsIdle()
    events.length = 0;phase = 'source-edit';writeFileSync(source, '.target{padding:9rem}')
    const end = Date.now() + 3000
    while (!events.some(event => event.type === 'send' && ['update', 'full-reload'].includes(event.message?.type)) && Date.now() < end) await delay(5)
    const response = await fetch(new URL('style.css', origin));assert.equal(response.status, 200)
    await response.text()
    phase = 'obsolete-restored';mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, '@utilities{paint{padding:7rem}}')
    await delay(350)
    const late = events.filter(event => event.phase === 'obsolete-restored')
    const row = { repetition, events, lateNotifications: late.filter(event => event.type === 'send').length, lateExternalHotUpdates: late.filter(event => event.type === 'hotUpdate' && event.file === dependency).length, lateTransforms: late.filter(event => event.type === 'transformRequest').length }
    rows.push(row);console.log(JSON.stringify(row))
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, cases: rows.length, casesWithLateNotifications: rows.filter(row => row.lateNotifications).length, lateExternalHotUpdates: rows.reduce((sum, row) => sum + row.lateExternalHotUpdates, 0), lateTransforms: rows.reduce((sum, row) => sum + row.lateTransforms, 0) }))
