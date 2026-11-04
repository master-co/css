// Standalone platform diagnosis. Requires Chokidar only; no Master CSS build.
// Usage: node watch-registration-gap-runner.mjs <chokidar/index.js> <trace-directory>
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const [modulePath, directory] = process.argv.slice(2)
assert(modulePath && directory, 'Provide a Chokidar module path and trace directory.')
const moduleURL = pathToFileURL(path.resolve(modulePath)).href
const destination = path.resolve(directory)
const preload = new URL('./watch-registration-gap.mjs', import.meta.url)
fs.mkdirSync(destination, { recursive: true })
const results = []
for (const timing of ['before', 'after']) {
  const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-485-standalone-'))
  const traceFile = path.join(destination, `gap-${timing}-${path.basename(cwd)}.jsonl`)
  const script = `
    import fs from 'node:fs'
    import path from 'node:path'
    import { once } from 'node:events'
    import chokidar from ${JSON.stringify(moduleURL)}
    const root = process.cwd(), events = []
    const watcher = chokidar.watch(root, {
      cwd: root, ignoreInitial: true,
      ignored(file, stats) {
        const relative = path.relative(root, path.resolve(file)).split(path.sep).join('/')
        if (stats?.isDirectory()) return relative !== '' && relative !== 'pages'
        return stats?.isFile() ? relative !== 'pages/only.html' : false
      }
    })
    watcher.on('all', (kind, file) => events.push({ kind, file: file.split(path.sep).join('/') }))
    await once(watcher, 'ready')
    // Isolate the new-directory gap from initial root watcher startup.
    await new Promise(resolve => setTimeout(resolve, 30))
    fs.mkdirSync('pages')
    fs.writeFileSync('pages/other.html', 'excluded sibling')
    const deadline = Date.now() + 1000
    const detected = () => events.some(event => event.kind === 'add' && event.file === 'pages/only.html')
    while (!detected() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10))
    await watcher.close()
    console.log(JSON.stringify({ platform: process.platform, node: process.version,
      detected: detected(), targetExists: fs.existsSync('pages/only.html'), events }))
  `
  try {
    const child = spawnSync(process.execPath, ['--import', preload.href, '--input-type=module', '-e', script], {
      cwd, env: { ...process.env, CLI_WATCH_GAP_TIMING: timing, CLI_WATCH_GAP_TRACE: traceFile },
      encoding: 'utf8', timeout: 10000
    })
    assert.equal(child.status, 0, child.stderr || child.error?.message)
    const observation = JSON.parse(child.stdout)
    const events = fs.readFileSync(traceFile, 'utf8').trim().split('\n').map(line => JSON.parse(line))
    const snapshot = events.findIndex(event => event.kind === 'directory.snapshot')
    const authored = events.findIndex(event => event.kind === 'source.write.end')
    const watching = events.findIndex(event => event.kind === 'native.watch.end' && event.detail.directory === 'pages')
    assert(snapshot >= 0, 'The directory must be scanned before the controlled write.')
    assert(!events[snapshot].detail.names.includes('only.html'), 'The first directory snapshot must omit the future source.')
    assert(authored > snapshot, 'The controlled source must be written after the snapshot.')
    assert(watching >= 0, 'The native directory watcher must actually be registered.')
    assert(timing === 'before' ? authored < watching : authored > watching, 'The injection must straddle native registration.')
    assert(observation.targetExists, 'The controlled source must exist.')
    assert(!observation.events.some(event => event.file === 'pages/other.html'), 'The excluded sibling must stay excluded.')
    if (timing === 'after') assert(observation.detected, 'The after-registration control must detect the file.')
    results.push({ timing, ...observation, trace: path.basename(traceFile), chronologyVerified: true })
    console.log(JSON.stringify(results.at(-1)))
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}
const summary = { probe: '485-native-registration-gap', preload: path.basename(fileURLToPath(preload)),
  note: 'Before-registration detection is an observation; no OS events were suppressed.', results }
fs.writeFileSync(path.join(destination, 'registration-gap-summary.json'), JSON.stringify(summary, null, 2) + '\n')
