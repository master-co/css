import { CSSExtractor } from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'

const HMR_EVENT_UPDATE = 'master-css-hmr:update'

/** HMR when the config and source files changed */
export default function VirtualCSSHMRPlugin(extractor: CSSExtractor): Plugin {
    let transformedIndexHTMLModule: { id: string, code: string }
    const servers: ViteDevServer[] = []
    const updateVirtualModule = async ({ server, timestamp = Date.now() }: { server: ViteDevServer, timestamp?: number }) => {
        if (!server) return
        const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
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
                    css: extractor.css.text,
                    timestamp
                }
            })
        }
        return virtualCSSModule
    }
    const handleReset = async ({ server }: { server: ViteDevServer }) => {
        const tasks: any[] = []
        /* 1. fixed sources */
        tasks.push(await extractor.prepare())
        /* 2. transform index.html */
        if (transformedIndexHTMLModule) {
            tasks.push(extractor.insert(transformedIndexHTMLModule.id, transformedIndexHTMLModule.code))
        }
        /* 3. transformed modules */
        tasks.concat(
            Array.from(server.moduleGraph.idToModuleMap.keys())
                .filter((eachModuleId) => eachModuleId !== extractor.resolvedVirtualModuleId)
                .map(async (eachModuleId: string) => {
                    const eachModule = server.moduleGraph.idToModuleMap.get(eachModuleId)
                    if (eachModule) {
                        let eachModuleCode = eachModule?.transformResult?.code || eachModule?.ssrTransformResult?.code
                        if (eachModule.file && !eachModuleCode && !eachModule.file.startsWith('virtual:') && existsSync(eachModule.file)) {
                            eachModuleCode = readFileSync(eachModule.file, 'utf-8')
                        }
                        if (eachModuleCode)
                            await extractor.insert(eachModuleId, eachModuleCode)
                    }
                })
        )
        await Promise.all(tasks)
        updateVirtualModule({ server })
    }
    extractor
        .on('reset', () => {
            servers.forEach((eachServer) => handleReset({ server: eachServer }))
        })
        .on('change', () => {
            servers.forEach((eachServer) => updateVirtualModule({ server: eachServer }))
        })
    return {
        name: 'master-css-extractor:virtual-css-module:hmr',
        apply(config, env) {
            if (env.command === 'serve') {
                extractor.startWatch()
                return true
            } else {
                return false
            }
        },
        enforce: 'pre',
        async resolveId(id) {
            if (extractor.options.module && id.includes(extractor.options.module) || id.includes(extractor.resolvedVirtualModuleId)) {
                return extractor.resolvedVirtualModuleId
            }
        },
        load(id) {
            if (id === extractor.resolvedVirtualModuleId) {
                return extractor.css.text
            }
        },
        transformIndexHtml: {
            order: 'pre',
            handler: async (html, { filename }) => {
                transformedIndexHTMLModule = {
                    id: filename,
                    code: html
                }
                await extractor.insert(filename, html)
            }
        },
        configureServer(server) {
            servers.push(server)
        }
    }
}