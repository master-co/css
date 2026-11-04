// Test-only preload: author a source exactly at native directory registration.
// Keep actual OS events intact; a missed event is an observation, not injected.
import fs from 'node:fs'
import promises from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import path from 'node:path'

const timing = process.env.CLI_WATCH_GAP_TIMING
if (timing === 'before' || timing === 'after') {
  const root = process.cwd()
  const directory = path.join(root, 'pages')
  const target = path.join(directory, 'only.html')
  const destination = process.env.CLI_WATCH_GAP_TRACE
  const append = fs.appendFileSync.bind(fs)
  const started = performance.now()
  let injected = false, sequence = 0
  const trace = (kind, detail = {}) => {
    if (destination && sequence < 200) append(destination, JSON.stringify({ sequence: ++sequence,
      at: Date.now(), ms: performance.now() - started, kind, detail }) + '\n')
  }
  trace('probe.start', { timing, platform: process.platform, node: process.version })
  const inject = () => {
    injected = true
    trace('source.write.start')
    fs.writeFileSync(target, '<div class="(display:block)"></div>')
    trace('source.write.end')
    process.stderr.write(`WATCH_GAP_INJECTED ${timing}\n`)
  }
  const readDirectory = promises.readdir
  promises.readdir = async function (file, ...args) {
    const entries = await readDirectory.call(this, file, ...args)
    if (path.resolve(String(file)) === directory) trace('directory.snapshot', {
      names: entries.map(entry => typeof entry === 'string' ? entry : entry.name)
    })
    return entries
  }
  const watch = fs.watch
  fs.watch = function (file, options, listener) {
    const absolute = path.resolve(String(file))
    const observed = absolute === root || absolute === directory
    if (!observed) return watch.call(this, file, options, listener)
    if (absolute === directory && !injected && timing === 'before') inject()
    if (observed) trace('native.watch.start', { directory: path.relative(root, absolute) || '.' })
    const watcher = watch.call(this, file, options, function (...args) {
      if (observed) trace('native.event', { directory: path.relative(root, absolute) || '.',
        event: args[0], filename: args[1]?.toString() })
      return listener.apply(this, args)
    })
    if (observed) trace('native.watch.end', { directory: path.relative(root, absolute) || '.' })
    if (absolute === directory && !injected && timing === 'after') inject()
    return watcher
  }
  syncBuiltinESMExports()
}
