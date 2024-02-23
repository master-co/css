import { CSSExtractor } from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { existsSync, readFileSync } from 'fs'
import debounce from 'lodash.debounce'

const HMR_EVENT_UPDATE = 'master-css-hmr:update'

/** HMR when the config and source files changed */
export default function VirtualCSSHMRPlugin(extractor: CSSExtractor): Plugin {
    let HMRReady = false
    let server: ViteDevServer
    let transformedIndexHTMLModule: { id: string, code: string }
    const straightUpdateVirtualModule = () => {
        if (!server) return
        const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
        const virtualCSSModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (virtualCSSModule) {
            server.reloadModule(virtualCSSModule)
            server.hot.channels.forEach((eachChannel) => {
                eachChannel.send({
                    type: 'update',
                    updates: [{
                        type: 'js-update',
                        path: resolvedVirtualModuleId,
                        acceptedPath: resolvedVirtualModuleId,
                        timestamp: +Date.now()
                    }]
                })
                eachChannel.send({
                    type: 'custom',
                    event: HMR_EVENT_UPDATE,
                    data: {
                        id: resolvedVirtualModuleId,
                        css: extractor.css.text
                    }
                })
            })
        }
    }
    const debounceUpdateVirtualModule = debounce(straightUpdateVirtualModule, 100)
    const updateVirtualModule = () => {
        if (HMRReady) {
            straightUpdateVirtualModule()
        } else {
            debounceUpdateVirtualModule()
        }
    }
    extractor
        .on('change', updateVirtualModule)
    return {
        name: 'master-css-extractor:virtual-css-module:hmr',
        apply: 'serve',
        enforce: 'pre',
        async resolveId(id) {
            if (id === extractor.options.module || id === extractor.resolvedVirtualModuleId) {
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
        configureServer(devServer) {
            const resetHandler = async () => {
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
                updateVirtualModule()
            }
            server = devServer
            server.hot.on('connection', () => {
                extractor
                    .off('reset', resetHandler)
                    .on('reset', resetHandler)
                HMRReady = true
            })
            extractor.startWatch()
        }
    }
}