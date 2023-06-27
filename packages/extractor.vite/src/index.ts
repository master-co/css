import CSSExtractor from '@master/css-extractor'
import type { Options } from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import upath from 'upath'
import log from '@techor/log'
import { Pattern } from 'fast-glob'
import { readFileSync } from 'fs'

export async function CSSExtractorPlugin(
    customOptions?: Options | Pattern | Pattern[]
): Promise<Plugin> {
    const extractor = new CSSExtractor(customOptions)
    extractor.options.include = []
    let server: ViteDevServer
    let transformedIndexHTMLModule: { id: string, code: string }
    const reloadVirtualCSSModule = () => {
        const virtualCSSModuleId = extractor.resolvedModuleId
        const virtualCSSModule = server.moduleGraph.getModuleById(virtualCSSModuleId)
        if (virtualCSSModule) {
            server.moduleGraph.invalidateModule(virtualCSSModule)
            server.ws.send({
                type: 'update',
                updates: [{
                    type: 'js-update',
                    path: virtualCSSModuleId,
                    acceptedPath: virtualCSSModuleId,
                    timestamp: +Date.now()
                }]
            })
            server.ws.send({
                type: 'custom',
                event: extractor.moduleHMREvent,
                data: extractor.css.text
            })
        }
    }
    let runtimeCodeInserted = false
    return {
        name: 'vite-plugin-master-css',
        enforce: 'post',
        parallel: true,
        apply(config, env) {
            return !env.ssrBuild
        },
        async buildStart() {
            await extractor.insertFixed()
        },
        async resolveId(id) {
            if (id === extractor.options.module) {
                return extractor.resolvedModuleId
            }
        },
        load(id) {
            if (id === extractor.resolvedModuleId) {
                extractor.fixedSourcePaths.forEach((eachSourcePath) => this.addWatchFile(eachSourcePath))
                return extractor.css.text
            }
        },
        async handleHotUpdate({ server, file: filepath, read }) {
            const resolvedFilePath = upath.resolve(filepath)
            const resolvedConfigPath = extractor.resolvedConfigPath
            const resolvedOptionsPath = extractor.resolvedOptionsPath
            const reset = async () => {
                extractor.reset()
                extractor.options.include = []
                const tasks = []
                /* 1. transform index.html */
                if (transformedIndexHTMLModule) {
                    tasks.push(extractor.insert(transformedIndexHTMLModule.id, transformedIndexHTMLModule.code))
                }
                /* 2. transformed modules */
                tasks.concat(
                    Array.from(server.moduleGraph.idToModuleMap.keys())
                        .filter((eachModuleId) => eachModuleId !== extractor.resolvedModuleId)
                        .map(async (eachModuleId: string) => {
                            const eachModule = server.moduleGraph.idToModuleMap.get(eachModuleId)
                            let eachModuleCode = eachModule.transformResult?.code
                            if (!eachModuleCode) {
                                eachModuleCode = readFileSync(eachModuleId, 'utf-8')
                            }
                            await extractor.insert(eachModuleId, eachModuleCode)
                        })
                )
                /* 3. fixed sources */
                tasks.push(await extractor.insertFixed())
                await Promise.all(tasks)
                reloadVirtualCSSModule()
            }
            if (resolvedFilePath === resolvedConfigPath) {
                log``
                log.t`[change] **${extractor.configPath}**`
                log``
                await reset()
            } else if (resolvedFilePath === resolvedOptionsPath) {
                log``
                log.t`[change] **${extractor.optionsPath}**`
                log``
                const oldFixedSourcePaths = extractor.fixedSourcePaths
                if (oldFixedSourcePaths) {
                    server.watcher.unwatch(oldFixedSourcePaths)
                }
                await reset()
                const fixedSourcePaths = extractor.fixedSourcePaths
                if (fixedSourcePaths) {
                    server.watcher.add(fixedSourcePaths)
                }
            }
        },
        configureServer(devServer) {
            server = devServer
            /* watch all fixed sources */
            const fixedSourcePaths = extractor.fixedSourcePaths
            if (fixedSourcePaths) {
                server.watcher.add(fixedSourcePaths)
                server.watcher.on('change', async (resolvedChangedPath) => {
                    const relChangedPath = upath.relative(extractor.cwd, resolvedChangedPath)
                    if (extractor.isSourceAllowed(relChangedPath)) {
                        const content = readFileSync(resolvedChangedPath, 'utf-8')
                        if (content) {
                            await extractor.insert(resolvedChangedPath, content)
                        }
                    }
                })
            }
            server.ws.on('connection', (socket) => {
                if (!runtimeCodeInserted) {
                    log``
                    log.warn`Runtime code is not inserted.`
                }
            })
        },
        async transformIndexHtml(html, { filename }) {
            await extractor.insert(filename, html)
            if (server) {
                reloadVirtualCSSModule()
            }
            transformedIndexHTMLModule = {
                id: filename,
                code: html
            }
        },
        async transform(code, id) {
            await extractor.insert(id, code)
            if (server) {
                reloadVirtualCSSModule()
                /* Insert runtime code if `index.html` is not transformed */
                if (new RegExp(`["']` + extractor.options.module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `["']`).test(code)) {
                    runtimeCodeInserted = true
                    return code + `
                        try {
                            import.meta.hot.on('${extractor.moduleHMREvent}', (text) => {
                                const virtualCSSStyle = document.querySelector(\`[data-vite-dev-id*="${extractor.options.module}"]\`)
                                if (virtualCSSStyle) {
                                    virtualCSSStyle.textContent = text
                                }
                            })
                        } catch (err) {
                            console.warn('[Master CSS Extractor]', err)
                        }
                    `
                }
            }
        },
    } as Plugin
}

// Fix `vite does not provide an export named 'default'`
export default { CSSExtractorPlugin }