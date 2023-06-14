#!/usr/bin/env node

import { program } from 'commander'
import chokidar from 'chokidar'
import log from '@techor/log'
import CSSExtractor from '../core'

program.command('extract', { isDefault: true })
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path', 'master.css')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor.*')
    .action(async function (fixedSourcePaths, { watch, output, options: customOptions }) {
        const extractor = new CSSExtractor(customOptions)
        const resetOptions = () => {
            if (fixedSourcePaths) {
                extractor.options.include = []
                extractor.options.exclude = []
            } else {
                if (!extractor.options.exclude.includes('**/node_modules/**')) {
                    extractor.options.exclude.push('**/node_modules/**')
                }
                if (!extractor.options.exclude.includes('node_modules')) {
                    extractor.options.exclude.push('node_modules')
                }
            }
        }
        resetOptions()
        extractor.logOptions()
        const insert = async () => {
            await extractor.insertFixed()
            /**
             * true: Ignore `.include` and `.exclude` when specifying sources explicitly.
             * else: Insert according to the source of `.include` - `.exclude`.
             */
            if (fixedSourcePaths) {
                await extractor.insertFiles(fixedSourcePaths)
            } else {
                await extractor.insertFiles(extractor.allowedSourcePaths)
            }
        }

        await insert()

        if (watch) {
            const watchers: chokidar.FSWatcher[] = []
            const refreshWatch = async () => {
                const { include, exclude, sources } = extractor.options
                /* If the fixed source does not exist, watch the `.include` - `.exclude` */
                if (!fixedSourcePaths) {
                    waching(chokidar.watch(include, { ignored: exclude, ignoreInitial: true, cwd: extractor.options.cwd }))
                }
                /* Watch fixed sources */
                if (sources) {
                    waching(chokidar.watch(sources, { ignoreInitial: true, cwd: extractor.options.cwd }))
                }
                extractor.export(output)
            }

            let oldCSStext = ''
            const handle = async (source: string) => {
                oldCSStext = extractor.css.text
                await extractor.insertFile(source)
                if (oldCSStext !== extractor.css.text)
                    extractor.export(output)
            }

            const waching = (watcher: chokidar.FSWatcher) => {
                watchers.push(
                    watcher
                        .on('add', handle)
                        .on('change', handle)
                )
            }

            const restart = async () => {
                log``
                await Promise.all(watchers.map(eachWatcher => eachWatcher.close()))
                watchers.length = 0
                extractor.reset(customOptions)
                resetOptions()
                await insert()
                await refreshWatch()
                log``
                log.t`Restart watching source changes`
            }

            const resolvedConfigPath = extractor.resolvedConfigPath
            const resolvedOptionsPath = extractor.resolvedOptionsPath

            if (resolvedConfigPath) {
                const handle = () => {
                    log``
                    log.t`[change] **${extractor.configPath}**`
                    restart()
                }
                chokidar
                    .watch(resolvedConfigPath, { ignoreInitial: true, cwd: extractor.options.cwd })
                    .on('add', handle)
                    .on('change', handle)
                    .on('unlink', handle)
            }

            if (resolvedOptionsPath) {
                const handle = () => {
                    log``
                    log.t`[change] **${extractor.customOptions}**`
                    restart()
                }
                chokidar
                    .watch(resolvedOptionsPath, { ignoreInitial: true, cwd: extractor.options.cwd })
                    .on('add', handle)
                    .on('change', handle)
                    .on('unlink', handle)
            }

            await refreshWatch()

            log``
            log.t`Start watching source changes`
        } else {
            extractor.export(output)
        }
    })

program.parse(process.argv)