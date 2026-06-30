import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { DEFAULT_SCAN_OUTPUT } from './constants'
import type { ScanOptions } from './scan'
import type { LintOptions } from './lint'
import type { InspectOptions } from './inspect'
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
    program
        .command('lint')
        .description('Run machine-readable Master CSS diagnostics for source files.')
        .argument('[source paths...]', 'The glob pattern paths to lint sources')
        .option('--stdin', 'Read source content from stdin.')
        .option('--stdin-filepath <path>', 'File path used to infer the stdin source language.')
        .option('--fix', 'Apply safe class-list fixes to files.')
        .option('--fix-dry-run', 'Return fix proposals without writing files.')
        .option('--fix-directives', 'Allow structural directive fixes when --fix writes files.')
        .option('--format <format>', 'Diagnostic output format: json or stylish.', 'json')
        .option('--rules <rules>', 'Comma-separated lint rules, "recommended", or "all".')
        .option('--exit-code <mode>', 'Exit code behavior: diagnostics or never.', 'diagnostics')
        .option('--max-warnings <number>', 'Exit with a non-zero status if warnings exceed this count.')
        .action(async (sourcePaths: string[], options: LintOptions) => {
            const { default: runLint } = await import('./lint')
            await runLint(sourcePaths, options)
        })
    program
        .command('inspect')
        .description('Inspect scanner state, stylesheet entries, generated CSS, and missing CSS.')
        .argument('[source paths...]', 'The glob pattern paths to inspect')
        .option('--classes <classes>', 'Whitespace-separated class names to verify in generated CSS.')
        .option('--include-css', 'Include generated CSS text in the JSON report.')
        .option('--format <format>', 'Diagnostic output format: json or stylish.', 'json')
        .option('--exit-code <mode>', 'Exit code behavior: diagnostics or never.', 'diagnostics')
        .option('--max-warnings <number>', 'Exit with a non-zero status if warnings exceed this count.')
        .action(async (sourcePaths: string[], options: InspectOptions) => {
            const { default: runInspect } = await import('./inspect')
            await runInspect(sourcePaths, options)
        })
    const firstArgument = argv[2]
    if (firstArgument && removedCommands.has(firstArgument)) {
        errorRemovedCommand(program, firstArgument)
    }
    await program.parseAsync(argv)
    return program
}
