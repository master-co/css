// Optional child-process probe for the real Next HMR fixture. Keep this outside
// the fixture's source inventory; it is never imported by published packages.
import fs from 'node:fs/promises'
import { appendFileSync } from 'node:fs'
import { AsyncLocalStorage } from 'node:async_hooks'
import { syncBuiltinESMExports } from 'node:module'
import { MasterCSSStylesheetCollection } from '@master/css-compiler/stylesheet'

const report = process.env.MASTER_NEXT_HMR_PIPELINE_REPORT
if (report) {
  const original = { open: fs.open, unlink: fs.unlink, readFile: fs.readFile, glob: fs.glob, rename: fs.rename, link: fs.link }
  const traceContext = globalThis.__MASTER_CSS_HMR_TRACE_CONTEXT__ = new AsyncLocalStorage()
  let operation, waiting
  fs.open = async function (file, flags, ...args) {
    const publishing = String(file).endsWith('/.master/publish.lock') && flags === 'wx'
    if (publishing) waiting ??= performance.now()
    const handle = await original.open.call(this, file, flags, ...args)
    if (publishing) {
      operation = {
        started: Date.now(), waitMs: performance.now() - waiting, holdStart: performance.now(),
        composeCalls: 0, composeMs: 0, sourceReads: 0, snapshots: 0, changedOutputs: [],
        origin: traceContext.getStore()
      }
      waiting = undefined
    }
    return handle
  }
  fs.readFile = function (file, ...args) {
    if (operation && /\.[jt]sx?$/.test(String(file))) operation.sourceReads++
    return original.readFile.call(this, file, ...args)
  }
  fs.glob = function (pattern, ...args) {
    if (operation && pattern === '**/*') operation.snapshots++
    return original.glob.call(this, pattern, ...args)
  }
  fs.rename = async function (from, to, ...args) {
    const result = await original.rename.call(this, from, to, ...args)
    if (operation && String(to).includes('/.master/')) operation.changedOutputs.push(String(to))
    return result
  }
  fs.link = async function (from, to, ...args) {
    const result = await original.link.call(this, from, to, ...args)
    if (operation && String(to).includes('/.master/')) operation.changedOutputs.push(String(to))
    return result
  }
  fs.unlink = async function (file, ...args) {
    const result = await original.unlink.call(this, file, ...args)
    if (String(file).endsWith('/.master/publish.lock') && operation) {
      const { holdStart, ...metrics } = operation
      operation = undefined
      appendFileSync(report, JSON.stringify({ ...metrics, finished: Date.now(), holdMs: performance.now() - holdStart, pid: process.pid }) + '\n')
    }
    return result
  }
  syncBuiltinESMExports()
  const compose = MasterCSSStylesheetCollection.prototype.compose
  MasterCSSStylesheetCollection.prototype.compose = async function (...args) {
    const active = operation, start = performance.now()
    if (active) active.composeCalls++
    try { return await compose.apply(this, args) }
    finally { if (active) active.composeMs += performance.now() - start }
  }
}
