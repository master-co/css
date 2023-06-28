import CSSExtractor from '@master/css-extractor'
import type { Options } from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import { Pattern } from 'fast-glob'
import { readFileSync } from 'fs'

export async function CSSExtractorPlugin(
    customOptions?: Options | Pattern | Pattern[]
): Promise<Plugin> {
    const extractor = new CSSExtractor(customOptions)
    extractor.on('init', (options: Options) => {
        options.include = []
    })
    extractor.init()
    let server: ViteDevServer
    let transformedIndexHTMLModule: { id: string, code: string }
    return {
        name: 'vite-plugin-master-css',
        enforce: 'post',
        parallel: true,
        apply(config, env) {
            return !env.ssrBuild
        },
        async buildStart() {
            await extractor.prepare()
        },
        async resolveId(id) {
            if (id === extractor.options.module) {
                return extractor.hotModuleId
            }
        },
        load(id) {
            if (id === extractor.hotModuleId) {
                return extractor.css.text
            }
        },
        configureServer(devServer) {
            server = devServer
            extractor
                .on('reset', async () => {
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
                            .filter((eachModuleId) => eachModuleId !== extractor.hotModuleId)
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
                })
                .on('change', () => {
                    const hotModuleId = extractor.hotModuleId
                    const virtualCSSModule = server.moduleGraph.getModuleById(hotModuleId)
                    if (virtualCSSModule) {
                        server.reloadModule(virtualCSSModule)
                        server.ws.send({
                            type: 'update',
                            updates: [{
                                type: 'css-update',
                                path: hotModuleId,
                                acceptedPath: hotModuleId,
                                timestamp: +Date.now()
                            }]
                        })
                        server.ws.send({
                            type: 'custom',
                            event: extractor.hotModuleEvent,
                            data: extractor.css.text
                        })
                    }
                })
            extractor.startWatch()
        },
        async transformIndexHtml(html, { filename }) {
            await extractor.insert(filename, html)
            transformedIndexHTMLModule = {
                id: filename,
                code: html
            }
        },
        transform(code, id) {
            if (id !== extractor.hotModuleId) {
                extractor.insert(id, code)
            }
        },
    } as Plugin
}

// Fix `vite does not provide an export named 'default'`
export default { CSSExtractorPlugin }