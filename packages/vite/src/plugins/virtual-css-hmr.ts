import CSSBuilder from '@master/css-builder'
import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'

const HMR_EVENT_UPDATE = 'master-css-hmr:update'

/** HMR when the config and source files changed */
export default function VirtualCSSHMRPlugin(builder: CSSBuilder): Plugin {
    let transformedIndexHTMLModule: { id: string, code: string }
    const servers: ViteDevServer[] = []
    const updateVirtualModule = async ({ server, timestamp = Date.now() }: { server: ViteDevServer, timestamp?: number }) => {
        if (!server) return
        const resolvedVirtualModuleId = builder.resolvedVirtualModuleId
        const virtualCSSModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (virtualCSSModule) {
            server.reloadModule(virtualCSSModule)
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
                    css: builder.css.text,
                    timestamp
                }
            })
        }
        return virtualCSSModule
    }
    const handleReset = async ({ server }: { server: ViteDevServer }) => {
        const tasks: any[] = []
        /* 1. fixed sources */
        tasks.push(await builder.prepare())
        /* 2. transform index.html */
        if (transformedIndexHTMLModule) {
            tasks.push(builder.insert(transformedIndexHTMLModule.id, transformedIndexHTMLModule.code))
        }
        /* 3. transformed modules */
        tasks.concat(
            Array.from(server.moduleGraph.idToModuleMap.keys())
                .filter((eachModuleId) => eachModuleId !== builder.resolvedVirtualModuleId)
                .map(async (eachModuleId: string) => {
                    const eachModule = server.moduleGraph.idToModuleMap.get(eachModuleId)
                    if (eachModule) {
                        let eachModuleCode = eachModule?.transformResult?.code || eachModule?.ssrTransformResult?.code
                        if (eachModule.file && !eachModuleCode && !eachModule.file.startsWith('virtual:') && existsSync(eachModule.file)) {
                            eachModuleCode = readFileSync(eachModule.file, 'utf-8')
                        }
                        if (eachModuleCode)
                            await builder.insert(eachModuleId, eachModuleCode)
                    }
                })
        )
        await Promise.all(tasks)
        updateVirtualModule({ server })
    }
    builder
        .on('reset', () => {
            servers.forEach((eachServer) => handleReset({ server: eachServer }))
        })
        .on('change', () => {
            servers.forEach((eachServer) => updateVirtualModule({ server: eachServer }))
        })
    return {
        name: 'master-css-builder:virtual-css-module:hmr',
        apply(config, env) {
            if (env.command === 'serve') {
                builder.startWatch()
                return true
            } else {
                return false
            }
        },
        enforce: 'pre',
        async resolveId(id) {
            if (builder.options.module && id.includes(builder.options.module) || id.includes(builder.resolvedVirtualModuleId)) {
                return builder.resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === builder.resolvedVirtualModuleId) {
                return builder.css.text
            }
        },
        transformIndexHtml: {
            order: 'pre',
            handler: async (html, { filename }) => {
                transformedIndexHTMLModule = {
                    id: filename,
                    code: html
                }
                await builder.insert(filename, html)
            }
        },
        configureServer(server) {
            servers.push(server)
        }
    }
}