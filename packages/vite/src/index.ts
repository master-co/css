import MasterCSSCompiler from '@master/css.compiler'
import path from 'path'
import writeFile from './utils/write-file'

import type { CompilerOptions } from '@master/css.compiler'
import type { Plugin, ViteDevServer } from 'vite'

export default async function MasterCSSVitePlugin(options?: CompilerOptions): Promise<Plugin> {
    const compiler = new MasterCSSCompiler(options)
    await compiler.initializing
    let server: ViteDevServer
    let devOutputFilePath: string
    let linkHref: string
    let rendered = false
    const extract = (name: string, content: string) => {
        const eachExtractions = compiler.extract({ name, content })
        if (eachExtractions.length) {
            const originalCssText = compiler.css.text
            /* 比對提取物並插入 CSS 規則 */
            compiler.insert(eachExtractions)
            /* 根據 cssText 生成 `master.css` 並加入到 Webpack 的 assets 中 */
            const cssText = compiler.css.text
            if (server && cssText !== originalCssText) {
                writeFile(devOutputFilePath, cssText)
                writeFile(compiler.outputPath, cssText)
                const notify = () => {
                    server.ws.send({
                        type: 'update',
                        updates: [{
                            type: 'css-update',
                            acceptedPath: devOutputFilePath,
                            path: linkHref,
                            timestamp: Date.now()
                        }]
                    })
                }
                if (rendered) {
                    notify()
                } else {
                    setTimeout(notify, 500)
                    rendered = true
                }
            }
        }
    }

    return {
        name: 'vite-plugin-master-css',
        enforce: 'pre',
        configureServer(_server) {
            server = _server
        },
        buildStart() {
            /** 防止首次執行時 import 找不到生成的 ./master.css */
            writeFile(compiler.outputPath, '')
            devOutputFilePath = path.resolve(server?.config.cacheDir ?? process.cwd(), compiler.outputPath)
            if (server) {
                /** 防止首次執行時 import 找不到生成的 ./master.css */
                writeFile(devOutputFilePath, '')
                linkHref = (server.config.cacheDir.slice(process.cwd().length) + '/' + compiler.outputPath).replace(/\\/g, '/')
            }
        },
        resolveId(source) {
            if (source.endsWith('master.css?direct'))
                return '\0' + source
        },
        transform(code, id) {
            extract(id, code)
        },
        transformIndexHtml(html, { path: filePath }) {
            html = html.replace(/(<head>)/, `$1<link rel="stylesheet" href="${linkHref}">`)
            /**
             * 修正 dev server 啟動時沒有掃描到 index.html
             */
            extract(filePath, html)
            return html
        },
        async handleHotUpdate(hmrContext) {
            extract(hmrContext.file, await hmrContext.read())
        },
        generateBundle() {
            const referenceId = this.emitFile({
                type: 'asset',
                name: compiler.outputPath,
                source: compiler.css.text
            })
            linkHref = '/' + this.getFileName(referenceId)
        }
    }
}
