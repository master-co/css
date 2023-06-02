#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import chokidar from 'chokidar'
import fs from 'fs'
import { CONFIG_ESM_TEXT, CONFIG_TEXT } from '../constants'
import log from '@techor/log'
import { readFileAsJSON } from '@techor/fs'
import fg from 'fast-glob'
import { renderIntoHTML } from '../methods/render-into-html'
import { renderFromHTML } from '../methods/render-from-html'
import Techor from 'techor'
import zlib from 'zlib'
import prettyBytes from 'pretty-bytes'

program.command('init')
    .description('Initialize definition files for Master CSS')
    .option('-c, --compiler', 'Comes with a `./master.css-compiler.*` for compiler options')
    .option('-o, --override', 'Override existing definition file')
    .option('-f, --format <esm,cjs,ts>', 'With ES Module / CommonJS / TypeScript')
    .action(async function (options) {
        let { format } = options
        // automatically detect the format
        if (!format) {
            if (fs.existsSync('tsconfig.json')) {
                format = 'ts'
            } else {
                const { type } = readFileAsJSON('./package.json') || {}
                format = type === 'module' ? 'esm' : 'cjs'
            }
        }
        const create = (fileName: string, text: string) => {
            const configExists = fs.existsSync(path.join(process.cwd(), fileName))
            if (!configExists) {
                fs.writeFileSync(fileName, text)
                log.ok`**${fileName}** file is created`
            } else if (configExists && options.override) {
                fs.writeFileSync(fileName, text)
                log.ok`**${fileName}** file is overridden`
            } else {
                log.x`**${fileName}** file already exists`
            }
        }
        // create master.css.* file
        switch (format) {
            case 'esm':
                create('master.css.mjs', CONFIG_ESM_TEXT)
                break
            case 'ts':
                create('master.css.ts', CONFIG_ESM_TEXT)
                break
            default:
                create('master.css.js', CONFIG_TEXT)
        }
        // create master.css-compiler.* file
        if (options.compiler) {
            // @ts-ignore
            const { OPTIONS_TEXT, OPTIONS_ESM_TEXT, OPTIONS_TS_TEXT } = await import('@master/css-compiler')
            switch (format) {
                case 'esm':
                    create('master.css-compiler.mjs', OPTIONS_ESM_TEXT)
                    break
                case 'ts':
                    create('master.css-compiler.ts', OPTIONS_TS_TEXT)
                    break
                default:
                    create('master.css-compiler.js', OPTIONS_TEXT)
            }
        }
    })

program.command('build', { isDefault: true })
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your master CSS file output path', 'master.css')
    .action(async function ({ watch, output }) {
        // @ts-ignore
        const { MasterCSSCompiler } = await import('@master/css-compiler')
        const compiler = await (new MasterCSSCompiler).compile()
        const insert = async (path: string) => await compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
        const write = () => fs.writeFileSync(output, compiler.css.text)
        if (watch) {
            const watchers: chokidar.FSWatcher[] = []
            const reload = async () => {
                const { include, exclude, sources } = compiler.options
                if (include?.length) {
                    waching(chokidar.watch(include, {
                        ignored: exclude,
                        ignoreInitial: true
                    }))
                }
                if (sources?.length) {
                    waching(chokidar.watch(sources, {
                        ignoreInitial: true
                    }))
                }
                write()
                console.log('')
                log`[sources] ${compiler.sources}`
                log.tree(compiler.options)
            }
            const handle = async (path: string) => {
                await insert(path)
                write()
            }
            const waching = (watcher: chokidar.FSWatcher) => {
                watchers.push(
                    watcher
                        .on('add', handle)
                        .on('change', handle)
                )
            }

            const reloadConfig = async () => {
                await Promise.all(watchers.map(eachWatcher => eachWatcher.close()))
                watchers.length = 0
                await compiler.refresh()
                await reload()
            }

            const configPaths = []
            if (compiler.resolvedConfigPath) {
                configPaths.push(compiler.resolvedConfigPath)
            }
            if (compiler.resolvedOptionsPath) {
                configPaths.push(compiler.resolvedOptionsPath)
            }
            if (configPaths.length) {
                chokidar
                    .watch(configPaths, {
                        ignoreInitial: true
                    })
                    .on('add', reloadConfig)
                    .on('change', reloadConfig)
                    .on('unlink', reloadConfig)
            }

            await reload()

            console.log('')
            log.t`Start watching source changes`
        } else {
            write()
            console.log('')
            log`[sources] ${compiler.sources}`
            log.tree(compiler.options)
        }
    })

program.command('render')
    .description('Scans HTML and injects generated CSS rules')
    .argument('<file paths>', 'The path in glob patterns of the source of the HTML file')
    .option('-c --config', 'The source path of the Master CSS configuration', 'master.css.*')
    .action(async function (filePatterns, options) {
        const sourcePaths = fg.sync(filePatterns)
        if (sourcePaths.length) {
            const techor = new Techor({ config: options.config })
            const config = techor.readConfig()
            const t1 = performance.now()
            await Promise.all(sourcePaths
                .map(async (eachSourcePath) => {
                    let styleExisted = false
                    const content = fs.readFileSync(eachSourcePath, { encoding: 'utf-8' })
                    let renderedContent = content.replace(
                        /(<style id="master">).*?(<\/style>)/,
                        (_, prefix, suffix) => {
                            styleExisted = true
                            return prefix + renderFromHTML(content, config) + suffix
                        }
                    )
                    if (!styleExisted) {
                        renderedContent = renderIntoHTML(content, config)
                    }
                    if (content !== renderedContent) {
                        fs.writeFileSync(eachSourcePath, renderedContent)
                    }
                    const unrenderedContent = renderedContent.replace(/<style id="master">.*?<\/style>/, '')
                    const renderedSize = zlib.brotliCompressSync(renderedContent).length
                    const originSize = zlib.brotliCompressSync(unrenderedContent).length
                    log.ok`**${eachSourcePath}** is rendered ${prettyBytes(renderedSize, { space: false })} = HTML ${prettyBytes(originSize, { space: false })} + CSS ${prettyBytes(renderedSize - originSize, { space: false })} (brotil)`
                }))

            log.success`**${sourcePaths.length}** files rendered in ${Math.round(performance.now() - t1)}ms`
        }
    })

const { version, name, description } = readFileAsJSON('../../../package.json', { cwd: __dirname }) || {}

program.name(name)
program.description(description)
program.version(version)
program.parse()