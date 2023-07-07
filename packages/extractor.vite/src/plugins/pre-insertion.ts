import CSSExtractor from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync } from 'fs'
import debounce from 'lodash.debounce'

/**
 * Pre-insert code for all modules
 */
export default function PreInsertionPlugin(
    extractor: CSSExtractor,
): Plugin {
    let server: ViteDevServer
    let transformedIndexHTMLModule: { id: string, code: string }
    let readyForHMR = false
    const straightUpdateVirtualModule = () => {
        const virtualCSSModule = server.moduleGraph.getModuleById(extractor.resolvedVirtualModuleId)
        if (virtualCSSModule) {
            server.reloadModule(virtualCSSModule)
        }
    }
    const debounceUpdateVirtualModule = debounce(straightUpdateVirtualModule, 100)
    const updateVirtualModule = () => {
        if (readyForHMR) {
            straightUpdateVirtualModule()
        } else {
            debounceUpdateVirtualModule()
        }
    }
    return {
        name: 'master-css-extractor:pre-insertion',
        enforce: 'pre',
        apply(config, env) {
            return !env.ssrBuild
        },
        async buildStart() {
            await extractor.prepare()
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
        async transform(code, id) {
            const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
            if (id !== resolvedVirtualModuleId) {
                if (await extractor.insert(id, code)) {
                    if (server) {
                        updateVirtualModule()
                    }
                }
            }
        },
        configureServer(devServer) {
            const resetHandler = async () => {
                const tasks = []
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
                            let eachModuleCode = eachModule.transformResult?.code
                            if (!eachModuleCode) {
                                eachModuleCode = readFileSync(eachModuleId, 'utf-8')
                            }
                            await extractor.insert(eachModuleId, eachModuleCode)
                        })
                )
                await Promise.all(tasks)
            }
            const sendCustomHMREvent = () => {
                const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
                server.ws.send({
                    type: 'update',
                    updates: [{
                        type: 'js-update',
                        path: resolvedVirtualModuleId,
                        acceptedPath: resolvedVirtualModuleId,
                        timestamp: +Date.now()
                    }]
                })
                server.ws.send({
                    type: 'custom',
                    event: `master-css-hmr:update`,
                    data: {
                        id: resolvedVirtualModuleId,
                        css: extractor.css.text
                    }
                })
            }
            server = devServer
            server.ws.on('connection', () => {
                extractor
                    .on('reset', resetHandler)
                    .on('change', sendCustomHMREvent)
                readyForHMR = true
            })
            server.ws.on('close', () => {
                extractor
                    .off('reset', resetHandler)
                    .off('change', sendCustomHMREvent)
                readyForHMR = false
            })
            server.ws.on('master-css-hmr:update', ({ id }) => {
                const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId) return
                updateVirtualModule()
            })
            extractor.startWatch()
        },
    } as Plugin
}