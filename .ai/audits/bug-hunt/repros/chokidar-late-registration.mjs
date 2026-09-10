import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const viteRequire = createRequire(require.resolve('vite/package.json'))
const { watch } = await import(viteRequire.resolve('chokidar'))
const version = JSON.parse(readFileSync(join(dirname(viteRequire.resolve('chokidar')), 'package.json'), 'utf8')).version
const waitFor = async predicate => { const end = Date.now() + 700; while (Date.now() < end) { if (predicate()) return true; await delay(5) } return predicate() }
const results = []
for (const ignoreInitial of [true, false]) for (const missing of ['file', 'directory']) for (const registration of ['immediate', 'inventory']) for (let repetition = 0; repetition < 5; repetition++) {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'chokidar-registration-'))), root = join(parent, 'app'), external = join(parent, 'external')
  mkdirSync(root); mkdirSync(external)
  const dependency = join(external, missing === 'directory' ? 'deep/tokens.css' : 'tokens.css')
  const watcher = watch(root, { ignoreInitial })
  const events = []
  watcher.on('all', (event, file) => { if (file === dependency) events.push(event) })
  try {
    await new Promise(resolve => watcher.once('ready', resolve))
    let watchedPath = dependency
    if (process.env.BH_FIRST_MISSING) while (!existsSync(dirname(watchedPath))) watchedPath = dirname(watchedPath)
    watcher.add(watchedPath)
    if (registration === 'inventory') assert.ok(await waitFor(() => Object.hasOwn(watcher.getWatched(), external)))
    const before = watcher.getWatched()
    mkdirSync(dirname(dependency), { recursive: true }); writeFileSync(dependency, '.target{}')
    const detected = await waitFor(() => events.includes('add') || events.includes('change'))
    results.push({ ignoreInitial, missing, registration, repetition, detected })
    console.log(JSON.stringify({ ...results.at(-1), version, firstMissing: Boolean(process.env.BH_FIRST_MISSING), watchedPath, before, after: watcher.getWatched(), events }))
  } finally { await watcher.close(); rmSync(parent, { recursive: true, force: true }) }
}
console.log(JSON.stringify({ summary: true, version, total: results.length, groups: Object.entries(Object.groupBy(results, x => `${x.ignoreInitial}/${x.missing}/${x.registration}`)).map(([key, cases]) => ({ key, detected: cases.filter(x => x.detected).length, total: cases.length })) }))
