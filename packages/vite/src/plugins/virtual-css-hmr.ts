import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import type { PluginContext } from '../core'
import type { PluginOptions } from '../options'

/** HMR when the config and source files changed */
export default function VirtualCSSHMRPlugin(_options: PluginOptions, context: PluginContext): Plugin {
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
        const tasks: Promise<unknown>[] = []
        /* 1. fixed sources — schedule, do not await inline (the whole point of
              the tasks[] + Promise.all pattern below is parallelism). */
        tasks.push(context.extractor.prepare())
        /* 2. transform index.html */
        if (transformedIndexHTMLModule) {
            tasks.push(context.extractor.insert(transformedIndexHTMLModule.id, transformedIndexHTMLModule.code))
        }
        /* 3. transformed modules — Array#concat returns a NEW array and does
              not mutate `tasks`; the previous `tasks.concat(...)` discarded
              every promise here, so HMR could publish CSS before reset had
              finished re-extracting open modules. Push spread instead. */
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
                            await context.extractor.insert(eachModuleId, eachModuleCode)
                    }
                })
        )
        await Promise.all(tasks)
        await updateStyleCSSImporters({ server })
    }
    return {
        name: 'master-css:static:css-import:hmr',
        enforce: 'pre',
        apply: 'serve',
        buildStart() {
            // EventEmitter does not await async listeners. The previous
            // implementation (a) did not await `handleReset`, so HMR
            // could publish CSS before the reset's re-extraction had
            // finished, and (b) had no overlap protection — two saves
            // arriving in quick succession would mutate `extractor.css`
            // concurrently. Serialise both queues onto a Promise chain
            // and surface failures instead of dropping them on the floor.
            let resetChain: Promise<unknown> = Promise.resolve()
            let updateChain: Promise<unknown> = Promise.resolve()
            const onError = (label: string) => (err: unknown) => {
                console.error(`[master-css.vite] ${label} failed:`, err)
            }
            context.extractor
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
                await context.extractor.insert(filename, html)
            }
        },
        configureServer(server) {
            servers.push(server)
        }
    }
}
