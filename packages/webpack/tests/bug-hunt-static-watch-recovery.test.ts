import { expect, test } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

if (process.env.BH_WATCHPACK_PATCHED) {
  const load = createRequire(import.meta.url)
  const webpackLoad = createRequire(load.resolve('webpack'))
  const watchpackPath = webpackLoad.resolve('watchpack')
  webpackLoad(watchpackPath)
  webpackLoad.cache[watchpackPath]!.exports = webpackLoad(process.env.BH_WATCHPACK_PATCHED)
}

test.each(['child', 'resource'])('watch reports a missing %s as compilation errors and recovers without invalidation', async missing => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-watch-test-')))
  const child = join(root, 'child.css'), resource = join(root, 'pixel.svg')
  writeFileSync(join(root, 'entry.js'), 'import "./entry.css"')
  writeFileSync(join(root, 'entry.css'), '@import "./child.css" layer(cards);@master entry;@preserve native;')
  const childCSS = '@import "https://external.invalid/font.css";.card{color:red;background-image:url("./pixel.svg")} '
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="7"/>'
  writeFileSync(child, childCSS);writeFileSync(resource, svg)
  const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
    experiments: { css: true }, output: { path: join(root, 'out'), filename: '[name].js', cssFilename: '[name].[contenthash:8].css' },
    plugins: [new Plugin({ mode: 'static', runtime: false }, root)] })
  let phase = 'initial'
  const watchRegistrations: unknown[] = []
  const events: unknown[] = []
  const trace = (event: string, detail: unknown = undefined) => {
    if (process.env.BH_TRACE_WATCH) events.push({ event, phase, detail })
  }
  compiler.hooks.invalid.tap('AuditTrace', file => trace('invalid', file))
  compiler.hooks.watchRun.tap({ name: 'AuditTraceBefore', stage: -100000 }, c => trace('watchRun:before', { modified: [...(c.modifiedFiles ?? [])], removed: [...(c.removedFiles ?? [])] }))
  compiler.hooks.watchRun.tap({ name: 'AuditTraceAfter', stage: 100000 }, () => trace('watchRun:after'))
  compiler.hooks.thisCompilation.tap('AuditTrace', compilation => {
    trace('thisCompilation')
    compilation.hooks.finishModules.tap({ name: 'AuditTraceBefore', stage: -100000 }, () => trace('finishModules:before'))
    compilation.hooks.finishModules.tap({ name: 'AuditTraceAfter', stage: 100000 }, () => trace('finishModules:after'))
  })
  const originalWatch = compiler.watchFileSystem!.watch.bind(compiler.watchFileSystem)
  compiler.watchFileSystem!.watch = (...args) => {
    watchRegistrations.push({ phase, childExists: existsSync(child), files: [...args[0]] })
    const callback = args[5]
    args[5] = (...values) => { trace('filesystem:aggregated', { changed: [...(values[3] ?? [])], removed: [...(values[4] ?? [])] });callback(...values) }
    const undelayed = args[6]
    args[6] = (...values) => { trace('filesystem:undelayed', values);undelayed?.(...values) }
    return originalWatch(...args)
  }
  type Result = { fatal?: Error | null, stats?: webpack.Stats }
  const results: Result[] = [], listeners = new Set<(result: Result) => void>()
  const next = (after: number, predicate: (result: Result) => boolean) => new Promise<Result>((resolve, reject) => {
    const existing = results.slice(after).find(predicate)
    if (existing) { resolve(existing); return }
    const callback = (result: Result) => { if (!predicate(result)) return; clearTimeout(timer); listeners.delete(callback); resolve(result) }
    const timer = setTimeout(() => { listeners.delete(callback); reject(new Error(`No automatic watch result in ${phase}; events=${JSON.stringify(events)}; registrations=${JSON.stringify(watchRegistrations)}; after=${after}, results=${JSON.stringify(results.map(result => ({ fatal: result.fatal?.message, errors: result.stats?.compilation.errors.map(error => error.message), dependencies: [...(result.stats?.compilation.fileDependencies ?? [])], missing: [...(result.stats?.compilation.missingDependencies ?? [])] })))}`)) }, 10000)
    listeners.add(callback)
  })
  const watch = compiler.watch({ aggregateTimeout: 20 }, (fatal, stats) => {
    trace('callback', { fatal: fatal?.message, errors: stats?.compilation.errors.map(e => e.message) })
    const result = { fatal, stats };results.push(result);for (const listener of listeners) listener(result)
  })
  try {
    await next(0, result => Boolean(result.stats && !result.stats.hasErrors() && result.stats.compilation.getAssets().some(asset => asset.name.endsWith('.css') && readFileSync(join(root, 'out', asset.name), 'utf8').includes('color:red'))))
    const beforeDelete = results.length, target = missing === 'child' ? child : resource
    phase = 'delete'
    unlinkSync(target)
    const failed = await next(beforeDelete, result => Boolean(result.fatal || result.stats?.hasErrors()))
    expect(failed.fatal).toBeNull()
    expect(failed.stats?.hasErrors()).toBe(true)
    expect(failed.stats?.compilation.missingDependencies).toContain(target)
    const beforeRestore = results.length
    phase = 'restore'
    writeFileSync(target, missing === 'child' ? childCSS.replace('red', 'green') : svg.replace('7', '9'))
    const restored = await next(beforeRestore, result => Boolean(result.stats && !result.stats.hasErrors()))
    expect(restored.fatal).toBeNull()
    expect(restored.stats?.compilation.fileDependencies).toContain(target)
    const css = restored.stats!.compilation.entrypoints.get('main')!.getFiles().find(file => file.endsWith('.css'))!
    expect(readFileSync(join(root, 'out', css), 'utf8')).toContain('@import')
    const beforeUnmanage = results.length
    phase = 'unmanage'
    writeFileSync(join(root, 'entry.css'), '.card{color:cyan}')
    const unmanaged = await next(beforeUnmanage, result => Boolean(result.stats && !result.stats.hasErrors() && result.stats.compilation.getAssets().some(asset => asset.name.endsWith('.css') && readFileSync(join(root, 'out', asset.name), 'utf8').includes('color:cyan'))))
    expect(unmanaged.stats?.compilation.fileDependencies).not.toContain(child)
    expect(unmanaged.stats?.compilation.fileDependencies).not.toContain(resource)
  } finally {
    if (watch) await new Promise<void>((resolve, reject) => watch.close(error => error ? reject(error) : resolve()))
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 30000)
