import { program } from 'commander'
import { readPackage } from '../utils/read-package'
import fs from 'fs'
import { generateCJSFileSchema, generateTSFileSchema, generateESMFileSchema } from '../'

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
            createSchemaFunc = generateTSFileSchema
        } else {
            const { type } = readPackage()
            if (type === 'module') {
                ext = 'mjs'
                createSchemaFunc = generateESMFileSchema
            } else {
                ext = 'cjs'
                createSchemaFunc = generateCJSFileSchema
            }

            ext = type === 'module'
                ? 'mjs'
                : 'cjs'
        }

        fs.writeFileSync(`master.css.${ext}`, createSchemaFunc({ jit, aot }))
    })