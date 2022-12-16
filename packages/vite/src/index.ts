import MasterCSSCompiler from '@master/css.compiler'
import type { CompilerOptions } from '@master/css.compiler'
import type { Plugin, ViteDevServer } from 'vite'
import path from 'path'
import log from 'aronlog'

export async function MasterCSSVitePlugin(options?: CompilerOptions): Promise<Plugin> {
    const compiler = await new MasterCSSCompiler(options).init()
    let server: ViteDevServer
    return {
        name: 'vite-plugin-master-css',
        enforce: 'post',
        async resolveId(id) {
            if (id === compiler.moduleId) {
                return compiler.resolvedModuleId
            }
        },
        load(id) {
            console.log(id)
            if (id === compiler.resolvedModuleId) {
                compiler.readSourcePaths().forEach((eachSourcePath) => this.addWatchFile(eachSourcePath))
                return compiler.css.text
            }
        },
        async handleHotUpdate({ server, file, read }) {
            if (path.resolve(file) === compiler.customConfigPath) {
                /* 當自訂的 master.css.js 變更時，根據其重新初始化 MasterCSS 並強制重載瀏覽器 */
                await compiler.init()
                log.info`${'change'} config file ${`.${path.relative(compiler.options.cwd, compiler.customConfigPath)}.`}`
            } else {
                /* 掃描 HMR 期異動的檔案 */
                compiler.insert(file, await read())
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
            }
            server.ws.send({
                type: 'custom',
                event: compiler.moduleHMREvent,
                data: compiler.css.text
            })
        },
        async configureServer(_server) {
            server = _server
            if (compiler.hasCustomConfig) {
                server.watcher.add(compiler.customConfigPath)
            }
            // TODO 目前會重複 watch 相同的檔案
            // const supportsGlobs = server.config.server.watch?.disableGlobbing === false
            // server.watcher.add(supportsGlobs ? compiler.options.include : compiler.readSourcePaths())
        },
        transform(code, id) {
            if (server && code.includes(compiler.moduleId)) {
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
