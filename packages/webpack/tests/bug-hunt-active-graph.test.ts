import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, statSync, watch as watchFS, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'
import type { MasterCSSWebpackContext } from '../src/plugin'

interface Result {
  stats: webpack.Stats
  assets: Record<string, string>
}

async function watchScenario(cache: boolean, run: (state: {
  app: string
  styles: string
  plugin: Plugin
  step: (stage: string, imports: string[]) => Promise<Result>
}) => Promise<void>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-active-test-')))
  const app = join(root, 'app'), styles = join(root, 'styles')
  mkdirSync(app);mkdirSync(styles)
  writeFileSync(join(app, 'global.css'), '@master entry;@preserve native;.global{--global:kept}')
  const manifestImport = 'import manifest from "virtual:master-css-manifest";globalThis.auditManifest=manifest;'
  writeFileSync(join(app, 'entry.js'), `${manifestImport}globalThis.auditStage="initial"`)
  const plugin = new Plugin({ mode: 'static', runtime: false }, app)
  const trace = createWatchTrace(plugin, join(app, 'entry.js'))
  const compiler = webpack({ mode: 'production', context: app, entry: './entry.js', cache: cache ? { type: 'memory' } : false,
    resolve: { tsconfig: false }, experiments: { css: true },
    output: { path: join(app, 'out'), clean: true, filename: '[name].[contenthash:8].js', cssFilename: '[name].[contenthash:8].css' }, plugins: [plugin] })
  trace.attach(compiler)
  const results: (Result | Error)[] = [], listeners = new Set<() => void>()
  const watching = compiler.watch({ aggregateTimeout: 20, ...(process.env.BH_TRACE_POLL ? { poll: Number(process.env.BH_TRACE_POLL) } : {}) }, (error, stats) => {
    if (process.env.BH_TRACE_GRAPH && !process.env.BH_TRACE_DIRECTORY) console.log(JSON.stringify({
      error: error ? String(error) : undefined,
      files: stats ? [...stats.compilation.fileDependencies] : [],
      manifest: plugin.defaultManifestDependencies, scanner: plugin.scanner.resetDependencies,
      sources: plugin.stylesheets.snapshot(),
      modules: stats ? [...stats.compilation.modules].map(module => ({ resource: (module as webpack.NormalModule).resource })) : []
    }))
    results.push(error ?? (!stats || stats.hasErrors() ? new Error(stats?.toString({ all: false, errors: true })) : {
      stats, assets: Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(app, 'out', asset.name), 'utf8')]))
    }))
    const result = results.at(-1)
    trace.record('watch-result', { error: result instanceof Error ? result.message : undefined,
      stages: result instanceof Error ? [] : Object.entries(result?.assets ?? {}).filter(([file]) => file.endsWith('.js')).map(([, source]) => trace.stage(source)) })
    for (const listener of listeners) listener()
  })
  const waitFor = (after: number, stage: string) => new Promise<Result>((resolve, reject) => {
    const inspect = () => {
      const result = results.slice(after).find(row => row instanceof Error || Object.entries(row.assets).some(([file, source]) => file.endsWith('.js') && source.includes(`auditStage=${JSON.stringify(stage)}`)))
      if (!result) return
      clearTimeout(timer);listeners.delete(inspect)
      if (result instanceof Error) reject(result)
      else resolve(result)
    }
    const timer = setTimeout(() => { listeners.delete(inspect);reject(new Error(`No ${stage} watch result; callbacks=${results.length - after}`)) }, 12000)
    listeners.add(inspect);inspect()
  })
  try {
    await waitFor(0, 'initial')
    await run({ app, styles, plugin, step: async (stage, imports) => {
      const after = results.length
      trace.record('edit-entry', { stage })
      writeFileSync(join(app, 'entry.js'), `${manifestImport}${imports.map(file => `import ${JSON.stringify(file)};`).join('')}globalThis.auditStage=${JSON.stringify(stage)};`)
      return waitFor(after, stage)
    } })
  } finally {
    if (watching) await new Promise<void>((resolve, reject) => watching.close(error => error ? reject(error) : resolve()))
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    trace.flush()
    rmSync(root, { recursive: true, force: true })
  }
}

for (const cache of [false, true]) test(`removed stylesheet releases dependencies and restores on reattachment: cache=${cache}`, async () => {
  await watchScenario(cache, async ({ styles, plugin, step }) => {
    const sheet = join(styles, 'entry.css'), image = join(styles, 'pixel.svg')
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" id="owned"/>'
    writeFileSync(sheet, '@master entry;@preserve native;.owned{color:red;background-image:url("./pixel.svg")}')
    writeFileSync(image, svg)
    const attached = await step('attached', ['../styles/entry.css'])
    expect(Object.values(attached.assets)).toContain(svg)
    const detached = await step('detached', [])
    expect([...detached.stats.compilation.fileDependencies]).not.toContain(sheet)
    expect([...detached.stats.compilation.fileDependencies]).not.toContain(image)
    expect(plugin.stylesheets.snapshot().sourceIds).not.toContain(sheet)
    expect([...detached.stats.compilation.fileDependencies]).toContain(join(plugin.cwd, 'global.css'))
    const restored = await step('unchanged-reattached', ['../styles/entry.css'])
    expect(Object.values(restored.assets).join('\n')).toContain('color:red')
    expect(Object.values(restored.assets)).toContain(svg)
    await step('detached-again', [])
    rmSync(image)
    const unusedMissing = await step('unused-missing', [])
    expect([...unusedMissing.stats.compilation.missingDependencies]).not.toContain(image)
    writeFileSync(image, svg)
    const reattached = await step('reattached', ['../styles/entry.css'])
    expect(Object.values(reattached.assets)).toContain(svg)
  })
}, 120000)

test.each(Array.from({ length: Number(process.env.BH_TRACE_REPEAT || 1) }, (_, index) => index))('removal retains shared resource owners and clears detached scanner classes: %i', async () => {
  await watchScenario(true, async ({ styles, plugin, step }) => {
    const image = join(styles, 'shared.svg')
    writeFileSync(image, '<svg xmlns="http://www.w3.org/2000/svg" id="shared"/>')
    for (const name of ['a', 'b']) writeFileSync(join(styles, `${name}.css`), `@master entry;@preserve native;.${name}{background-image:url("./shared.svg")}`)
    writeFileSync(join(styles, 'usage.js'), `globalThis.ownedMarkup=${JSON.stringify('<div class="fg:red">owned</div>')}`)
    const both = await step('both', ['../styles/a.css', '../styles/b.css', '../styles/usage.js'])
    expect(plugin.validClasses.has('fg:red')).toBe(true)
    expect(Object.values(both.assets).join('\n')).toContain('.fg\\:red{')
    const one = await step('one', ['../styles/b.css'])
    expect([...one.stats.compilation.fileDependencies]).toContain(image)
    expect(plugin.stylesheets.snapshot().sourceIds).toEqual([join(styles, 'b.css')])
    expect(plugin.validClasses.has('fg:red')).toBe(false)
    expect(Object.values(one.assets).join('\n')).not.toContain('.fg\\:red{')
    expect(Object.values(one.assets).join('\n')).toContain('.b{')
    const none = await step('none', [])
    expect([...none.stats.compilation.fileDependencies]).not.toContain(image)
  })
}, 120000)

/** Optional diagnostics for owned watch tests; events stay in memory until close. */
function createWatchTrace(plugin: Plugin, entry: string) {
  const events: unknown[] = []
  const enabled = process.env.BH_TRACE_GRAPH === '1'
  const record = (event: string, data: object = {}) => {
    if (enabled) events.push({ event, time: Date.now(), ...data })
  }
  const nativeWatcher = enabled && process.env.BH_TRACE_RAW_FS === '1'
    ? watchFS(dirname(entry), (type, filename) => record('independent-fs-event', { type, filename })) : undefined
  const tracedDirectories = new WeakSet<object>()
  const stage = (source: string) => source.match(/auditStage\s*=\s*["']([^"']+)/)?.[1]
  const disk = () => ({ stage: stage(readFileSync(entry, 'utf8')), mtime: statSync(entry).mtimeMs })
  if (enabled) {
    const host = plugin as unknown as { createContext(compiler: webpack.Compiler): MasterCSSWebpackContext }
    const createContext = host.createContext.bind(plugin)
    host.createContext = compiler => {
      const context = createContext(compiler)
      const write = context.writeVirtualModule
      context.writeVirtualModule = (file, content) => {
        record('virtual-write', { file, bytes: content.length })
        return write(file, content)
      }
      return context
    }
  }
  return {
    record,
    stage,
    attach(compiler: webpack.Compiler) {
      if (!enabled) return
      compiler.hooks.invalid.tap('AuditWatchTrace', (file, time) => record('invalid', { file, reportedTime: time }))
      compiler.hooks.watchRun.tap({ name: 'AuditWatchTrace', stage: -1000000 }, compiler => {
        record('watch-run', { modified: [...(compiler.modifiedFiles ?? [])], removed: [...(compiler.removedFiles ?? [])] })
      })
      compiler.hooks.thisCompilation.tap('AuditWatchTrace', compilation => {
        record('compilation')
        compilation.hooks.buildModule.tap('AuditWatchTrace', module => {
          if ((module as webpack.NormalModule).resource === entry) record('build-entry')
        })
        compilation.hooks.succeedModule.tap('AuditWatchTrace', module => {
          if ((module as webpack.NormalModule).resource === entry) record('entry-succeeded', { source: stage(String(module.originalSource()?.source())) })
        })
        compilation.hooks.finishModules.tap('AuditWatchTrace', modules => {
          const module = [...modules].find(module => (module as webpack.NormalModule).resource === entry)
          record('finish-modules', { source: stage(String(module?.originalSource()?.source())) })
        })
      })
      const filesystem = compiler.watchFileSystem!
      const watch = filesystem.watch.bind(filesystem)
      filesystem.watch = (...args) => {
        record('watch-registration', { entryWatched: [...args[0]].includes(entry), startTime: args[3] })
        const callback = args[5], undelayed = args[6]
        args[5] = (...values) => {
          record('filesystem-aggregated', { changed: [...(values[3] ?? [])], removed: [...(values[4] ?? [])], entryTime: values[1]?.get(entry) })
          return callback(...values)
        }
        args[6] = (file, time) => {
          record('filesystem-undelayed', { file, reportedTime: time })
          return undelayed?.(file, time)
        }
        const result = watch(...args)
        if (process.env.BH_TRACE_DIRECTORY_DETAIL === '1') {
          type DirectoryTrace = {
            path: string
            closed: boolean
            initialScan: boolean
            files: Map<string, { timestamp: number, safeTime: number }>
            watcher?: { on?(event: string, listener: (...args: unknown[]) => void): void }
            close(): void
            setFileTime(target: string, mtime: number, initial: boolean, ignoreWhenEqual: boolean, type: string): void
          }
          const current = (filesystem as unknown as {
            watcher: { fileWatchers: Map<string, { watcher: { directoryWatcher: DirectoryTrace } }> }
          }).watcher.fileWatchers.get(entry)?.watcher.directoryWatcher
          record('directory-attached', { found: !!current, initialScan: current?.initialScan, entryTime: { ...current?.files.get(entry) } })
          if (current && !tracedDirectories.has(current)) {
            tracedDirectories.add(current)
            current.watcher?.on?.('change', (type, filename) => record('directory-native-event', { type, filename }))
            const setFileTime = current.setFileTime.bind(current)
            current.setFileTime = (target, mtime, initial, ignoreWhenEqual, type) => {
              if (target === entry) record('directory-stat-entry', { mtime, initial, ignoreWhenEqual, type, before: { ...current.files.get(entry) } })
              setFileTime(target, mtime, initial, ignoreWhenEqual, type)
              if (target === entry) record('directory-entry-stored', { entryTime: { ...current.files.get(entry) } })
            }
            const close = current.close.bind(current)
            current.close = () => { record('directory-close', { path: current.path });close() }
          }
        }
        return result
      }
    },
    flush() {
      nativeWatcher?.close()
      if (!enabled) return
      const output = JSON.stringify({ watchTrace: events, finalDisk: disk() })
      if (process.env.BH_TRACE_DIRECTORY) {
        writeFileSync(join(process.env.BH_TRACE_DIRECTORY, `watch-${basename(dirname(dirname(entry)))}.json`), output, { flag: 'wx' })
      } else console.log(output)
    }
  }
}
