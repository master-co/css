import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, type ResolvedConfig } from 'vite'
import { expect, test } from 'vitest'
import masterCSS, { type MasterCSSVitePluginContext } from '../../src/core'
import BuildStylesheetRecoveryPlugin from '../../src/plugins/build-stylesheet-recovery'
import { withStylesheetDependencies } from '../../src/utils/failed-stylesheet-dependencies'

function files(directory: string): string[] {
  try { return readdirSync(directory, { recursive: true }).map(String).filter(name => name.endsWith('invalidate')) } catch { return [] }
}
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-recovery-ownership-'))), cacheDir = join(root, '.vite')
  return { root, cacheDir, close() { rmSync(root, { recursive: true, force: true }) } }
}

test('a configuration error does not allocate build recovery files', async () => {
  const f = fixture()
  try {
    await expect(build({ root: f.root, cacheDir: f.cacheDir, configFile: false, logLevel: 'silent', build: { watch: {} },
      plugins: [masterCSS({ mode: 'static', runtime: false }), { name: 'config-failure', configResolved() { throw new Error('intentional config error') } }]
    })).rejects.toThrow('intentional config error')
    expect(files(f.cacheDir)).toEqual([])
  } finally { f.close() }
})

test('closing one build owner preserves recovery for another already started owner', async () => {
  const f = fixture(), first = {}, second = {}
  const config = { command: 'build', cacheDir: f.cacheDir, build: { watch: {} } } as ResolvedConfig
  const context: MasterCSSVitePluginContext = { config }, plugin = BuildStylesheetRecoveryPlugin(context)
  const hook = (name: 'configResolved' | 'buildStart' | 'closeWatcher', host: object, ...args: unknown[]) => {
    const value = plugin[name]
    const handler = typeof value === 'function' ? value : value && 'handler' in value ? value.handler : undefined
    return (handler as ((...args: unknown[]) => unknown) | undefined)?.apply(host, args)
  }
  const failing = async (environment: object) => {
    await expect(withStylesheetDependencies(context, { environment, addWatchFile() {} }, join(f.root, 'style.css'), async dependency => {
      dependency(join(f.root, 'missing.css'));throw new Error('missing reference')
    })).rejects.toThrow('missing reference')
  }
  try {
    await hook('configResolved', {}, config)
    await hook('buildStart', { environment: first })
    await hook('buildStart', { environment: second })
    await failing(first)
    expect(files(f.cacheDir)).toHaveLength(1)
    await hook('closeWatcher', { environment: first })
    await failing(second)
    expect(files(f.cacheDir)).toHaveLength(1)
    await hook('closeWatcher', { environment: second })
    expect(files(f.cacheDir)).toEqual([])
  } finally { await hook('closeWatcher', { environment: first });await hook('closeWatcher', { environment: second });f.close() }
})

test('independent plugin configurations sharing a cache directory release only their own files', async () => {
  const f = fixture(), roots = [join(f.root, 'first'), join(f.root, 'second')], watchers: { close(): Promise<void> }[] = []
  const plugins = masterCSS({ mode: 'static', runtime: false })
  try {
    for (const root of roots) {
      mkdirSync(root)
      writeFileSync(join(root, 'style.css'), '@reference "./missing.css";.target{@compose paint;}')
      writeFileSync(join(root, 'entry.js'), 'import "./style.css"')
      const watcher = await build({ root, cacheDir: f.cacheDir, configFile: false, logLevel: 'silent', plugins, build: { watch: {}, rolldownOptions: { input: join(root, 'entry.js') } } })
      if (!('on' in watcher)) throw new Error('Expected watcher')
      watchers.push(watcher)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Initial build timeout')), 5000)
        watcher.on('event', event => { if (event.code === 'ERROR') { clearTimeout(timeout);resolve() } })
      })
    }
    expect(files(f.cacheDir)).toHaveLength(2)
    await watchers[0].close()
    expect(files(f.cacheDir)).toHaveLength(1)
    await watchers[1].close()
    expect(files(f.cacheDir)).toEqual([])
  } finally { await Promise.all(watchers.map(watcher => watcher.close()));f.close() }
})
