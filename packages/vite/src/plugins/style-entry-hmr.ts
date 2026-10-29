import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import { getScanner, ensureScanner, releaseScannerEnvironment } from '../utils/scanner-context'
import { refreshGeneratedModule } from '../utils/dev-module-refresh'
import { createCoalescedTask } from '../utils/coalesced-task'

/** HMR when the config and source files changed */
export default function StyleEntryHMRPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let transformedIndexHTMLModule: { id: string, code: string }
  const servers = new Map<ResolvedConfig, ViteDevServer>()
  const attachedScanners = new WeakSet<object>()
  const updateStylesheetImporters = async ({ server }: { server: ViteDevServer }) => {
    if (!server) return
    const affectedModuleIds = new Set(context.virtualCSSImporters || [])
    await context.refreshEmittedGlobals?.()
    await Promise.all(Array.from(affectedModuleIds).map((eachModuleId) => refreshGeneratedModule(server, eachModuleId)))
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
  }
  return {
    name: 'master-css:style-entry:hmr',
    enforce: 'pre',
    apply: 'serve',
    buildStart() {
      const attach = () => {
        const scanner = getScanner(context)
        if (attachedScanners.has(scanner)) return
        attachedScanners.add(scanner)
        let resetChain: Promise<unknown> = Promise.resolve()
        const onError = (label: string) => (err: unknown) => {
          console.error(`[master-css.vite] ${label} failed:`, err)
        }
        const scheduleUpdate = createCoalescedTask(async () => {
          await resetChain
          await Promise.all([...servers.values()].map(server => updateStylesheetImporters({ server })))
        }, onError('hmr update'))
        scanner
          .on('reset', () => {
            resetChain = resetChain
              .then(() => Promise.all([...servers.values()].map((eachServer) => handleReset({ server: eachServer }))))
              .catch(onError('reset'))
              .then(() => { void scheduleUpdate() })
          })
          .on('change', () => {
            void scheduleUpdate()
          })
      }
      if (context.scanner) return attach()
      return ensureScanner(_options, context).then(attach)
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
    closeBundle() {
      const config = this.environment?.getTopLevelConfig() ?? context.config
      if (config && releaseScannerEnvironment(context, config, this.environment)) servers.delete(config)
    },
    configureServer(server) {
      servers.set(server.config, server)
    }
  }
}
