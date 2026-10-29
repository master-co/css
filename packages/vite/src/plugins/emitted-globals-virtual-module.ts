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
import { createCoalescedTask } from '../utils/coalesced-task'

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

interface EnvironmentLifetime { promise: Promise<void>, close: () => void }

interface DevState {
  active: () => boolean
  served: Map<Environment, string>
  loading: Set<Environment>
  lifetimes: Map<Environment, EnvironmentLifetime>
  closedEnvironments: WeakSet<Environment>
  initialStylesheets?: Promise<void>
  publish: () => Promise<void>
  closeEnvironment: (environment: Environment) => void
}

export default function EmittedGlobalsVirtualModulePlugin(
  context: MasterCSSVitePluginContext,
  api: EmittedGlobalsPluginAPI = {}
): Plugin {
  const placeholder = '__MASTER_CSS_FINAL_EMITTED_GLOBALS__'
  let finalGlobals: string | undefined
  let dev: DevState | undefined
  const signature = (value: MasterCSSEmittedGlobals) => JSON.stringify(normalizeEmittedGlobals(value), (_key, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
  })
  return {
    name: 'master-css:virtual-module:emitted-globals',
    enforce: 'pre',
    api,
    configureServer(server) {
      if (dev) for (const environment of dev.lifetimes.keys()) dev.closeEnvironment(environment)
      const config = server.config
      let closed = false
      const served: DevState['served'] = new Map()
      const loading: DevState['loading'] = new Set()
      const lifetimes: DevState['lifetimes'] = new Map()
      const closedEnvironments = new WeakSet<Environment>()
      const active = () => !closed && dev === state && server.config === config
      const onError = (error: unknown) => { if (active()) server.config.logger.error(String(error)) }
      const publish = createCoalescedTask(async () => {
        if (!active() || !context.emittedGlobals) return
        const next = signature(context.emittedGlobals)
        const previous = new Map<Environment, string>()
        try {
          await refreshGeneratedModule(server, RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, environment => {
            if (loading.has(environment) || !served.has(environment) || served.get(environment) === next) return false
            previous.set(environment, served.get(environment)!)
            served.set(environment, next)
            return true
          })
        } catch (error) {
          for (const [environment, signature] of previous) if (served.get(environment) === next) served.set(environment, signature)
          throw error
        }
      }, onError)
      const state: DevState = dev = {
        active, served, loading, lifetimes, closedEnvironments, publish,
        closeEnvironment(environment) {
          served.delete(environment)
          loading.delete(environment)
          closedEnvironments.add(environment)
          lifetimes.get(environment)?.close()
          lifetimes.delete(environment)
        }
      }
      context.onEmittedGlobalsChange = () => { void publish() }
      context.refreshEmittedGlobals = createCoalescedTask(async () => {
        if (!active() || !served.size) return
        // Initial graph discovery is not an edit. Let its static imports settle
        // before composing their final ownership, without blocking a load hook.
        await Promise.all(Object.values(server.environments).filter(environment => served.has(environment)).map(environment =>
          Promise.race([environment.waitForRequestsIdle(), lifetimes.get(environment)!.promise])))
        if (!active() || !served.size) return
        await getExtractedCSSResult(context)
        await publish()
      }, onError)
      server.httpServer?.once('close', () => {
        closed = true
        for (const environment of lifetimes.keys()) state.closeEnvironment(environment)
      })
    },
    async resolveId(id) {
      if (id === VIRTUAL_EMITTED_GLOBALS_ID) return RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID
    },
    async load(id) {
      if (id !== RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID) return
      if (context.config?.command === 'build') return `export default JSON.parse(${JSON.stringify(placeholder)});`
      const environment = this.environment
      const state = context.config?.command === 'serve' && dev?.active() && !dev.closedEnvironments.has(environment) ? dev : undefined
      let lifetime: EnvironmentLifetime | undefined
      if (state) {
        lifetime = state.lifetimes.get(environment)!
        if (!lifetime) {
          let close!: () => void
          const promise = new Promise<void>(resolve => { close = resolve })
          lifetime = { promise, close }
          state.lifetimes.set(environment, lifetime)
        }
        state.loading.add(environment)
      }
      try {
        if (state) {
          state.initialStylesheets ??= (async () => {
            const entries = await discoverManifestEntries({ root: context.config?.root })
            for (const entry of entries) {
              if (context.stylesheets?.snapshot().sourceIds.includes(entry)) continue
              await registerStylesheetSource(context, entry, await readFile(entry, 'utf8'))
            }
          })().catch(error => { state.initialStylesheets = undefined; throw error })
          await state.initialStylesheets
        }
        const result = await getExtractedCSSResult(context)
        const globals = context.emittedGlobals ?? result.emittedGlobals
        if (state?.active() && state.lifetimes.get(environment) === lifetime) state.served.set(environment, signature(globals))
        if (state && environment.config.consumer === 'server') return toServerDevEmittedGlobalsModule(globals)
        return toEmittedGlobalsModule(globals)
      } finally {
        if (state && state.lifetimes.get(environment) === lifetime) { state.loading.delete(environment); void state.publish() }
      }
    },
    closeBundle() { dev?.closeEnvironment(this.environment) },
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
