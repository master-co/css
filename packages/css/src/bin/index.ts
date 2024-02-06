#!/usr/bin/env node

const { Command } = require('commander')
const path = require('path')
const fs = require('fs')
const log = require('@techor/log')
const { readJSONFileSync } = require('@techor/fs')
const pkg = readJSONFileSync(path.resolve(__dirname, '../../package.json'))
const program = new Command()

const CONFIG_ESM_TEXT = require('../master.css.mjs.txt')
const CONFIG_TS_TEXT = require('../master.css.ts.txt')
const CONFIG_TEXT = require('../master.css.js.txt')

program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version || '0.0.0')

program.command('init')
    .description('Initialize definition files for Master CSS')
    .option('-o, --override', 'Override existing definition file')
    .option('--esm', 'ES Module .mjs')
    .option('--ts', 'TypeScript .ts')
    .option('--cjs', 'CommonJS .js')
    .action(async function (options: { override?: any; esm?: any; ts?: any; cjs?: any }) {
        let { esm, ts, cjs } = options
        // automatically detect the format
        if (!esm && !ts && !cjs) {
            if (fs.existsSync('tsconfig.json')) {
                ts = true
            } else {
                const { type } = readJSONFileSync('./package.json') || {}
                type === 'module'
                    ? esm = true
                    : cjs = true
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
        if (esm) {
            create('master.css.mjs', CONFIG_ESM_TEXT)
        }
        if (ts) {
            create('master.css.ts', CONFIG_TS_TEXT)
        }
        if (cjs) {
            create('master.css.js', CONFIG_TEXT)
        }
    })

program.command('render')
    .description('Scans HTML and injects generated CSS rules')
    .argument('<source paths>', 'The path in glob patterns of the source of the HTML file')
    .option('-c --config <path>', 'The source path of the Master CSS configuration', 'master.css.*')
    .option('-a --analyze', 'Analyze injected CSS and HTML size ( brotli ) without writing to file')
    .action(async function (args: any, options: any) {
        try {
            const action = require('@master/css-renderer/actions/main')
            await action(args, options)
        } catch (error: any) {
            if (error.code === 'ERR_MODULE_NOT_FOUND') {
                log.i`Please run **npm** **install** **@master/css-renderer** first`
            } else {
                console.error(error)
            }
        }
    })

program.command('extract')
    .argument('[source paths]', 'The glob pattern path to extract sources')
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specify your CSS file output path')
    .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
    .option('--no-export', 'Print only CSS results.')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor.*')
    .action(async function (args: any, options: any) {
        try {
            const action = require('@master/css-extractor/actions/main')
            await action(args, options)
        } catch (error: any) {
            if (error.code === 'ERR_MODULE_NOT_FOUND') {
                log.i`Please run **npm** **install** **@master/css-extractor** first`
            } else {
                console.error(error)
            }
        }
    })

program.parse()