import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync, watch } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer, version } = await import(require.resolve('vite'))
const rows = []
for (const backend of ['default', 'node']) for (let repetition = 0; repetition < 5; repetition++) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-watch-registration-window-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, 'one/two/three/tokens.css'), nativeEvents = [], viteEvents = []
  let server, native
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, ...(backend === 'node' ? { watch: { useFsEvents: false, usePolling: false } } : {}) } });await server.listen()
    server.watcher.on('all', (event, file) => { if (file === dependency) viteEvents.push(event) })
    native = watch(external, { recursive: true, persistent: false }, (event, file) => { nativeEvents.push({ event, file: String(file) }) })
    server.watcher.add(external)
    mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, '.target{}')
    const end = Date.now() + 700
    while (Date.now() < end && !(viteEvents.length && nativeEvents.some(x => x.file === 'one/two/three/tokens.css'))) await delay(5)
    const row = { backend, repetition, viteEvents, nativeEvents, viteDetected: viteEvents.length > 0, nativeDetected: nativeEvents.some(x => x.file === 'one/two/three/tokens.css') }
    rows.push(row);console.log(JSON.stringify(row))
  } finally { native?.close();await server?.close();rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, version, cases: rows.length, viteDetected: rows.filter(x => x.viteDetected).length, nativeDetected: rows.filter(x => x.nativeDetected).length, scope: 'Immediate creation after public watcher.add(existingAncestor); native watch is a diagnostic control, not a product change' }))
