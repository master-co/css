import { resolve } from 'node:path'
import { Command } from 'commander'
import { readJSONFileSync } from '@techor/fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import commandExtract from './commands/extract'
import commandRender from './commands/render'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = readJSONFileSync(resolve(__dirname, '../package.json'))

export default function runProgram(argv: string[] = process.argv) {
    const program = new Command()
    program
        .name(pkg.name)
        .description(pkg.description)
        .version(pkg.version || '0.0.0')
    commandExtract(program)
    commandRender(program)
    program.parse(argv)
    return program
}