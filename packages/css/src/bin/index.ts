#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import { readPackage } from '../utils/read-package'

import chokidar from 'chokidar'
import fs from 'fs'
import defineContent from '../methods/define-content'
import log from '@techor/log'

program.command('init')
    .description('Create a Master CSS definition file with configuration')
    .allowUnknownOption()
    .option('--jit', 'With initialization of the just-in-time program')
    .option('-c, --compiler', 'With compiler options')
    .option('-o, --override', 'Override the existing definition file')
    .option('--ext <extension>', 'Definition extension `ts`, `js`, `mjs`')
    .action(function (options) {
        let { ext } = options
        if (!ext) {
            if (fs.existsSync('tsconfig.json')) {
                ext = 'ts'
            } else {
                const { type } = readPackage()
                if (type === 'module') {
                    ext = 'mjs'
                } else {
                    ext = 'js'
                }
            }
        }
        const definition = defineContent({ ...options, ext })
        const fileName = `master.css.${ext}`
        const definitionExists = fs.existsSync(path.join(process.cwd(), fileName))
        if (!definitionExists) {
            fs.writeFileSync(fileName, definition)
            log.ok`**${fileName}** definition file is created`
        } else if (definitionExists && options.override) {
            fs.writeFileSync(fileName, definition)
            log.ok`**${fileName}** definition file is overridden`
        } else {
            log.x`**${fileName}** definition file already exists`
        }
    })

program.command('build', { isDefault: true })
    .allowUnknownOption()
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your master CSS file output path', 'master.css')
    .action(async function ({ watch, output }) {
        // @ts-ignore
        const compiler = await new (await import('@master/css-compiler')).default().compile()
        const insert = (path: string) => compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
        const write = () => fs.writeFileSync(output, compiler.css.text)
        const sources = compiler.sources
        console.log('')
        log`[sources] ${sources}`
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
            log.tree(compiler.options)

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
        }
    })

const { version, name, description } = readPackage(path.join(__dirname, '../../package.json'))
program
    .name(name)
    .description(description)
    .version(version)

program.parse()