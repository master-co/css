import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'
import { getScanner } from '../utils/scanner-context'

/** HMR when the config and source files changed */
export default function StyleEntryHMRPlugin(_options: PluginOptions, context: PluginContext): Plugin {
  let transformedIndexHTMLModule: { id: string, code: string }
  const servers: ViteDevServer[] = []
  const updateStyleCSSImporters = async ({ server }: { server: ViteDevServer }) => {
    if (!server) return
    const virtualCSSImporters = Array.from(context.virtualCSSImporters || [])
    await Promise.all(virtualCSSImporters.map(async (eachModuleId) => {
      const eachModule = server.moduleGraph.getModuleById(eachModuleId)
      if (eachModule) {
        await server.reloadModule(eachModule)
      }
    }))
  }
  const handleReset = async ({ server }: { server: ViteDevServer }) => {
    const scanner = getScanner(context)
    const tasks: Promise<unknown>[] = []
    if (transformedIndexHTMLModule) {
      tasks.push(scanner.scanModule(transformedIndexHTMLModule.id, transformedIndexHTMLModule.code))
    }
    tasks.push(
      ...Array.from(server.moduleGraph.idToModuleMap.keys())
        .filter((eachModuleId) => !eachModuleId.startsWith('\0'))
        .map(async (eachModuleId: string) => {
          const eachModule = server.moduleGraph.idToModuleMap.get(eachModuleId)
          if (eachModule) {
            let eachModuleCode = eachModule?.transformResult?.code || eachModule?.ssrTransformResult?.code
            if (eachModule.file && !eachModuleCode && !eachModule.file.startsWith('virtual:') && existsSync(eachModule.file)) {
              eachModuleCode = readFileSync(eachModule.file, 'utf-8')
            }
            if (eachModuleCode)
              await scanner.scanModule(eachModuleId, eachModuleCode)
          }
        })
    )
    await Promise.all(tasks)
    await updateStyleCSSImporters({ server })
  }
  return {
    name: 'master-css:style-entry:hmr',
    enforce: 'pre',
    apply: 'serve',
    buildStart() {
      let resetChain: Promise<unknown> = Promise.resolve()
      let updateChain: Promise<unknown> = Promise.resolve()
      const onError = (label: string) => (err: unknown) => {
        console.error(`[master-css.vite] ${label} failed:`, err)
      }
      getScanner(context)
        .on('reset', () => {
          resetChain = resetChain
            .then(() => Promise.all(servers.map((eachServer) => handleReset({ server: eachServer }))))
            .catch(onError('reset'))
        })
        .on('change', () => {
          updateChain = updateChain
            .then(() => Promise.all(servers.map((eachServer) => updateStyleCSSImporters({ server: eachServer }))))
            .catch(onError('hmr update'))
        })
    },
    transformIndexHtml: {
      order: 'pre',
      handler: async (html, { filename }) => {
        transformedIndexHTMLModule = {
          id: filename,
          code: html
        }
        await getScanner(context).scanModule(filename, html)
      }
    },
    configureServer(server) {
      servers.push(server)
    }
  }
}
