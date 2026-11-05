import { SyncHook } from 'tapable'
import type { Compiler } from 'webpack'
import { expect, test } from 'vitest'
import type { MasterCSSWebpackContext } from '../src/plugin'
import VirtualModuleRegistryPlugin from '../src/plugins/virtual-modules'

test.each(['extracting', 'configured', 'native'] as const)('registers native CSS for the %s watcher', kind => {
  const css = '/app [worktree]/node_modules/.master-css/master-utilities.css'
  const manifest = '/app/manifest.js'
  const slot = '#master-css-slot{--slot:0}'
  const written: [string, string][] = []
  let initial: Record<string, string> | undefined
  let storeReady = false
  let applied = false
  class NativeVirtualModules {
    constructor(modules: Record<string, string>) { initial = modules }
    apply() { applied = true }
    writeModule(path: string, content: string) {
      expect(storeReady).toBe(true)
      written.push([path, content])
    }
  }
  class CssExtractRspackPlugin {
    readonly options = {}
  }
  const thisCompilation = new SyncHook<[]>([])
  const configuredIgnore = /custom/
  const options = {
    mode: 'development',
    plugins: kind === 'native' ? [] : [new CssExtractRspackPlugin()],
    watchOptions: { ignored: kind === 'configured' ? configuredIgnore : undefined as RegExp | undefined }
  }
  const compiler = {
    rspack: { CssExtractRspackPlugin, experiments: { VirtualModulesPlugin: NativeVirtualModules } },
    hooks: { thisCompilation },
    options
  }
  const context = {
    virtualCSSImportModuleId: css,
    virtualManifestModuleId: manifest,
    virtualProgramModuleId: '/app/program.js',
    virtualEmittedGlobalsModuleId: '/app/globals.js',
    slotCSSRule: slot,
    virtualModule: undefined as MasterCSSWebpackContext['virtualModule'],
    writeVirtualModule(path: string, content: string) { this.virtualModule?.writeModule(path, content) }
  }
  VirtualModuleRegistryPlugin(context as MasterCSSWebpackContext).apply(compiler as unknown as Compiler)
  expect(applied).toBe(true)
  expect(initial?.[css]).toBe(slot)
  expect(written).toEqual([])
  if (kind === 'extracting') {
    const ignored = options.watchOptions.ignored!
    expect(ignored.test(css)).toBe(false)
    expect(ignored.test(css.replaceAll('/', '\\'))).toBe(false)
    expect(ignored.test(css.replace('app [worktree]', 'another'))).toBe(true)
    expect(ignored.test(css.replace('master-utilities.css', 'different.css'))).toBe(true)
    expect(ignored.test('/app [worktree]/.git/HEAD')).toBe(true)
    expect(ignored.test('/app [worktree]/src/style.css')).toBe(false)
  } else {
    expect(options.watchOptions.ignored).toBe(kind === 'configured' ? configuredIgnore : undefined)
  }

  const early = '.early{color:red}'
  context.writeVirtualModule(css, early)
  expect(initial?.[css]).toBe(early)
  expect(written).toEqual([])

  storeReady = true
  thisCompilation.call()
  context.writeVirtualModule(css, early)
  context.writeVirtualModule(css, '.updated{color:blue}')
  context.writeVirtualModule(css, '.updated{color:blue}')
  context.writeVirtualModule(manifest, 'export default {};')
  thisCompilation.call()
  expect(written).toEqual([[css, early], [css, '.updated{color:blue}'], [manifest, 'export default {};']])
})
