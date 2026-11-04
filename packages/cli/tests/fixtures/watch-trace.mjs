// Opt-in child-process diagnostics for the source-watch regression. Never loaded
// by the production CLI; do not log environment values or non-fixture contents.
import fs from 'node:fs'
import promises from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import path from 'node:path'
import chokidar from 'chokidar'

if (process.env.CLI_WATCH_TRACE_DIR) {
  const root = process.cwd(), started = performance.now()
  const run = (process.env.CLI_WATCH_TRACE_RUN ?? 'local').replace(/[^a-zA-Z0-9_-]/g, '_')
  fs.mkdirSync(process.env.CLI_WATCH_TRACE_DIR, { recursive: true })
  const destination = path.join(process.env.CLI_WATCH_TRACE_DIR, `${run}-${path.basename(root)}.jsonl`)
  const append = fs.appendFileSync.bind(fs)
  let count = 0
  const trace = (kind, detail) => {
    count++
    if (count > 5000 && kind !== 'child.exit' && !kind.startsWith('watch.close.')) {
      if (count === 5001) append(destination, JSON.stringify({ kind: 'trace.limit', maximum: 5000 }) + '\n')
      return
    }
    append(destination, JSON.stringify({ sequence: count, at: Date.now(), ms: performance.now() - started, kind, detail }) + '\n')
  }
  const fixturePath = value => {
    if (typeof value !== 'string') return undefined
    const relative = path.relative(root, path.resolve(value))
    return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) ? relative || '.' : undefined
  }
  const watchedPath = value => fixturePath(value) ?? '<outside-fixture>'
  trace('child.start', { platform: process.platform, node: process.version })
  const watch = chokidar.watch
  chokidar.watch = (paths, options) => {
    trace('watch.create', { paths: (Array.isArray(paths) ? paths : [paths]).map(watchedPath), ignoreInitial: options?.ignoreInitial })
    const ignored = options?.ignored
    const watcher = watch(paths, { ...options, ...(typeof ignored === 'function' ? {
      ignored(file, stats) {
        const result = ignored(file, stats)
        trace('watch.ignored', { file: watchedPath(file), kind: stats?.isDirectory() ? 'directory' : stats?.isFile() ? 'file' : 'unknown', ignored: result })
        return result
      }
    } : {}) })
    const emit = watcher.emit
    watcher.emit = function (event, ...args) {
      if (['add', 'change', 'unlink', 'addDir', 'unlinkDir', 'ready', 'error'].includes(event)) {
        trace(`watch.${event}`, event === 'error' ? { code: args[0]?.code } : { file: watchedPath(args[0]) })
      } else if (event === 'raw') trace('watch.raw', { event: args[0], file: watchedPath(args[1]), watchedPath: watchedPath(args[2]?.watchedPath) })
      return emit.call(this, event, ...args)
    }
    const close = watcher.close
    watcher.close = async function () { trace('watch.close.start');try { return await close.call(this) } finally { trace('watch.close.end') } }
    return watcher
  }
  const read = fs.readFileSync
  fs.readFileSync = function (file, ...args) {
    const relative = fixturePath(file)
    if (relative !== undefined) trace('source.read.start', { file: relative })
    try {
      const result = read.call(this, file, ...args)
      if (relative !== undefined) trace('source.read.end', { file: relative, bytes: Buffer.byteLength(result) })
      return result
    } catch (error) {
      if (relative !== undefined) trace('source.read.error', { file: relative, code: error.code })
      throw error
    }
  }
  // The CLI publication gate is shared by processes of one OS user. Record only
  // its operation timing and register counts, never peer paths or file contents.
  for (const operation of ['mkdir', 'readFile', 'readdir', 'writeFile', 'rename', 'unlink']) {
    const original = promises[operation]
    promises[operation] = async function (file, ...args) {
      const lock = typeof file === 'string' && file.includes(`${path.sep}cli-publication-lock-v1`)
      const own = lock && path.basename(file).startsWith(`${process.pid}-`)
      if (lock) trace(`lock.${operation}.start`, { own })
      try {
        const result = await original.call(this, file, ...args)
        if (lock) trace(`lock.${operation}.end`, { own, ...(operation === 'readdir' ? { registers: result.length } : {}) })
        return result
      } catch (error) {
        if (lock) trace(`lock.${operation}.error`, { own, code: error.code })
        throw error
      }
    }
  }
  syncBuiltinESMExports()
  process.once('exit', code => trace('child.exit', { code }))
}
