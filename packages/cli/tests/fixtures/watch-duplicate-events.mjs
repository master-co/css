// Test-only duplicate notifications; entry reads prove every queued attempt
// still verifies the physical output rather than trusting a CSS-text cache.
import fs from 'node:fs'
import path from 'node:path'
import chokidar from 'chokidar'

const sourceWatchers = new Set()
const output = path.join(process.cwd(), 'master.css')
let armed = false, reads = 0
const send = message => { if (process.connected) process.send(message) }
const read = fs.readFileSync
fs.readFileSync = function (file, ...args) {
  const result = read.call(this, file, ...args)
  if (armed && typeof file === 'string' && path.resolve(file) === output) send({ type: 'publication-entry-read', count: ++reads })
  return result
}
const watch = chokidar.watch
chokidar.watch = function (paths, options) {
  const watcher = watch.call(this, paths, options)
  if (options?.cwd === process.cwd()) {
    sourceWatchers.add(watcher)
    const close = watcher.close
    watcher.close = function () { sourceWatchers.delete(watcher); return close.call(this) }
  }
  return watcher
}
process.on('message', message => {
  if (message?.type !== 'duplicate-source-events' || !Number.isInteger(message.count) || message.count < 1 || message.count > 10) return
  armed = true
  for (let index = 0; index < message.count; index++) {
    setTimeout(() => {
      for (const watcher of sourceWatchers) watcher.emit('change', 'index.html')
    }, index * 75)
  }
})
