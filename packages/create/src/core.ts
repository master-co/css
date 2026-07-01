import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { applySetupPlan, createSetupPlan, type FrameworkOption, type PackageManager } from '.'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'))

interface CommandOptions {
    cwd?: string
    framework?: FrameworkOption
    eslint?: boolean
    mcp?: boolean
    ai?: boolean
    install?: PackageManager | false
    dryRun?: boolean
    json?: boolean
    yes?: boolean
}

export default async function runProgram(argv: string[] = process.argv) {
    const program = new Command()
    program
        .name('create-css')
        .description(pkg.description)
        .version(pkg.version || '0.0.0')

    const configure = (command: Command) => command
        .option('-C, --cwd <path>', 'Project root to update.')
        .option('--framework <framework>', 'Framework: auto, vite, nextjs, svelte, nuxt, astro, webpack, none.', 'auto')
        .option('--eslint', 'Add the Master CSS recommended ESLint flat config.')
        .option('--mcp', 'Add the Master CSS MCP package and print the stdio registration command.')
        .option('--ai', 'Add Master CSS guidance to AGENTS.md.')
        .option('--install <package-manager>', 'Run dependency installation with npm, pnpm, yarn, or bun after edits.')
        .option('--no-install', 'Do not run dependency installation.')
        .option('--dry-run', 'Print the setup plan without writing files.')
        .option('--json', 'Print machine-readable JSON.')
        .option('-y, --yes', 'Accept defaults and run package installation with the detected package manager.')

    configure(program)
        .argument('[project name]', 'Deprecated. The installer now updates the current project; use --cwd for another root.')
        .action(async (projectName: string | undefined, options: CommandOptions) => {
            if (projectName && projectName !== 'add') {
                program.error('Project scaffolding was removed. Run "create-css add" inside an existing project, or pass --cwd.')
            }
            await runAdd(options)
        })

    configure(program.command('add').description('Add Master CSS to an existing project.'))
        .action(runAdd)

    await program.parseAsync(argv)
}

async function runAdd(options: CommandOptions) {
    const root = resolve(options.cwd || process.cwd())
    const plan = createSetupPlan({
        root,
        framework: options.framework,
        eslint: options.eslint,
        mcp: options.mcp,
        ai: options.ai,
        install: options.install,
        yes: options.yes
    })

    if (options.dryRun || options.json) {
        process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
        if (options.dryRun) return
    }

    applySetupPlan(plan, {
        install: options.install,
        yes: options.yes
    })

    if (!options.json) {
        printSummary(plan)
    }
}

function printSummary(plan: ReturnType<typeof createSetupPlan>) {
    process.stdout.write(`Master CSS setup complete for ${plan.framework}.\n`)
    process.stdout.write(`Dependencies planned: ${plan.summary.dependencies}\n`)
    process.stdout.write(`Files created: ${plan.summary.filesToCreate}\n`)
    process.stdout.write(`Files updated: ${plan.summary.filesToUpdate}\n`)
    for (const warning of plan.warnings) {
        process.stdout.write(`Warning: ${warning}\n`)
    }
    for (const command of plan.commands) {
        process.stdout.write(`Next: ${command.command}\n`)
    }
}
