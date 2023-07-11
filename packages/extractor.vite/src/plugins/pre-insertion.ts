import CSSExtractor from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { exists, existsSync, readFileSync } from 'fs'
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
    }
    const debounceUpdateVirtualModule = debounce(straightUpdateVirtualModule, 100)
    const updateVirtualModule = () => {
        if (readyForHMR) {
            straightUpdateVirtualModule()
        } else {
            debounceUpdateVirtualModule()
        }
    }
    const insert = async (id: string, code: string) => {
        if (await extractor.insert(id, code)) {
            if (server) {
                updateVirtualModule()
            }
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
                await insert(filename, html)
            }
        },
        async transform(code, id) {
            const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
            if (id !== resolvedVirtualModuleId) {
                await insert(id, code)
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
                const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
                tasks.concat(
                    Array.from(server.moduleGraph.idToModuleMap.keys())
                        .filter((eachModuleId) => eachModuleId !== extractor.resolvedVirtualModuleId)
                        .map(async (eachModuleId: string) => {
                            const eachModule = server.moduleGraph.idToModuleMap.get(eachModuleId)
                            let eachModuleCode = eachModule.transformResult?.code
                            if (typeof eachModuleCode !== 'string' && !eachModule.file.startsWith('virtual:') && existsSync(eachModule.file)) {
                                eachModuleCode = readFileSync(eachModule.file, 'utf-8')
                            }
                            await extractor.insert(eachModuleId, eachModuleCode)
                        })
                )
                await Promise.all(tasks)
                updateVirtualModule()
            }
            server = devServer
            server.ws.on('connection', () => {
                extractor
                    .off('reset', resetHandler)
                    .on('reset', resetHandler)
                readyForHMR = true
            })
            extractor.startWatch()
        },
    } as Plugin
}