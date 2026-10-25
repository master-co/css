import type { ViteDevServer } from 'vite'

/**
 * Refresh a module whose generated content changed without a source edit.
 * Browsers take an HMR update. A server module that cannot accept the update is
 * only invalidated, so its runner refetches it on the next import: a program
 * reload would restart the runner under requests that are still rendering.
 */
export async function refreshGeneratedModule(server: ViteDevServer, id: string) {
  await Promise.all(Object.values(server.environments).map(async (environment) => {
    const module = environment.moduleGraph.getModuleById(id)
    if (!module) return
    if (environment.config.consumer === 'client' || module.isSelfAccepting) return environment.reloadModule(module)
    for (const each of (module.file && environment.moduleGraph.getModulesByFile(module.file)) || [module]) {
      environment.moduleGraph.invalidateModule(each)
    }
  }))
}
