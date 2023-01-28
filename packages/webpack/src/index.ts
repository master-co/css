import MasterCSSCompiler from '@master/css-compiler'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import fs from 'fs'

const NAME = 'MasterCSSWebpackPlugin'

export class MasterCSSWebpackPlugin extends MasterCSSCompiler {

    apply(compiler: Compiler) {

        let configPath = this.resolvedConfigPath
        if (configPath && path.sep === '\\') {
            configPath = configPath.replace(/\//g, '\\')
        }

        if (!compiler.options.resolve)
            compiler.options.resolve = {}

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            [this.options.module]: path.resolve(compiler.context, 'node_modules', this.options.module)
        }
        const virtualModules = new VirtualModulesPlugin({
            ['node_modules/master.css']: ''
        })
        virtualModules.apply(compiler)

        const updateCSS = () => {
            if (this.css)
                virtualModules.writeModule(
                    'node_modules/master.css',
                    (compiler.watchMode ? `/*${this.moduleHMREvent}*/` : '') + this.css.text
                )
        }

        /* update the Virtual CSS module after initialization */
        compiler.hooks.initialize.tap(NAME, async () => {
            await this.init()
            updateCSS()
        })

        compiler.hooks.watchRun.tapPromise(NAME, async () => {
            const { modifiedFiles } = compiler
            if (modifiedFiles) {
                if (modifiedFiles.has(configPath)) {
                    await this.init()
                } else {
                    modifiedFiles?.forEach(async (modifiedFilePath) => {
                        await this.insert(modifiedFilePath, fs.readFileSync(modifiedFilePath).toString())
                    })
                }
                updateCSS()
            }
        })

        compiler.hooks.afterCompile.tap(NAME, async (compilation) => {
            if (configPath) {
                compilation.fileDependencies.add(configPath)
            }
        })

    }
}
