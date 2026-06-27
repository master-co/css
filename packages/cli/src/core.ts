import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { DEFAULT_SCAN_OUTPUT } from './constants'
import type { ScanOptions } from './scan'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'))
const removedCommands = new Set(['extract', 'render', 'scan'])

function errorRemovedCommand(program: Command, command: string) {
    program.error(`The "${command}" command was removed. Use "${pkg.name}" directly, for example "${pkg.name} -w".`)
}

export default async function runProgram(argv: string[] = process.argv) {
    const program = new Command()
    program
        .name(pkg.name)
        .description(pkg.description)
        .version(pkg.version || '0.0.0')
        .argument('[source paths...]', 'The glob pattern paths to scan sources')
        .option('-w, --watch', 'Watch file changes and generate CSS rules.')
        .option('-o, --output <path>', 'Specify your CSS file output path', DEFAULT_SCAN_OUTPUT)
        .option('-v, --verbose <level>', 'Verbose logging 0~N', '1')
        .option('--no-export', 'Print only CSS results.')
        .action(async (sourcePaths: string[], options: ScanOptions) => {
            const removedCommand = sourcePaths[0]
            if (removedCommand && removedCommands.has(removedCommand)) {
                errorRemovedCommand(program, removedCommand)
            }
            const { default: runScan } = await import('./scan')
            return runScan(sourcePaths, options)
        })
    const firstArgument = argv[2]
    if (firstArgument && removedCommands.has(firstArgument)) {
        errorRemovedCommand(program, firstArgument)
    }
    await program.parseAsync(argv)
    return program
}
