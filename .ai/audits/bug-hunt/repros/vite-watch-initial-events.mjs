import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build, version } = await import(require.resolve('vite'))
const existing = fileURLToPath(new URL('../../../../AGENTS.md', import.meta.url))
const results = []
for (const polling of [false, true]) for (const phase of ['existing', 'config-resolved', 'environment']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-pure-initial-watch-')))
  const created = join(root, 'trigger'), events = [], changes = []
  let watcher, ready
  const firstEnd = new Promise(resolve => { ready = resolve })
  const start = performance.now()
  const stamp = () => Math.round((performance.now() - start) * 10) / 10
  const allocate = () => { writeFileSync(created, 'unchanged');events.push({ code: 'ALLOCATE', at: stamp() }) }
  try {
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: [{
      name: 'pure-initial-watch-control',
      configResolved(config) {
        if (phase === 'config-resolved') allocate()
        if (phase === 'environment') {
          const original = config.build.createEnvironment
          config.build.createEnvironment = function (...args) { allocate();return original.apply(this, args) }
        }
      },
      buildStart() { this.addWatchFile(phase === 'existing' ? existing : created);throw new Error('intentional initial failure') },
      watchChange(id, change) { changes.push({ id, change, at: stamp() }) }
    }], build: { watch: { chokidar: { usePolling: polling, interval: 100 } }, write: false } })
    assert('on' in result);watcher = result
    result.on('event', event => { events.push({ code: event.code, at: stamp() });if (event.code === 'END') ready() })
    let timeout
    try { await Promise.race([firstEnd, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Initial build timeout')), 5000) })]) }
    finally { clearTimeout(timeout) }
    await delay(600)
    const errors = events.filter(event => event.code === 'ERROR').length
    const row = { phase, polling, errors, quiet: errors === 1 && changes.length === 0, changes, events }
    results.push(row);console.log(JSON.stringify(row))
  } finally { await watcher?.close();rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ vite: version, pass: results.filter(row => row.quiet).length, fail: results.filter(row => !row.quiet).length, scope: 'No Master CSS plugin and no writes after watcher creation;600ms bounded observation' }))
process.exitCode = results.every(row => row.quiet) ? 0 : 1
