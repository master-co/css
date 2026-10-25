import type { Environment, Plugin } from 'vite'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import { normalizeEmittedGlobals, toEmittedGlobalsModule } from '@master/css-internal/emitted-globals-module'
import MagicString from 'magic-string'
import type { MasterCSSVitePluginContext } from '../core'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, VIRTUAL_EMITTED_GLOBALS_ID } from '../common'
import { getExtractedCSSResult } from '../utils/extracted-css'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { readFile } from 'node:fs/promises'
import { registerStylesheetSource } from '../utils/register-style-source'
import { refreshGeneratedModule } from '../utils/dev-module-refresh'

// Server programs keep the handle they built from these globals, so a dev update
// replaces the contents of one object instead of re-running its importers.
function toServerDevEmittedGlobalsModule(emittedGlobals: MasterCSSEmittedGlobals) {
  return [
    'const emittedGlobals = import.meta.hot?.data.emittedGlobals ?? {};',
    'for (const key of Object.keys(emittedGlobals)) delete emittedGlobals[key];',
    `Object.assign(emittedGlobals, ${JSON.stringify(normalizeEmittedGlobals(emittedGlobals))});`,
    'if (import.meta.hot) {',
    '  import.meta.hot.data.emittedGlobals = emittedGlobals;',
    '  import.meta.hot.accept();',
    '}',
    'export default emittedGlobals;'
  ].join('\n')
}

/**
 * The plugin's `api`, shared by every configuration that one plugin instance
 * resolves. Adapters whose build links one environment's stylesheets on pages
 * that load another environment's bundle set `finalize`.
 */
export interface EmittedGlobalsPluginAPI {
  /** Receives each build environment's emitted globals as its output renders and returns the ones that output carries. */
  finalize?: (environment: Environment, emittedGlobals: Required<MasterCSSEmittedGlobals>) => MasterCSSEmittedGlobals
}

export default function EmittedGlobalsVirtualModulePlugin(
  context: MasterCSSVitePluginContext,
  api: EmittedGlobalsPluginAPI = {}
): Plugin {
  const placeholder = '__MASTER_CSS_FINAL_EMITTED_GLOBALS__'
  let finalGlobals: string | undefined
  let initialStylesheets: Promise<void> | undefined
  return {
    name: 'master-css:virtual-module:emitted-globals',
    enforce: 'pre',
    api,
    configureServer(server) {
      context.onEmittedGlobalsChange = () => {
        void refreshGeneratedModule(server, RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID).catch(error => server.config.logger.error(String(error)))
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
      if (context.config?.command === 'serve' && this.environment.config.consumer === 'server') {
        return toServerDevEmittedGlobalsModule(result.emittedGlobals)
      }
      return toEmittedGlobalsModule(result.emittedGlobals)
    },
    shouldTransformCachedModule({ id }) { return id === RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID },
    renderStart: {
      order: 'post',
      async handler() {
        if (context.config?.command !== 'build') return
        const { emittedGlobals } = await getExtractedCSSResult(context)
        finalGlobals = JSON.stringify(api.finalize ? normalizeEmittedGlobals(api.finalize(this.environment, emittedGlobals)) : emittedGlobals)
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
