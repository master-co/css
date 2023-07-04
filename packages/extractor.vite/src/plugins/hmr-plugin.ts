import CSSExtractor from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync } from 'fs'

/**
 * Pre-insert code for all modules
 */
export default function HMRPlugin(
    extractor: CSSExtractor,
): Plugin {
    let server: ViteDevServer
    let transformedIndexHTMLModule: { id: string, code: string }
    return {
        name: 'master-css-extractor:hmr',
        enforce: 'post',
        apply: 'serve',
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
            const changeHandler = async () => {
                const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
                const virtualCSSModule = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
                if (virtualCSSModule) {
                    await server.reloadModule(virtualCSSModule)
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
                        event: `HMR:${extractor.options.module}`,
                        data: extractor.css.text
                    })
                }
            }
            server = devServer
            server.ws.on('connection', () => {
                extractor
                    .on('reset', resetHandler)
                    .on('change', changeHandler)
            })
            server.ws.on('close', () => {
                extractor
                    .off('reset', resetHandler)
                    .off('change', changeHandler)
            })
            extractor.startWatch()
        },
        transformIndexHtml: {
            order: 'pre',
            handler: (html, { filename }) => {
                transformedIndexHTMLModule = {
                    id: filename,
                    code: html
                }
            }
        }
    } as Plugin
}