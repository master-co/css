// Test-only wrapper. It leaves the original loader result and options intact
// while recording which watched paths each invocation registers.
import { appendFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

export default function traceNextLoader(source, ...args) {
  const options = this.getOptions()
  const { __masterOriginalLoader: originalPath, __masterTraceKind: kind, ...originalOptions } = options
  const report = process.env.MASTER_NEXT_HMR_TRACE_REPORT
  const callback = this.async()
  const trace = {
    id: `${process.pid}:${randomUUID()}`,
    kind,
    resource: this.resourcePath,
    pid: process.pid,
    started: Date.now(),
    files: [], contexts: [], missing: []
  }
  const finish = (error) => {
    if (report) appendFileSync(report, JSON.stringify({ ...trace, finished: Date.now(), error: error?.message }) + '\n')
  }
  const context = Object.create(this)
  context.getOptions = () => originalOptions
  context.addDependency = file => { trace.files.push(file); this.addDependency?.(file) }
  context.addContextDependency = directory => { trace.contexts.push(directory); this.addContextDependency?.(directory) }
  context.addMissingDependency = file => { trace.missing.push(file); this.addMissingDependency?.(file) }
  context.async = () => (error, ...results) => { finish(error); callback(error, ...results) }
  const active = globalThis.__MASTER_CSS_HMR_TRACE_CONTEXT__
  import(pathToFileURL(originalPath).href)
    .then(({ default: loader }) => active
      ? active.run({ id: trace.id, kind, resource: trace.resource }, () => loader.call(context, source, ...args))
      : loader.call(context, source, ...args))
    .catch(error => { finish(error); callback(error) })
}
