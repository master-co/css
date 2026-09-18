import type { DevEnvironment } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { clearFailedStylesheets, withStylesheetDependencies, type DependencyHost } from './failed-stylesheet-dependencies'
import { sendRecoveryError } from './recovery-error'
import { onEnvironmentClosing } from './environment-closing'

/** Manifest initialization can fail before an HTML or virtual module exists. */
export function createManifestRecovery<T, Host extends DependencyHost = DependencyHost>(
  context: MasterCSSVitePluginContext,
  id: string,
  load: (onDependency: (file: string) => void, host: Host, active: () => boolean) => Promise<T>
) {
  let failure: unknown
  let failed = false
  const closed = new WeakSet<object>()
  const tracked = new WeakSet<object>()
  let queue: Promise<unknown> = Promise.resolve()
  const run = (host: Host, isActive: () => boolean = () => true): Promise<T> => {
    if (host.environment && !tracked.has(host.environment)) {
      const environment = host.environment
      tracked.add(environment)
      onEnvironmentClosing(environment, () => {
        closed.add(environment)
        clearFailedStylesheets(context, environment)
      })
    }
    const active = () => isActive() && (!host.environment || !closed.has(host.environment))
    const operation = queue.then(async () => {
      if (!active()) throw new Error('Master CSS manifest environment closed')
      try {
        const result = await withStylesheetDependencies(context, host, id,
          onDependency => load(file => { if (active()) onDependency(file) }, host, active), 'manifest', recover)
        if (active()) { failed = false;failure = undefined }
        return result
      } catch (error) {
        if (active()) { failed = true;failure = error }
        throw error
      }
    })
    queue = operation.catch(() => {})
    return operation
  }
  const recover = async (owner: object, _id: string, _files: string[], active: () => boolean) => {
    const environment = owner as DevEnvironment
    try { await run({ environment } as Host, active) } catch (error) {
      if (active() && !closed.has(environment)) sendRecoveryError(environment, error, id)
      throw error
    }
    if (!active() || closed.has(environment)) return
    const module = environment.moduleGraph.getModuleById(id)
    if (module) environment.moduleGraph.invalidateModule(module)
    if (module && module.isSelfAccepting !== undefined) await environment.reloadModule(module)
    else if (environment.config.consumer === 'client') environment.hot.send({ type: 'full-reload', path: '*' })
  }
  return {
    run,
    assertReady() { if (failed) throw failure },
    get failed() { return failed },
    isActive(environment?: object) { return !environment || !closed.has(environment) },
    close(environment: object) { closed.add(environment) }
  }
}
