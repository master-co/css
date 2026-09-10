import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build, createServer, version } = await import(require.resolve('vite'))
const waitFor = async predicate => { const deadline = Date.now() + 2000; while (Date.now() < deadline) { if (predicate()) return true; await delay(20) } return predicate() }
for (const command of (process.env.BH_BUILD_ONLY ? ['build'] : ['serve', 'build'])) for (const watchParent of [false, true]) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'vite-failed-watch-control-')))
  mkdirSync(join(root, 'shared'))
  const source = join(root, 'style.css'), dependency = join(root, 'shared/tokens.txt')
  writeFileSync(source, '.target{}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
  const events = [], notifications = [], fsEvents = [], attempts = [], closing = []
  let server, watcher
  const plugin = {
    name: 'pure-vite-failed-watch-control', enforce: 'pre',
    buildStart() { if (process.env.BH_WATCH_START) { this.addWatchFile(dependency); if (watchParent) this.addWatchFile(dirname(dependency)) } },
    buildEnd(error) {
      if (!error || !process.env.BH_WATCH_END) return
      this.addWatchFile(dependency)
      if (watchParent) this.addWatchFile(dirname(dependency))
    },
    transform(code, id) {
      if (id !== source) return
      if (code.includes('no-dependency')) return code
      this.addWatchFile(dependency)
      if (watchParent) this.addWatchFile(dirname(dependency))
      attempts.push({ watched: [dependency, ...(watchParent ? [dirname(dependency)] : [])] })
      return `.target{padding:${readFileSync(dependency, 'utf8')}rem}`
    }
  }
  try {
    const config = { root, configFile: false, logLevel: 'silent', plugins: [plugin] }
    if (command === 'serve') {
      server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } }); await server.listen()
      server.watcher.on('all', (event, file) => { if (file === dependency) fsEvents.push(event) })
      const send = server.ws.send.bind(server.ws)
      server.ws.send = (...args) => { notifications.push(args); return send(...args) }
      const origin = server.resolvedUrls.local[0]
      const entry = await fetch(new URL('entry.js', origin)); await entry.text()
      const response = await fetch(new URL('style.css', origin)); assert.equal(response.status, 500); await response.text()
      notifications.length = 0
      writeFileSync(dependency, '7')
      await waitFor(() => notifications.some(([message]) => message?.type === 'update' || message?.type === 'full-reload'))
      console.log(JSON.stringify({ command, watchParent, version, attempts, fsEvents, notifications, recoveryNotified: notifications.some(([message]) => ['update', 'full-reload'].includes(message?.type)) }))
      if (process.env.BH_DROP_DEPENDENCY) {
        await server.environments.client.transformRequest('/style.css')
        writeFileSync(source, '.target{/* no-dependency */}')
        await delay(250)
        await server.environments.client.transformRequest('/style.css')
        notifications.length = 0; fsEvents.length = 0
        writeFileSync(dependency, '99')
        await waitFor(() => notifications.length > 0)
        console.log(JSON.stringify({ command, watchParent, droppedDependency: true, notifications, fsEvents }))
      }
    } else {
      watcher = await build({ ...config, build: { watch: {}, minify: false } })
      watcher.on('event', event => { if (event.code === 'ERROR') console.log(JSON.stringify({ command, watchParent, initialError: String(event.error) })); events.push(event.code); if (event.code === 'BUNDLE_END') closing.push(event.result.close()) })
      assert.ok(await waitFor(() => events.includes('END')))
      assert.ok(events.includes('ERROR'))
      // Separate native watcher installation from the initial ERROR callback.
      await delay(250)
      events.length = 0; writeFileSync(dependency, '7')
      await waitFor(() => events.includes('END'))
      const recovered = events.includes('BUNDLE_END')
      console.log(JSON.stringify({ command, watchParent, version, attempts, events, recovered }))
      if (process.env.BH_TOUCH_ENTRY) {
        events.length = 0; writeFileSync(source, '.target{/* edited */}')
        await waitFor(() => events.includes('END'))
        console.log(JSON.stringify({ command, watchParent, afterExistingSourceEdit: true, attempts, events, recovered: events.includes('BUNDLE_END') }))
      }
    }
  } finally { await server?.environments.client.waitForRequestsIdle(); await server?.close(); await watcher?.close(); await Promise.all(closing); rmSync(root, { recursive: true, force: true }) }
}
