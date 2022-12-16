import MasterCSSCompiler from '@master/css.compiler'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import fs from 'fs'

const NAME = 'MasterCSSWebpackPlugin'

export class MasterCSSWebpackPlugin extends MasterCSSCompiler {

    apply(compiler: Compiler) {
        if (!compiler.options.resolve)
            compiler.options.resolve = {}

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            [this.moduleId]: path.resolve(compiler.context, 'node_modules', this.moduleId)
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

        compiler.hooks.initialize.tap(NAME, async () => {
            await this.init()
            updateCSS()
        })

        compiler.hooks.watchRun.tapPromise(NAME, async () => {
            const { modifiedFiles } = compiler
            if (modifiedFiles) {
                if (modifiedFiles.has(this.configPath)) {
                    await this.init()
                } else {
                    modifiedFiles?.forEach((modifiedFilePath) => {
                        this.insert(modifiedFilePath, fs.readFileSync(modifiedFilePath).toString())
                    })
                }
                updateCSS()
            }
        })

        compiler.hooks.afterCompile.tap(NAME, async (compilation) => {
            if (this.hasConfig)
                compilation.fileDependencies.add(this.configPath)
        })

    }
}
