import type { Plugin } from 'vite'
import { toEmittedGlobalsModule } from '@master/css-internal/emitted-globals-module'
import MagicString from 'magic-string'
import type { MasterCSSVitePluginContext } from '../core'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, VIRTUAL_EMITTED_GLOBALS_ID } from '../common'
import { getExtractedCSSResult } from '../utils/extracted-css'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { readFile } from 'node:fs/promises'
import { registerStylesheetSource } from '../utils/register-style-source'

export default function EmittedGlobalsVirtualModulePlugin(
  context: MasterCSSVitePluginContext
): Plugin {
  const placeholder = '__MASTER_CSS_FINAL_EMITTED_GLOBALS__'
  let finalGlobals: string | undefined
  let initialStylesheets: Promise<void> | undefined
  return {
    name: 'master-css:virtual-module:emitted-globals',
    enforce: 'pre',
    configureServer(server) {
      context.onEmittedGlobalsChange = () => {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
        if (module) void server.reloadModule(module).catch(error => server.config.logger.error(String(error)))
      }
    },
    async resolveId(id) {
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID) return
      if (context.config?.command === 'build') return `export default JSON.parse(${JSON.stringify(placeholder)});`
      if (context.config?.command === 'serve') {
        initialStylesheets ??= (async () => {
          const entries = await discoverManifestEntries({ root: context.config?.root })
          for (const entry of entries) {
            if (context.stylesheets?.snapshot().sourceIds.includes(entry)) continue
            await registerStylesheetSource(context, entry, await readFile(entry, 'utf8'))
          }
        })().catch(error => { initialStylesheets = undefined; throw error })
        await initialStylesheets
      }
      const result = await getExtractedCSSResult(context)
      return toEmittedGlobalsModule(result.emittedGlobals)
    },
    shouldTransformCachedModule({ id }) { return id === RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID },
    renderStart: {
      order: 'post',
      async handler() {
        if (context.config?.command !== 'build') return
        const result = await getExtractedCSSResult(context)
        finalGlobals = JSON.stringify(result.emittedGlobals)
      }
    },
    renderChunk(code) {
      if (finalGlobals === undefined || !code.includes(placeholder)) return
      const output = new MagicString(code)
      for (const match of code.matchAll(new RegExp(`(["'])${placeholder}\\1`, 'g'))) {
        output.overwrite(match.index, match.index + match[0].length, JSON.stringify(finalGlobals))
      }
      return { code: output.toString(), map: output.generateMap({ hires: true }) }
    }
  }
}
