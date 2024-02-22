import type { Command } from 'commander'
import CSSExtractor, { Options } from '@master/css-extractor'
import log from '@techor/log'

export default (program: Command) => program
    .command('extract')
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path')
    .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
    .option('--no-export', 'Print only CSS results.')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor')
    .action(async function (specifiedSourcePaths: any, options?: {
        watch?: boolean,
        output?: string,
        verbose?: number,
        export?: boolean,
        cwd?: string,
        options?: string | string[] | Options
    }) {
        const { watch, output, verbose, cwd, options: customOptions } = options || {}
        const extractor = new CSSExtractor(customOptions, cwd)
        extractor.on('init', (options: Options) => {
            if (specifiedSourcePaths?.length) {
                options.include = []
                options.exclude = []
            } else {
                if (!options.exclude?.includes('**/node_modules/**')) {
                    options.exclude?.push('**/node_modules/**')
                }
                if (!options.exclude?.includes('node_modules')) {
                    options.exclude?.push('node_modules')
                }
            }
            options.output = output
            options.verbose = verbose ? +verbose : options.verbose
        })
        extractor.init()
        const insert = async () => {
            /**
             * true: Ignore `.include` and `.exclude` when specifying sources explicitly.
             * else: Insert according to the source of `.include` - `.exclude`.
             */
            if (specifiedSourcePaths?.length) {
                await extractor.insertFiles(specifiedSourcePaths)
            } else {
                await extractor.insertFiles(extractor.allowedSourcePaths)
            }
        }

        if (watch) {
            const reset = async () => {
                await insert()
                /* If the specified source does not exist, watch the .include - .exclude */
                if (!specifiedSourcePaths?.length && extractor.options.include) {
                    await extractor.watchSource(extractor.options.include, { ignored: extractor.options.exclude })
                }
            }
            extractor
                .on('watchStart', async () => {
                    await extractor.prepare()
                    await reset()
                    log``
                    log.t`Start watching source changes`
                })
                .on('reset', async () => {
                    await reset()
                    log``
                    log.t`Restart watching source changes`
                })
                .on('change', () => {
                    if (options?.export) {
                        extractor.export()
                    } else {
                        console.log(extractor.css.text)
                    }
                })
                .on('watchClose', () => {
                    log``
                    log.t`Stop watching source changes`
                })
            await extractor.startWatch()
        } else {
            await extractor.prepare()
            await insert()
            if (options?.export) {
                extractor.export()
            } else {
                console.log(extractor.css.text)
            }
        }
    })