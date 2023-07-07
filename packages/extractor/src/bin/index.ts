#!/usr/bin/env node

import { program } from 'commander'
import log from '@techor/log'
import CSSExtractor from '../core'
import { Options } from '../options'

program.command('extract', { isDefault: true })
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path')
    .option('-v, --verbose', 'Verbose logging 0~N', '1')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor.*')
    .action(async function (specifiedSourcePaths, { watch, output, verbose, options: customOptions }) {
        const extractor = new CSSExtractor(customOptions).init()

        extractor.on('init', (options: Options) => {
            if (specifiedSourcePaths?.length) {
                options.include = []
                options.exclude = []
            } else {
                if (!options.exclude.includes('**/node_modules/**')) {
                    options.exclude.push('**/node_modules/**')
                }
                if (!options.exclude.includes('node_modules')) {
                    options.exclude.push('node_modules')
                }
            }
            options.output = output
            options.verbose = +verbose
        })

        extractor.init()

        const insert = async () => {
            /**
             * true: Ignore `.include` and `.exclude` when specifying sources explicitly.
             * else: Insert according to the source of `.include` - `.exclude`.
             */
            if (specifiedSourcePaths) {
                await extractor.insertFiles(specifiedSourcePaths)
            } else {
                await extractor.insertFiles(extractor.allowedSourcePaths)
            }
        }

        if (watch) {
            const refresh = async () => {
                await insert()
                /* If the fixed source does not exist, watch the `.include` - `.exclude` */
                if (!specifiedSourcePaths?.length) {
                    extractor.watchSource(extractor.options.include, { ignored: extractor.options.exclude })
                }
            }
            extractor
                .on('watchStart', async () => {
                    await extractor.prepare()
                    await refresh()
                    log``
                    log.t`Start watching source changes`
                })
                .on('reset', async () => {
                    await refresh()
                    log``
                    log.t`Restart watching source changes`
                })
                .on('change', () => {
                    extractor.export()
                })
                .on('watchClose', () => {
                    log``
                    log.t`Stop watching source changes`
                })
            await extractor.startWatch()
        } else {
            await extractor.prepare()
            await insert()
            extractor.export()
        }
    })

program.parse(process.argv)