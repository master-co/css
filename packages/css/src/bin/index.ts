#!/usr/bin/env node

import { program } from 'commander'
import path from 'path'
import { readPackage } from '../utils/read-package'

import chokidar from 'chokidar'
import fs from 'fs'
import fg from 'fast-glob'
import defineContent from '../methods/define-content'

program.command('init')
    .description('Create a Master CSS definition file with configuration')
    .allowUnknownOption()
    .option('--jit', 'With initialization of the just-in-time program')
    .option('-c, --compiler', 'With compiler options')
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
        fs.writeFileSync(`master.css.${ext}`, definition)
        process.stdout.write(definition)
    })

program.command('build', { isDefault: true })
    .allowUnknownOption()
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specific your master CSS file output path', 'master.css')
    .action(async function ({ watch, output }) {
        console.log(watch, output)
        // @ts-ignore
        const compiler = await new (await import('@master/css-compiler')).default().compile()
        const insert = (path: string) => compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
        const write = () => fs.writeFileSync(output, compiler.css.text)
        if (watch) {
            const handle = (path: string) => {
                insert(path)
                write()
            }
            const waching = (watcher: chokidar.FSWatcher) => {
                watcher
                    .on('add', handle)
                    .on('change', handle)
            }
            waching(
                chokidar.watch(compiler.sources)
            )
        } else {
            const filePaths = fg.sync(compiler.sources)
            filePaths.forEach(insert)
            write()
        }
    })

const { version, name, description } = readPackage(path.join(__dirname, '../../package.json'))
program
    .name(name)
    .description(description)
    .version(version)

program.parse()