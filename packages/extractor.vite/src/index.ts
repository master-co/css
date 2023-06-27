import CSSExtractor from '@master/css-extractor'
import type { Options } from '@master/css-extractor'
import type { Plugin, ViteDevServer } from 'vite'
import upath from 'upath'
import log from '@techor/log'
import { Pattern } from 'fast-glob'

export async function CSSExtractorPlugin(
    customOptions?: Options | Pattern | Pattern[]
): Promise<Plugin> {
    let extractor
    let server: ViteDevServer
    const transformedIds = new Set<string>()
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
            extractor = new CSSExtractor(customOptions)
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
            /**
             * Reset extractor based on stored `transformedIds` and corresponding transformed code
             */
            const reset = async () => {
                extractor.reset()
                server.moduleGraph.invalidateAll()
                await extractor.insertFixed()
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
                await reset()
            }
        },
        configureServer(_server) {
            server = _server
            // const configPath = extractor.configPath
            // console.log('🔺', configPath)
            // if (configPath) {
            //     server.watcher.add(configPath)
            // }
            // TODO 目前會重複 watch 相同的檔案
            // const supportsGlobs = server.config.server.watch?.disableGlobbing === false
            // server.watcher.add(supportsGlobs ? extractor.options.include : extractor.fixedSourcePaths)
            server.ws.on('connection', (socket) => {
                if (!runtimeCodeInserted) {
                    log``
                    log.warn`Runtime code is not inserted.`
                }
            })
        },
        async transformIndexHtml(html, { filename }) {
            await extractor.insert(filename, html)
            transformedIds.add(filename)
            if (server) {
                reloadVirtualCSSModule()
            }
        },
        async transform(code, id) {
            await extractor.insert(id, code)
            transformedIds.add(id)
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