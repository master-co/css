import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, watch, watchFile, unwatchFile, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const mode = process.env.BH_NATIVE_WATCH_MODE || 'native'
if (!['native', 'poll'].includes(mode)) throw new Error(`Unknown mode: ${mode}`)
const runs = []
for (let iteration = 0; iteration < 6; iteration++) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-native-entry-watch-')))
  const app = join(root, 'app'), entry = join(app, 'entry.js')
  mkdirSync(app)
  writeFileSync(join(app, 'global.css'), '.global{color:red}')
  writeFileSync(entry, 'initial')
  const events = [], edits = [], observed = []
  let awaiting, timer, failure
  const notify = (type, filename) => {
    let source
    try { source = readFileSync(entry, 'utf8') } catch { /* Captured as missing if observed during cleanup. */ }
    events.push({ time: Date.now(), type, filename, source })
    if (awaiting?.stage === source) {
      clearTimeout(timer)
      const { resolve } = awaiting
      awaiting = undefined
      observed.push(source)
      resolve()
    }
  }
  const watcher = mode === 'native' ? watch(app, notify) : undefined
  if (mode === 'poll') watchFile(entry, { interval: 100 }, () => notify('poll', 'entry.js'))
  try {
    for (const stage of ['both', 'one', 'none']) {
      await new Promise((resolve, reject) => {
        awaiting = { stage, resolve }
        timer = setTimeout(() => { awaiting = undefined;reject(new Error(`Missing ${stage} event`)) }, 12000)
        writeFileSync(entry, stage)
        edits.push({ stage, time: Date.now(), mtime: statSync(entry).mtimeMs })
      })
    }
  } catch (error) { failure = String(error) }
  finally {
    clearTimeout(timer)
    watcher?.close()
    if (mode === 'poll') unwatchFile(entry)
    runs.push({ iteration, edits, events, observed, failure, finalDisk: readFileSync(entry, 'utf8') })
    rmSync(root, { recursive: true, force: true })
  }
}
const failures = runs.filter(run => run.failure).length
console.log(JSON.stringify({ mode, node: process.version, uv: process.versions.uv, platform: process.platform,
  scope: 'Six independent owned directories; direct Node fs.watch or watchFile only. No Webpack, Watchpack, product imports or dependency modifications. Sequential writes wait for events, never forced invalidation.',
  failures, runs }, null, 2))
if (failures) process.exitCode = 1
