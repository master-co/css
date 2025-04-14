import type { Command } from 'commander'
import { options, type Options } from '@master/css-builder'
import log from '@techor/log'

export default (program: Command) => program
    .command('extract')
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path', options.output)
    .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
    .option('--no-export', 'Print only CSS results.')
    .option('--options <path>', 'Specify your builder options sources', 'master.css-builder')
    .action(async function (specifiedSourcePaths: any, options?: {
        watch?: boolean,
        output?: string,
        verbose?: number,
        export?: boolean,
        cwd?: string,
        options?: string | Options
    }) {
        const CSSBuilder = (await import('@master/css-builder')).default
        const { watch, output, verbose, cwd, options: customOptions } = options || {}
        const builder = new CSSBuilder(customOptions, cwd)
        builder.on('init', (options: Options) => {
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
        builder.init()
        if (watch) {
            builder
                .on('watchStart', async () => {
                    await builder.prepare()
                    log``
                    log.t`Start watching source changes`
                })
                .on('reset', async () => {
                    await builder.reset()
                    log``
                    log.t`Restart watching source changes`
                })
                .on('change', () => {
                    if (options?.export) {
                        builder.export()
                    } else {
                        console.log(builder.css.text)
                    }
                })
                .on('watchClose', () => {
                    log``
                    log.t`Stop watching source changes`
                })
            await builder.startWatch()
        } else {
            await builder.prepare()
            if (options?.export) {
                builder.export()
            } else {
                console.log(builder.css.text)
            }
        }
    })