import type { Command } from 'commander'
import { options, type Options } from '~/packages/extractor/src'
import log from '@techor/log'

export default (program: Command) => program
    .command('extract')
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path', options.output)
    .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
    .option('--no-export', 'Print only CSS results.')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor')
    .action(async function (specifiedSourcePaths: any, options?: {
        watch?: boolean,
        output?: string,
        verbose?: number,
        export?: boolean,
        cwd?: string,
        options?: string | Options
    }) {
        const CSSExtractor = (await import('~/packages/extractor/src')).default
        const { watch, output, verbose, cwd, options: customOptions } = options || {}
        const extractor = new CSSExtractor(customOptions, cwd)
        extractor.on('init', (options: Options) => {
            if (specifiedSourcePaths?.length) {
                options.include = specifiedSourcePaths
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
        if (watch) {
            extractor
                .on('watchStart', async () => {
                    await extractor.prepare()
                    log``
                    log.t`Start watching source changes`
                })
                .on('reset', async () => {
                    await extractor.reset()
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
            if (options?.export) {
                extractor.export()
            } else {
                console.log(extractor.css.text)
            }
        }
    })