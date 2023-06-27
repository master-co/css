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
            } else {
                /* 掃描 HMR 期異動的檔案 */
                await extractor.insert(filepath, await read())
            }
            const virtualCSSModule = server.moduleGraph.getModuleById(extractor.resolvedModuleId)
            if (virtualCSSModule) {
                server.moduleGraph.invalidateModule(virtualCSSModule)
                server.ws.send({
                    type: 'update',
                    updates: [{
                        type: 'js-update',
                        path: virtualCSSModule.url,
                        acceptedPath: virtualCSSModule.url,
                        timestamp: Date.now()
                    }]
                })
            }
            server.ws.send({
                type: 'custom',
                event: extractor.moduleHMREvent,
                data: extractor.css.text
            })
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
        },
        transform(code, id) {
            extractor.insert(id, code)
            transformedIds.add(id)
            if (server) {
                if (code.includes(extractor.options.module || 'master.css')) {
                    return `${code}
                        if (import.meta.hot) {
                            try {
                                import.meta.hot.on('${extractor.moduleHMREvent}', (text) => {
                                    const virtualCSSStyle = document.querySelector(\`[data-vite-dev-id*="master.css"]\`)
                                    if (virtualCSSStyle) {
                                        virtualCSSStyle.textContent = text
                                    }
                                })
                            } catch (err) {
                                console.warn('[Master CSS HMR]', err)
                            }
                        }
                    `
                }
            }
        },
        transformIndexHtml(html, { filename }) {
            extractor.insert(filename, html)
            transformedIds.add(filename)
            return html
        },
    } as Plugin
}

// Fix `vite does not provide an export named 'default'`
export default { CSSExtractorPlugin }