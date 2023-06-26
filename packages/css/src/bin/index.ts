#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import fs from 'fs'
import { CONFIG_ESM_TEXT } from '../constants/config-esm-text'
import { CONFIG_TEXT } from '../constants/config-text'
import { CONFIG_TS_TEXT } from '../constants/config-ts-text'
import log from '@techor/log'
import { readFileAsJSON } from '@techor/fs'

program.command('render', 'Alias for mcss-render')
program.command('extract', 'Alias for mcss-extract')
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
                const { type } = readFileAsJSON('./package.json') || {}
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

const { version, name, description } = readFileAsJSON('../../../package.json', { cwd: __dirname }) || {}

program.parse(process.argv)
program.name(name)
program.description(description)
program.version(version)