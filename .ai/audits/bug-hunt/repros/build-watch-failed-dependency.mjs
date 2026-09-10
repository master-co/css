import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const results = []
for (const mode of (process.env.BH_WATCH_PROBE_MODES?.split(',') ?? ['transform-leaf', 'transform-parent', 'build-end-leaf', 'build-end-parent', 'existing-transform', 'existing-build-end', 'build-start', 'input-change', 'error-watch-files', 'obsolete-existing'])) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-watch-hook-'))), input = join(root, 'input.js'), dependency = join(root, 'missing.txt')
  writeFileSync(input, 'export const value=1')
  if (mode.startsWith('existing') || mode === 'obsolete-existing') writeFileSync(dependency, 'initial')
  let watcher, calls = 0
  const closed = []
  try {
    const watch = host => { host.addWatchFile(dependency); if (mode.endsWith('parent')) host.addWatchFile(dirname(dependency)) }
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: [{ name: 'probe:failed-watch-owner',
      buildStart() { if (mode === 'build-start') watch(this) },
      transform(code, id) {
        if (id !== input) return
        calls++
        if (mode.startsWith('transform') || mode === 'existing-transform' || (mode === 'obsolete-existing' && calls === 1)) watch(this)
        if (calls === 1) throw Object.assign(new Error('intentional initial failure'), mode === 'error-watch-files' ? { watchFiles: [dependency] } : {})
        return code
      },
      buildEnd(error) { if (error && (mode.startsWith('build-end') || mode === 'existing-build-end')) watch(this) }
    }], build: { watch: {}, write: false, minify: false, rolldownOptions: { input } } })
    assert('on' in result);watcher = result
    const events = [], waiting = []
    let terminal
    result.on('event', event => {
      if (event.code === 'BUNDLE_END') closed.push(event.result.close())
      if (event.code === 'ERROR' || event.code === 'BUNDLE_END') terminal = event.code
      if (event.code === 'END' && terminal) { events.push(terminal);terminal = undefined;waiting.shift()?.() }
    })
    const next = async () => {
      if (!events.length) await new Promise(resolve => {
        const notify = () => { clearTimeout(timer);resolve() }
        const timer = setTimeout(() => { const index = waiting.indexOf(notify);if (index >= 0) waiting.splice(index, 1);resolve() }, 5000)
        waiting.push(notify)
      })
      return events.shift() ?? 'TIMEOUT'
    }
    const initial = await next();assert.equal(initial, 'ERROR')
    writeFileSync(mode === 'input-change' ? input : dependency, mode === 'input-change' ? 'export const value=2' : 'created')
    const recovered = await next()
    let obsolete
    if (mode === 'obsolete-existing') {
      assert.equal(recovered, 'BUNDLE_END')
      writeFileSync(dependency, 'obsolete')
      obsolete = await next()
    }
    const row = { mode, initial, recovered, obsolete, calls };results.push(row);console.log(JSON.stringify(row))
  } finally { await watcher?.close();await Promise.all(closed);rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ results, scope: 'Vite/Rolldown failed transform dependency ownership; no Master CSS plugin' }))
