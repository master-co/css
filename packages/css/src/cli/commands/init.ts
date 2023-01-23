import { program } from 'commander'
import { readPackage } from '../utils/read-package'
import fs from 'fs'
import { masterCSSFileSchema } from '../schemas/file-schema'
import { masterCSSESMFileSchema } from '../schemas/esm-file-schema'
import { masterCSSTSFileSchema } from '../schemas/ts-file-schema'

program.command('init')
    .allowUnknownOption()
    .option('--jit', 'create config with jit options')
    .option('--aot', 'create config with aot options')
    .option('--ts', 'create config with ts format')
    .action(function () {
        const { jit, aot, ts } = this.opts()

        let createSchemaFunc: ({ aot, jit }) => string
        let ext: string
        if (ts || fs.existsSync('./tsconfig.json')) {
            ext = 'ts'
            createSchemaFunc = masterCSSTSFileSchema
        } else {
            const { type } = readPackage()
            if (type === 'module') {
                ext = 'mjs'
                createSchemaFunc = masterCSSESMFileSchema
            } else {
                ext = 'cjs'
                createSchemaFunc = masterCSSFileSchema
            }

            ext = type === 'module'
                ? 'mjs'
                : 'cjs'
        }

        fs.writeFileSync(`master.css.${ext}`, createSchemaFunc({ jit, aot }))
    })