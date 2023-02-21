import MasterCSSCompiler from '@master/css-compiler'
import type { Options } from '@master/css-compiler'
import type { Plugin, ViteDevServer } from 'vite'
import upath from 'upath'
import log from '@techor/log'

export async function MasterCSSVitePlugin(options?: Options): Promise<Plugin> {
    const compiler = await new MasterCSSCompiler(options).compile()
    let server: ViteDevServer
    return {
        name: 'vite-plugin-master-css',
        enforce: 'post',
        async resolveId(id) {
            if (id === compiler.options.module) {
                return compiler.resolvedModuleId
            }
        },
        load(id) {
            if (id === compiler.resolvedModuleId) {
                compiler.sources.forEach((eachSourcePath) => this.addWatchFile(eachSourcePath))
                return compiler.css.text
            }
        },
        async handleHotUpdate({ server, file, read }) {
            if (upath.resolve(file) === compiler.resolvedConfigPath) {
                /* 當自訂的 master.css.js 變更時，根據其重新初始化 MasterCSS 並強制重載瀏覽器 */
                await compiler.refresh()
                log.t`[change] config file ${`.${upath.relative(compiler.options.cwd, compiler.configPath)}.`}`
            } else {
                /* 掃描 HMR 期異動的檔案 */
                await compiler.insert(file, await read())
            }

            const virtualCSSModule = server.moduleGraph.getModuleById(compiler.resolvedModuleId)
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
                event: compiler.moduleHMREvent,
                data: compiler.css.text
            })
        },
        configureServer(_server) {
            server = _server
            const configPath = compiler.configPath
            if (configPath) {
                server.watcher.add(configPath)
            }
            // TODO 目前會重複 watch 相同的檔案
            // const supportsGlobs = server.config.server.watch?.disableGlobbing === false
            // server.watcher.add(supportsGlobs ? compiler.options.include : compiler.sources)
        },
        transform(code, id) {
            if (server && code.includes(compiler.options.module)) {
                return `${code}
if (import.meta.hot) {
    try {
        import.meta.hot.on('${compiler.moduleHMREvent}', (text) => {
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
        },

    }
}
