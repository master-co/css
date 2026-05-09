import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import { PluginContext } from '../core'
import { PluginOptions } from '../options'
import getExtractedCSS from '../utils/extracted-css'

const HMR_EVENT_UPDATE = 'master-css-hmr:update'

/** HMR when the config and source files changed */
export default function VirtualCSSHMRPlugin(options: PluginOptions, context: PluginContext): Plugin {
    let transformedIndexHTMLModule: { id: string, code: string }
    const servers: ViteDevServer[] = []
    const updateVirtualModule = async ({ server, timestamp = Date.now() }: { server: ViteDevServer, timestamp?: number }) => {
        if (!server) return
        const resolvedVirtualModuleId = context.extractor.resolvedVirtualModuleId
        const virtualCSSModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (virtualCSSModule) {
            const css = await getExtractedCSS(context)
            // Awaited so the C4 serialisation chain in `buildStart()` is
            // observable: without this, the update chain resolves before
            // the heavy module-graph reload completes, and a second
            // `change` could overlap a first.
            await server.reloadModule(virtualCSSModule)
            server.ws.send({
                type: 'update',
                updates: [{
                    type: 'js-update',
                    path: resolvedVirtualModuleId,
                    acceptedPath: resolvedVirtualModuleId,
                    timestamp
                }]
            })
            server.ws.send({
                type: 'custom',
                event: HMR_EVENT_UPDATE,
                data: {
                    id: resolvedVirtualModuleId,
                    css,
                    timestamp
                }
            })
        }
        return virtualCSSModule
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
                .filter((eachModuleId) => eachModuleId !== context.extractor.resolvedVirtualModuleId)
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
        await updateVirtualModule({ server })
    }
    return {
        name: 'master-css:static:virtual-css-module:hmr',
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
                        .then(() => Promise.all(servers.map((eachServer) => updateVirtualModule({ server: eachServer }))))
                        .catch(onError('hmr update'))
                })
        },
        async resolveId(id) {
            if (context.extractor.options.module && id.includes(context.extractor.options.module) || id.includes(context.extractor.resolvedVirtualModuleId)) {
                return context.extractor.resolvedVirtualModuleId
            }
        },
        async load(id) {
            if (id === context.extractor.resolvedVirtualModuleId) {
                return await getExtractedCSS(context)
            }
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
