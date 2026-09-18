import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, unlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const webpackRequire = createRequire(require.resolve('webpack'))
const watchpackPath = webpackRequire.resolve('watchpack')
if (process.env.BH_WATCHPACK_PATCHED) {
  webpackRequire(watchpackPath)
  webpackRequire.cache[watchpackPath].exports = webpackRequire(process.env.BH_WATCHPACK_PATCHED)
}
const watchpackRequire = createRequire(watchpackPath)
const fs = watchpackRequire('graceful-fs')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-pure-initial-scan-'))), child = join(root, 'child.css')
writeFileSync(join(root, 'entry.js'), 'import "./entry.css"')
writeFileSync(join(root, 'entry.css'), '@import "./child.css";')
writeFileSync(child, '.card{color:red}')
const events = [], originalLstat = fs.lstat
let triggered = false, watchPhase = false
fs.lstat = function (file, ...args) {
  if (!process.env.BH_NO_DELETE && watchPhase && !triggered && String(file) === child && new Error().stack.includes('DirectoryWatcher.js')) {
    triggered = true;unlinkSync(child);events.push({ event: 'delete-between-readdir-and-lstat', file })
  }
  return originalLstat.call(this, file, ...args)
}
const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false }, experiments: { css: true }, output: { path: join(root, 'out'), filename: 'entry.js', cssFilename: 'entry.css' } })
const originalWatch = compiler.watchFileSystem.watch.bind(compiler.watchFileSystem)
compiler.watchFileSystem.watch = (...args) => {
  watchPhase = true
  events.push({ event: 'watch-registration', containsChild: [...args[0]].includes(child) })
  const cb = args[5];args[5] = (...values) => { events.push({ event: 'watch-filesystem-callback', removed: [...(values[4] ?? [])] });cb(...values) }
  return originalWatch(...args)
}
let watching
try {
  watching = compiler.watch({ aggregateTimeout: 20 }, (error, stats) => events.push({ event: 'compilation', fatal: error?.message, errors: stats?.compilation.errors.map(error => error.message) }))
  await new Promise(resolve => setTimeout(resolve, 5000))
  const compilations = events.filter(e => e.event === 'compilation')
  const observed = compilations.some(e => e.fatal || e.errors?.length)
  const pass = process.env.BH_NO_DELETE ? !triggered && !observed && compilations.length === 1 : process.env.BH_WATCHPACK_PATCHED ? triggered && observed : triggered && !observed && compilations.length === 1
  console.log(JSON.stringify({ patched: Boolean(process.env.BH_WATCHPACK_PATCHED), control: Boolean(process.env.BH_NO_DELETE), pureWebpack: true, controlledInterleaving: true, triggered, events, missingChildReported: observed, result: pass ? (process.env.BH_WATCHPACK_PATCHED || process.env.BH_NO_DELETE ? 'PASS' : 'REPRODUCED') : 'FAIL' }))
  if (!pass) process.exitCode = 1
} finally {
  fs.lstat = originalLstat
  if (watching) await new Promise((resolve, reject) => watching.close(error => error ? reject(error) : resolve()))
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  rmSync(root, { recursive: true, force: true })
}
