#!/usr/bin/env node

import { program } from 'commander'
import path from 'upath'
import fs from 'fs'
import { CONFIG_ESM_TEXT } from '../constants/config-esm-text'
import { CONFIG_TEXT } from '../constants/config-text'
import { CONFIG_TS_TEXT } from '../constants/config-ts-text'
import log from '@techor/log'
import { readJSONFileSync } from '@techor/fs'

program.command('init')
    .description('Initialize definition files for Master CSS')
    .option('-o, --override', 'Override existing definition file')
    .option('--esm', 'ES Module .mjs')
    .option('--ts', 'TypeScript .ts')
    .option('--cjs', 'CommonJS .js')
    .action(async function (options) {
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
    .option('-c --config', 'The source path of the Master CSS configuration', 'master.css.*')
    .option('-a --analyze', 'Analyze injected CSS and HTML size ( brotli ) without writing to file')
    .action(async function (args, options) {
        try {
            // @ts-expect-error dynamic import action
            const action = (await import('@master/css-renderer/actions/main')).default
            await action(args, options)
        } catch (error) {
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
    .option('-v, --verbose', 'Verbose logging 0~N', '1')
    .option('--options <path>', 'Specify your extractor options sources', 'master.css-extractor.*')
    .action(async function (args, options) {
        try {
            // @ts-expect-error dynamic import action
            const action = (await import('@master/css-extractor/actions/main')).default
            await action(args, options)
        } catch (error) {
            if (error.code === 'ERR_MODULE_NOT_FOUND') {
                log.i`Please run **npm** **install** **@master/css-extractor** first`
            } else {
                console.error(error)
            }
        }
    })

const { version, name, description } = readJSONFileSync(path.resolve(__dirname, '../../../package.json')) || {}

program.parse(process.argv)
program.name(name)
program.description(description)
program.version(version)