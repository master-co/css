import assert from 'node:assert/strict'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build, version } = await import(process.env.BH_VITE_ENTRY ? pathToFileURL(process.env.BH_VITE_ENTRY).href : require.resolve('vite'))
const settle = Number(process.env.BH_SETTLE_MS ?? 0)
console.log(JSON.stringify({ vite: version, settle }))
const results = []
for (const mode of ['default', 'authored-include', 'cache-exclude']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-missing-import-watch-')))
  let watcher
  try {
    const input = join(root, 'entry.js'), dependency = join(root, 'missing.js')
    writeFileSync(input, 'import "./missing.js";export const value=1')
    const watch = mode === 'authored-include' ? { include: ['**/*.js', '**/*.css', '**/*.html'] } : mode === 'cache-exclude' ? { exclude: ['**/.vite/**'] } : {}
    const events = [], pending = []
    const result = await build({ root, configFile: false, logLevel: 'silent', build: { watch, write: false, rollupOptions: { input } } })
    assert('on' in result);watcher = result
    let terminal
    result.on('event', event => {
      if (event.code === 'ERROR') terminal = { code: event.code, error: event.error.message }
      if (event.code === 'BUNDLE_END') terminal = { code: event.code }
      if (event.code === 'END' && terminal) { events.push(terminal);terminal = undefined;pending.shift()?.() }
    })
    const next = async () => {
      if (!events.length) await new Promise(resolve => {
        const notify = () => { clearTimeout(timer);resolve() }
        const timer = setTimeout(() => { const i = pending.indexOf(notify);if (i !== -1) pending.splice(i, 1);resolve() }, 4000)
        pending.push(notify)
      })
      return events.shift() ?? { code: 'TIMEOUT' }
    }
    const initial = await next();assert.equal(initial.code, 'ERROR');assert(initial.error.includes('missing.js'))
    if (settle) await new Promise(resolve => setTimeout(resolve, settle))
    writeFileSync(dependency, 'export const recovered=true')
    const recovered = await next()
    const row = { mode, initial, recovered };results.push(row);console.log(JSON.stringify(row))
  } finally { await watcher?.close();rmSync(root, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ results, scope: 'Pure Vite/Rolldown missing import; no Master CSS plugin' }))
