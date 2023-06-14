import CSSExtractor from '@master/css-extractor'
import type { Compiler } from 'webpack'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import path from 'path'
import fs from 'fs'
import log from '@techor/log'

const NAME = 'MasterCSSExtractorPlugin'

export class CSSExtractorPlugin extends CSSExtractor {
    apply(compiler: Compiler) {
        const resolvedConfigPath = this.resolvedConfigPath
        const resolvedOptionsPath = this.resolvedOptionsPath
        // if (configPath && path.sep === '\\') {
        //     configPath = configPath.replace(/\//g, '\\')
        // }

        const resetOptions = () => {
            this.options.exclude.push(
                '**/node_modules/webpack*/**',
                '**/node_modules/events/**',
                '**/node_modules/html-entities/**',
                '**/node_modules/ansi-html-community/**'
            )
        }

        resetOptions()

        if (!compiler.options.resolve)
            compiler.options.resolve = {}

        compiler.options.resolve.alias = {
            ...compiler.options.resolve.alias,
            [this.options.module]: path.resolve(compiler.context, 'node_modules', this.options.module)
        }

        const virtualModules = new VirtualModulesPlugin({
            ['node_modules/' + this.options.module]: ''
        })
        virtualModules.apply(compiler)

        const updateCSS = () => {
            if (this.css)
                virtualModules.writeModule(
                    'node_modules/' + this.options.module,
                    (compiler.watchMode ? `/*${this.moduleHMREvent}*/` : '') + this.css.text
                )
            // if (module.hot) {
            //     module.hot.accept();
            // }
        }

        /* update the Virtual CSS module after initialization */
        compiler.hooks.initialize.tap(NAME, async () => {
            await this.insertFixed()
            updateCSS()
        })

        const succeedModuleSources = {}

        compiler.hooks.compilation.tap(NAME, async (compilation) => {
            compilation.hooks.succeedModule.tap(NAME, async (module) => {
                const modulePath = compilation.getModule(module)['resource']
                const moduleSource = compilation.getModule(module)['_source']
                const moduleContent = moduleSource?.source()
                succeedModuleSources[modulePath] = moduleSource
                if (await this.insert(modulePath, moduleContent)) {
                    updateCSS()
                }
            })
        })

        compiler.hooks.watchRun.tapPromise(NAME, async () => {
            const { modifiedFiles } = compiler
            if (modifiedFiles) {
                const reset = async () => {
                    this.reset()
                    resetOptions()
                    await Promise.all([
                        this.insertFixed(),
                        ...Object
                            .keys(succeedModuleSources)
                            .map((succeedModulePath) => {
                                const succeedModuleSource = succeedModuleSources[succeedModulePath]
                                return this.insert(succeedModulePath, succeedModuleSource?.source())
                            })
                    ])
                }
                if (modifiedFiles.has(resolvedConfigPath)) {
                    log``
                    log.t`[change] **${this.configPath}**`
                    log``
                    await reset()
                } if (modifiedFiles.has(resolvedOptionsPath)) {
                    log``
                    log.t`[change] **${this.optionsPath}**`
                    log``
                    await reset()
                } else {
                    modifiedFiles?.forEach(async (modifiedFilePath) => {
                        await this.insert(modifiedFilePath, fs.readFileSync(modifiedFilePath).toString())
                    })
                }
                updateCSS()
            }
        })

        compiler.hooks.afterCompile.tap(NAME, (compilation) => {
            if (resolvedConfigPath) {
                compilation.fileDependencies.add(resolvedConfigPath)
            }
            if (resolvedOptionsPath) {
                compilation.fileDependencies.add(resolvedOptionsPath)
            }
        })
    }
}