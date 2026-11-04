// Cross-process watcher diagnosis, with no Master CSS or synchronous tracing.
// Usage: node watch-new-sources-stress.mjs <chokidar/index.js> <output-directory> [100..300]
import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const self = fileURLToPath(import.meta.url)
const normalize = value => value.split(path.sep).join('/')
async function stopChild(child, ended) {
  if (child.exitCode === null && child.signalCode === null && child.connected) child.send({ type: 'stop' })
  const graceful = await Promise.race([ended, delay(3000, null, { ref: false })])
  if (!graceful && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  const termination = graceful || await Promise.race([ended, delay(2000, null, { ref: false })])
  if (!termination) throw new Error('The watcher could not be terminated; fixture retained for diagnosis.')
  return termination
}
if (process.argv[2] === '--watcher') {
  const root = process.cwd(), events = []
  let dropped = 0
  const record = (kind, detail) => {
    if (events.length < 1000) events.push({ at: Date.now(), kind, detail })
    else dropped++
  }
  const { default: chokidar } = await import(pathToFileURL(process.argv[3]).href)
  const watcher = chokidar.watch(root, {
    cwd: root, ignoreInitial: true,
    ignored(file, stats) {
      const relative = normalize(path.relative(root, path.resolve(file)))
      const ignored = stats?.isDirectory() ? relative !== '' && relative !== 'pages'
        : stats?.isFile() ? relative !== 'pages/only.html' : false
      record('ignored', { file: relative, type: stats?.isDirectory() ? 'directory' : stats?.isFile() ? 'file' : 'unknown', ignored })
      return ignored
    }
  })
  watcher.on('raw', (event, file, detail) => record('raw', { event, file: String(file),
    watched: detail?.watchedPath ? normalize(path.relative(root, detail.watchedPath)) : undefined }))
  watcher.on('all', (kind, file) => {
    const relative = normalize(file)
    record(kind, { file: relative })
    if (relative !== 'pages/only.html' || !['add', 'change'].includes(kind)) return
    try {
      const content = fs.readFileSync(path.join(root, file), 'utf8')
      const stage = content.includes('display:block') ? 'block' : content.includes('display:none') ? 'none' : 'other'
      record('source.read', { stage })
      process.send({ type: 'observed', at: Date.now(), stage, kind })
    } catch (error) { record('source.error', { code: error.code }) }
  })
  watcher.on('error', error => { record('error', { code: error.code }); process.send({ type: 'error', code: error.code }) })
  watcher.once('ready', async () => {
    await delay(0)
    record('ready')
    process.send({ type: 'ready', at: Date.now() })
  })
  process.once('message', async message => {
    if (message?.type !== 'stop') return
    await watcher.close()
    process.send({ type: 'trace', events, dropped }, () => process.disconnect())
  })
} else {
  const [modulePath, directory, count = '200'] = process.argv.slice(2)
  assert(modulePath && directory, 'Provide a Chokidar module path and output directory.')
  const iterations = Number(count)
  assert(Number.isInteger(iterations) && iterations >= 100 && iterations <= 300, 'Use 100–300 iterations.')
  const destination = path.resolve(directory)
  fs.mkdirSync(destination, { recursive: true })
  const cases = [], failures = []
  for (let iteration = -1; iteration < iterations; iteration++) {
    const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-485-cross-process-'))
    if (iteration === -1) fs.mkdirSync(path.join(cwd, 'pages'))
    const child = fork(self, ['--watcher', path.resolve(modulePath)], { cwd, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] })
    const writerEvents = [], observed = []
    let ready, trace, error, stderr = '', exited = false
    child.stderr.on('data', chunk => { if (stderr.length < 8000) stderr += chunk })
    child.on('message', message => {
      if (message.type === 'ready') ready = message.at
      else if (message.type === 'observed') observed.push(message)
      else if (message.type === 'trace') trace = message
      else if (message.type === 'error') error = message.code || 'watcher error'
    })
    child.on('error', reason => { error = reason.message })
    const ended = new Promise(resolve => child.once('exit', (code, signal) => { exited = true; resolve({ code, signal }) }))
    const wait = async check => {
      const deadline = Date.now() + 10000
      while (!check() && !error && !exited && Date.now() < deadline) await delay(10)
      assert(check(), error || (exited ? 'Watcher exited prematurely.' : 'The original 10-second observation deadline expired.'))
    }
    const write = (relative, content) => {
      writerEvents.push({ at: Date.now(), kind: 'write.start', file: relative })
      fs.mkdirSync(path.dirname(path.join(cwd, relative)), { recursive: true })
      fs.writeFileSync(path.join(cwd, relative), content)
      writerEvents.push({ at: Date.now(), kind: 'write.end', file: relative })
    }
    let outcome = 'passed', failure
    try {
      await wait(() => ready !== undefined)
      write('pages/other.html', '<div class="(display:grid)"></div>')
      write('ignored.json', '{"class":"grid"}')
      write('pages/only.html', '<div class="(display:block)"></div>')
      await wait(() => observed.some(event => event.stage === 'block'))
      // Keep the later edit distinct from Chokidar's native-event deduplication;
      // the original CLI also compiles and publishes between these writes.
      await delay(50)
      write('pages/only.html', '<div class="(display:none)"></div>')
      await wait(() => observed.some(event => event.stage === 'none'))
    } catch (reason) {
      outcome = 'failed'
      failure = reason.message
    } finally {
      const termination = await stopChild(child, ended)
      fs.rmSync(cwd, { recursive: true, force: true })
      const excluded = trace?.events.some(event => ['add', 'change'].includes(event.kind)
        && event.detail?.file !== 'pages/only.html')
      if (excluded || !trace || trace.dropped || termination.code !== 0) {
        outcome = 'failed'
        failure ||= excluded ? 'Excluded sibling generated a file event.' : 'Complete graceful watcher trace was not retained.'
      }
      const writes = writerEvents.filter(event => event.kind === 'write.end' && event.file === 'pages/only.html')
      const result = { iteration, control: iteration === -1, outcome, failure, ready,
        latenciesMs: ['block', 'none'].map((stage, i) => {
          const update = observed.find(event => event.stage === stage)
          return update && writes[i] ? update.at - writes[i].at : null
        }), termination, fixtureRemoved: !fs.existsSync(cwd) }
      cases.push(result)
      if (outcome === 'failed') failures.push({ ...result, stderr, observed, writerEvents, trace })
    }
    if (failures.length) break
  }
  const summary = { probe: '485-cross-process-source-writes', platform: process.platform, node: process.version,
    requestedIterations: iterations, completedIterations: cases.filter(item => !item.control).length,
    passed: cases.filter(item => item.outcome === 'passed').length, failures, cases }
  fs.writeFileSync(path.join(destination, 'cross-process-stress-summary.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ ...summary, cases: undefined, failures: failures.map(({ trace, ...failure }) => failure) }))
  if (failures.length) process.exitCode = 1
}
