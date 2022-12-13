import MasterCSSCompiler from '@master/css.compiler'
import path from 'path'
import writeFile from './utils/write-file'

import type { CompilerOptions } from '@master/css.compiler'
import type { Plugin, ViteDevServer } from 'vite'

export default async function MasterCSSVitePlugin(options?: CompilerOptions): Promise<Plugin> {
    const compiler = new MasterCSSCompiler(options)
    await compiler.initializing
    let server: ViteDevServer
    let masterCSSPublicURL: string
    let rendered = false
    const extract = (name: string, content: string) => {
        const originalCssText = compiler.css.text
        if (compiler.insert({ name, content })) {
            /* 根據 cssText 生成 `master.css` 並加入到 Webpack 的 assets 中 */
            const cssText = compiler.css.text
            if (cssText !== originalCssText) {
                writeFile(compiler.outputPath, cssText)
                if (server) {
                    // writeFile(devOutputFilePath, cssText)
                    const notify = () => {
                        server.ws.send({
                            type: 'update',
                            updates: [{
                                type: 'css-update',
                                acceptedPath: compiler.options.publicURL,
                                path: masterCSSPublicURL,
                                timestamp: Date.now()
                            }]
                        })
                    }
                    if (rendered) {
                        notify()
                    } else {
                        setTimeout(() => {
                            notify()
                        }, 500)
                        rendered = true
                    }
                }
            }
        }
    }

    return {
        name: 'vite-plugin-master-css',
        enforce: 'pre',
        configureServer(_server) {
            server = _server
            /**
             * Dev Server 啟動時首次執行
             * 解決 HMR 在特定框架 (如 Svelte Kit) 於啟動時沒有提供 HTML entry 上下文供掃描的問題
             */
            server.ws.on('connection', async () => {
                const localDevUrl = server.resolvedUrls.local[0]
                const response = await fetch(localDevUrl)
                const entryHTML = await response.text()
                extract(localDevUrl, entryHTML)
            })
            masterCSSPublicURL = compiler.options.publicURL
        },
        buildStart() {
            /** 防止首次執行時 import 找不到生成的 ./master.css */
            writeFile(compiler.outputPath, '')
        },
        resolveId(source) {
            if (source.endsWith('master.css?direct'))
                return '\0' + source
        },
        transform(code, id) {
            extract(id, code)
        },
        /* 不一定會被其他整合的工具如 Svelte Kit Hook */
        transformIndexHtml(html, { filename }) {
            html = html.replace(/(<head>)/, `$1<link rel="stylesheet" href="${masterCSSPublicURL}">`)
            extract(filename, html)
            return html
        },
        async handleHotUpdate({ file, read }) {
            extract(file, await read())
        },
        generateBundle() {
            const assetRefId = this.emitFile({
                type: 'asset',
                name: compiler.options.output.name,
                source: compiler.css.text
            })
            masterCSSPublicURL = '/' + this.getFileName(assetRefId)
        },
    }
}
