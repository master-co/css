import { statSync, type Stats } from 'node:fs'
import { stat } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { createFilter, type ViteDevServer, type ResolvedConfig } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'

export type FailedDependencyRecovery = (environment: object, id: string, changed: string[], active: () => boolean) => Promise<void>
interface Pending {
  id: string
  versions: Map<string, string>
  recover?: FailedDependencyRecovery
}
interface State {
  pending: Map<object, Map<string, Pending>>
  closed: WeakSet<object>
  recover: FailedDependencyRecovery
  accepts: (file: string, stats?: Stats) => boolean
  timer?: ReturnType<typeof setTimeout>
  running: boolean
}
const states = new WeakMap<MasterCSSVitePluginContext, State>()
function version(stats: Stats) { return `${stats.dev}:${stats.ino}:${stats.size}:${stats.mtimeMs}:${stats.ctimeMs}` }
function missing(error: unknown) { return `error:${(error as NodeJS.ErrnoException).code ?? 'unknown'}` }

/** Recheck only failed operations; successful stylesheets continue to use Vite HMR. */
export function configureFailedDependencyReconciliation(context: MasterCSSVitePluginContext, server: ViteDevServer, recover: FailedDependencyRecovery) {
  clearFailedDependencyReconciliation(context)
  const ignored = server.watcher.options.ignored
  const matchers = ignored === undefined ? [] : Array.isArray(ignored) ? ignored : [ignored]
  const filter = createFilter(undefined, matchers.filter((matcher): matcher is string | RegExp => typeof matcher !== 'function'), { resolve: false })
  states.set(context, {
    pending: new Map(), closed: new WeakSet(), recover, running: false,
    accepts: (file, stats) => server.config.server.watch !== null && isAbsolute(file) && filter(file)
      && !matchers.some(matcher => typeof matcher === 'function' && (matcher as (file: string, stats?: Stats) => boolean)(file, stats))
  })
}

/** Failed build transforms need a watched existing file to trigger another run. */
export function configureBuildDependencyReconciliation(context: MasterCSSVitePluginContext, watch: NonNullable<ResolvedConfig['build']['watch']>) {
  if (states.has(context)) return
  const accepts = createFilter(watch.include, watch.exclude, { resolve: false })
  states.set(context, { pending: new Map(), closed: new WeakSet(), running: false,
    recover: async () => {}, accepts: file => isAbsolute(file) && accepts(file) })
}

/** A real host event already schedules compilation; avoid a duplicate fallback. */
export function acknowledgeFailedDependencyChange(context: MasterCSSVitePluginContext, file: string) {
  const state = states.get(context)
  if (!state) return
  const value = failedDependencyVersion(context, file)
  if (value === undefined) return
  for (const jobs of state.pending.values()) {
    for (const entry of jobs.values()) if (entry.versions.has(file)) entry.versions.set(file, value)
  }
}

/** Capture before the compiler reads a dependency, including its missing state. */
export function failedDependencyVersion(context: MasterCSSVitePluginContext, file: string): string | undefined {
  const state = states.get(context)
  if (!state || !isAbsolute(file)) return
  let stats: Stats | undefined, value: string
  try { stats = statSync(file);value = version(stats) } catch (error) { value = missing(error) }
  return state.accepts(file, stats) ? value : undefined
}

export function trackFailedDependencyReconciliation(context: MasterCSSVitePluginContext, environment: object, key: string, id: string, versions: Map<string, string>, recover?: FailedDependencyRecovery) {
  const state = states.get(context)
  if (!state || state.closed.has(environment) || !versions.size) return
  let pending = state.pending.get(environment)
  if (!pending) { pending = new Map();state.pending.set(environment, pending) }
  pending.set(key, { id, versions, recover })
  schedule(context, state)
}

export function forgetFailedDependencyReconciliation(context: MasterCSSVitePluginContext, environment: object, key: string) {
  const state = states.get(context), pending = state?.pending.get(environment)
  pending?.delete(key)
  if (!pending?.size) state?.pending.delete(environment)
  if (state && !state.pending.size) { clearTimeout(state.timer);state.timer = undefined }
}

export function clearFailedDependencyReconciliation(context: MasterCSSVitePluginContext, environment?: object) {
  const state = states.get(context)
  if (!state) return
  if (environment) {
    state.closed.add(environment)
    state.pending.delete(environment)
  } else { state.pending.clear();states.delete(context) }
  if (!state.pending.size) { clearTimeout(state.timer);state.timer = undefined }
}

function schedule(context: MasterCSSVitePluginContext, state: State) {
  if (state.timer || state.running || !state.pending.size || states.get(context) !== state) return
  state.timer = setTimeout(() => { state.timer = undefined;void reconcile(context, state) }, 100)
  state.timer.unref()
}

async function reconcile(context: MasterCSSVitePluginContext, state: State) {
  state.running = true
  try {
    const jobs = [...state.pending].flatMap(([environment, entries]) => [...entries].map(([key, entry]) => ({ environment, key, entry })))
    const files = [...new Set(jobs.flatMap(({ entry }) => [...entry.versions.keys()]))]
    const current = new Map(await Promise.all(files.map(async file => {
      let stats: Stats | undefined, value: string
      try { stats = await stat(file);value = version(stats) } catch (error) { value = missing(error) }
      return [file, state.accepts(file, stats) ? value : undefined] as const
    })))
    for (const { environment, key, entry } of jobs) {
      const active = () => states.get(context) === state && !state.closed.has(environment)
      if (!active() || state.pending.get(environment)?.get(key) !== entry) continue
      const changed: string[] = []
      for (const [file, before] of entry.versions) {
        const after = current.get(file)
        if (after === undefined) entry.versions.delete(file)
        else if (after !== before) { entry.versions.set(file, after);changed.push(file) }
      }
      if (!entry.versions.size) forgetFailedDependencyReconciliation(context, environment, key)
      if (changed.length) {
        // A new compilation failure records a new baseline. Do not retry the
        // same failed contents continuously or synthesize filesystem events.
        try { await (entry.recover ?? state.recover)(environment, entry.id, changed, active) } catch { /* Original transform diagnostics remain visible. */ }
      }
    }
  } finally { state.running = false;schedule(context, state) }
}
