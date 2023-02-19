import { program } from 'commander'
import { readPackage } from '../utils/read-package'
import fs from 'fs'
import defineContent from '../apis/define-content'

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