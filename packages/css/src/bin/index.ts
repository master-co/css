#!/usr/bin/env node

import { existsSync, writeFileSync } from 'fs'
const { Command } = require('commander')
const path = require('path')
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
            if (existsSync('tsconfig.json')) {
                ts = true
            } else {
                const { type } = readJSONFileSync('./package.json') || {}
                type === 'module'
                    ? esm = true
                    : cjs = true
            }
        }
        const create = (fileName: string, text: string) => {
            const configExists = existsSync(path.join(process.cwd(), fileName))
            if (!configExists) {
                writeFileSync(fileName, text)
                log.ok`**${fileName}** file is created`
            } else if (configExists && options.override) {
                writeFileSync(fileName, text)
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

program.parse()