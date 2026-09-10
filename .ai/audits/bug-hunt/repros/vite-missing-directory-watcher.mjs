import { existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer, version } = await import(require.resolve('vite'))
const waitFor = async predicate => { const end = Date.now() + 700; while (Date.now() < end) { if (predicate()) return true; await delay(5) } return predicate() }
const rows = []
for (const backend of ['default', 'node']) for (const registration of ['leaf', 'first-missing', 'existing-ancestor']) for (const levels of [1, 3]) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'vite-directory-watcher-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root);mkdirSync(external)
  const dependency = join(external, levels === 1 ? 'one/tokens.css' : 'one/two/three/tokens.css')
  let server
  const events = []
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, ...(backend === 'node' ? { watch: { useFsEvents: false, usePolling: false } } : {}) } });await server.listen()
    server.watcher.on('all', (event, file) => { if (file === dependency) events.push(event) })
    let watchedPath = dependency
    if (registration !== 'leaf') while (!existsSync(dirname(watchedPath))) watchedPath = dirname(watchedPath)
    if (registration === 'existing-ancestor') watchedPath = dirname(watchedPath)
    server.watcher.add(watchedPath)
    const registered = await waitFor(() => Object.hasOwn(server.watcher.getWatched(), external))
    mkdirSync(dirname(dependency), { recursive: true });writeFileSync(dependency, '.target{}')
    const detected = await waitFor(() => events.some(event => ['add', 'change'].includes(event)))
    const row = { backend, registration, levels, registered, detected, events, watchedPath, options: server.watcher.options, watched: server.watcher.getWatched() }
    rows.push(row);console.log(JSON.stringify(row))
  } finally { await server?.close();rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, version, rows: rows.map(({ backend, registration, levels, registered, detected }) => ({ backend, registration, levels, registered, detected })) }))
