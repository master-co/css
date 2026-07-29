import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID } from '../common'
import { getScanner } from '../utils/scanner-context'

/** HMR when the config and source files changed */
export default function StyleEntryHMRPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let transformedIndexHTMLModule: { id: string, code: string }
  const servers: ViteDevServer[] = []
  const updateStylesheetImporters = async ({ server }: { server: ViteDevServer }) => {
    if (!server) return
    const affectedModuleIds = new Set(context.virtualCSSImporters || [])
    affectedModuleIds.add(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
    await Promise.all(Array.from(affectedModuleIds).map(async (eachModuleId) => {
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
    await updateStylesheetImporters({ server })
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
            .then(() => Promise.all(servers.map((eachServer) => updateStylesheetImporters({ server: eachServer }))))
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
