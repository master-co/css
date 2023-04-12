#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import chokidar from 'chokidar'
import fs from 'fs'
import { CONFIG_TS_TEXT, CONFIG_ESM_TEXT, CONFIG_TEXT } from '../constants'
import log from '@techor/log'
import { readFileAsJSON } from '@techor/fs'

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
                create('master.css.ts', CONFIG_TS_TEXT)
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
        const insert = (path: string) => compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
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
                insert(path)
                write()
            }
            const waching = (watcher: chokidar.FSWatcher) => {
                watchers.push(
                    watcher
                        .on('add', handle)
                        .on('change', handle)
                )
            }

            await reload()

            console.log('')
            log.t`Start watching source changes`

            const reloadConfig = async () => {
                await Promise.all(watchers.map(eachWatcher => eachWatcher.close()))
                watchers.length = 0
                await compiler.refresh()
                await reload()
            }
            chokidar
                .watch([compiler.resolvedConfigPath], {
                    ignoreInitial: true
                })
                .on('add', reloadConfig)
                .on('change', reloadConfig)
                .on('unlink', reloadConfig)
        } else {
            write()
            console.log('')
            log`[sources] ${compiler.sources}`
            log.tree(compiler.options)
        }
    })

const { version, name, description } = readFileAsJSON('../../../package.json', { cwd: __dirname }) || {}

program.name(name)
program.description(description)
program.version(version)
program.parse()