import { EMPTY_MANIFEST_JSON } from '@master/css-internal/manifest-module'
import { toInlineManifestModule } from '@master/css-internal/manifest-facade'
import { EMPTY_EMITTED_GLOBALS_MODULE } from '@master/css-internal/emitted-globals-module'
import { toInlineProgramModule } from '@master/css-internal/program-module'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

interface WebpackPluginAdapter {
  apply(compiler: Compiler): void
}

interface NativeVirtualModuleAdapter extends WebpackPluginAdapter {
  writeModule(path: string, content: string): void
}

type RspackCompiler = Compiler & {
  rspack?: {
    experiments?: { VirtualModulesPlugin?: new (modules: Record<string, string>) => NativeVirtualModuleAdapter }
    CssExtractRspackPlugin?: new () => WebpackPluginAdapter
  }
}

export function usesRspackCSSExtraction(compiler: Compiler) {
  const { rspack } = compiler as RspackCompiler
  const Extract = rspack?.CssExtractRspackPlugin
  return compiler.options.mode === 'development' && Boolean(
    rspack?.experiments?.VirtualModulesPlugin && Extract && compiler.options.plugins?.some(plugin => plugin instanceof Extract)
  )
}

function watchExtractedCSS(compiler: Compiler, cssPath: string) {
  const options = compiler.options.watchOptions
  if (options.ignored !== undefined) return
  // The extraction loader caches its separate CSS graph. Let Rspack watch this
  // exact virtual dependency while preserving its other default exclusions.
  const path = cssPath.split(/[/\\]/)
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join(String.raw`[/\\]`)
  options.ignored = new RegExp(String.raw`^(?!${path}$)[\s\S]*[/\\](?:\.git|node_modules)[/\\]`)
}

function useNativeVirtualModules(compiler: Compiler, driver: NativeVirtualModuleAdapter, initialModules: Record<string, string>) {
  driver.apply(compiler)
  const contents = new Map(Object.entries(initialModules))
  const pending = new Map<string, string>()
  let ready = false
  // Rspack initializes its native virtual file store before thisCompilation.
  // Register initial content first and defer writes from early hooks until then.
  compiler.hooks.thisCompilation.tap('MasterCSSVirtualModules', () => {
    if (ready) return
    for (const [path, content] of pending) driver.writeModule(path, content)
    pending.clear()
    ready = true
  })
  return {
    writeModule(path: string, content: string) {
      // Native writes notify the watcher even when the bytes do not change.
      if (contents.get(path) === content) return
      if (ready) driver.writeModule(path, content)
      else {
        initialModules[path] = content
        pending.set(path, content)
      }
      contents.set(path, content)
    }
  }
}

export default function VirtualModuleRegistryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const rspackCompiler = compiler as RspackCompiler
      const Native = rspackCompiler.rspack?.experiments?.VirtualModulesPlugin
      const initialModules = {
        // The first native CSS module is read before the scan finishes. Keep
        // the slot so the first emitted asset can already contain current CSS.
        [context.virtualCSSImportModuleId]: Native ? context.slotCSSRule : '',
        [context.virtualManifestModuleId]: toInlineManifestModule(EMPTY_MANIFEST_JSON),
        // A placeholder: resolving `virtual:master-css-program` writes the compiled program.
        [context.virtualProgramModuleId]: toInlineProgramModule(new Uint8Array()),
        [context.virtualEmittedGlobalsModuleId]: EMPTY_EMITTED_GLOBALS_MODULE
      }
      if (Native) {
        if (usesRspackCSSExtraction(compiler)) watchExtractedCSS(compiler, context.virtualCSSImportModuleId)
        context.virtualModule = useNativeVirtualModules(compiler, new Native(initialModules), initialModules)
      } else {
        const virtualModule = new VirtualModulesPlugin(initialModules)
        ;(virtualModule as unknown as WebpackPluginAdapter).apply(compiler)
        context.virtualModule = virtualModule
      }
      for (const [modulePath, moduleContent] of Object.entries(initialModules)) {
        context.writeVirtualModule(modulePath, moduleContent)
      }
    }
  }
}
