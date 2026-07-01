import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { applySetupPlan, createSetupPlan } from '.'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'))
// Keep these local so generated core.d.ts does not emit value imports for root-only types.
type CommandFramework = 'none' | 'vite' | 'react' | 'nextjs' | 'svelte' | 'nuxt' | 'astro' | 'webpack' | 'laravel' | 'lit' | 'angular'
type CommandFrameworkOption = CommandFramework | 'auto'
type CommandPackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const newProjectCommands = [
    'npm create vite@latest my-app',
    'cd my-app',
    'npm create @master/css@rc -- --yes'
]

export interface CommandOptions {
    cwd?: string
    framework?: CommandFrameworkOption
    eslint?: boolean
    mcp?: boolean
    ai?: boolean
    minimal?: boolean
    install?: CommandPackageManager | false
    dryRun?: boolean
    json?: boolean
    yes?: boolean
}

export type InstallResolution = CommandPackageManager | false | 'detected' | undefined
export type PromptQuestion = (question: string) => Promise<string>

export interface ResolvedCommandOptions {
    eslint: boolean
    mcp: boolean
    ai: boolean
    install: InstallResolution
}

export default async function runProgram(argv: string[] = process.argv) {
    const program = new Command()
    program
        .name('create-css')
        .description(pkg.description)
        .version(pkg.version || '0.0.0')

    const configure = (command: Command) => command
        .option('-C, --cwd <path>', 'Project root to update.')
        .option('--framework <framework>', 'Framework: auto, vite, react, react-router, vue, nextjs, svelte, nuxt, astro, webpack, laravel, lit, angular, none.', 'auto')
        .option('--eslint', 'Add the Master CSS recommended ESLint flat config.')
        .option('--no-eslint', 'Skip the Master CSS recommended ESLint flat config.')
        .option('--mcp', 'Add the Master CSS MCP package and print the stdio registration command.')
        .option('--no-mcp', 'Skip the Master CSS MCP package and registration command.')
        .option('--ai', 'Add Master CSS guidance to AGENTS.md.')
        .option('--no-ai', 'Skip Master CSS guidance for coding agents.')
        .option('--minimal', 'Only add core Master CSS framework setup.')
        .option('--install <package-manager>', 'Run dependency installation with npm, pnpm, yarn, or bun after edits.')
        .option('--no-install', 'Do not run dependency installation.')
        .option('--dry-run', 'Print the setup plan without writing files.')
        .option('--json', 'Print machine-readable JSON.')
        .option('-y, --yes', 'Accept recommended defaults and run package installation with the detected package manager.')

    configure(program)
        .argument('[project name]', 'Deprecated. The installer now updates the current project; use --cwd for another root.')
        .action(async (projectName: string | undefined, options: CommandOptions) => {
            if (projectName && projectName !== 'add') {
                program.error(`Project scaffolding is not provided by @master/create-css. Create a Vite project first, then run the installer from the project root:\n\n${formatNewProjectCommands()}`)
            }
            await runAdd(options)
        })

    configure(program.command('add').description('Add Master CSS to an existing project.'))
        .action(runAdd)

    await program.parseAsync(argv)
}

async function runAdd(options: CommandOptions) {
    const root = resolve(options.cwd || process.cwd())
    if (!options.dryRun && !options.json && !existsSync(join(root, 'package.json'))) {
        printNonProjectGuidance(root)
        return
    }

    const prompt = shouldPrompt(options) ? createTTYPrompt() : undefined
    let resolvedOptions: ResolvedCommandOptions
    try {
        resolvedOptions = await resolveCommandOptions(options, prompt?.question)
    } finally {
        prompt?.close()
    }

    const planInstall = resolvedOptions.install === 'detected' ? undefined : resolvedOptions.install
    const plan = createSetupPlan({
        root,
        framework: options.framework,
        eslint: resolvedOptions.eslint,
        mcp: resolvedOptions.mcp,
        ai: resolvedOptions.ai,
        install: planInstall
    })

    if (options.dryRun || options.json) {
        process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
        return
    }

    applySetupPlan(plan, {
        install: resolvedOptions.install === 'detected' ? plan.packageManager : resolvedOptions.install
    })

    if (!options.json) {
        printSummary(plan)
    }
}

export async function resolveCommandOptions(options: CommandOptions, prompt?: PromptQuestion): Promise<ResolvedCommandOptions> {
    const question = options.yes ? undefined : prompt
    return {
        eslint: await resolveRecommendedBoolean(options.eslint, options.minimal, 'Add Master CSS ESLint diagnostics?', question),
        mcp: await resolveRecommendedBoolean(options.mcp, options.minimal, 'Add the Master CSS MCP package?', question),
        ai: await resolveRecommendedBoolean(options.ai, options.minimal, 'Add Master CSS AI agent guidance?', question),
        install: await resolveInstall(options.install, options.yes, question)
    }
}

async function resolveRecommendedBoolean(value: boolean | undefined, minimal: boolean | undefined, question: string, prompt: PromptQuestion | undefined) {
    if (value !== undefined) return value
    if (minimal) return false
    if (prompt) return confirm(question, prompt)
    return true
}

async function resolveInstall(install: CommandPackageManager | false | undefined, yes: boolean | undefined, prompt: PromptQuestion | undefined): Promise<InstallResolution> {
    if (install !== undefined) return install
    if (yes) return 'detected'
    if (prompt) return await confirm('Install dependencies now?', prompt) ? 'detected' : false
    return undefined
}

async function confirm(question: string, prompt: PromptQuestion) {
    while (true) {
        const answer = (await prompt(`${question} (Y/n) `)).trim().toLowerCase()
        if (!answer || answer === 'y' || answer === 'yes') return true
        if (answer === 'n' || answer === 'no') return false
        process.stdout.write('Please answer yes or no.\n')
    }
}

function shouldPrompt(options: CommandOptions) {
    return !options.yes && !options.json && !options.dryRun && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY)
}

function createTTYPrompt() {
    const input = process.stdin
    const output = process.stdout
    const rl = createInterface({ input, output })
    return {
        question: (question: string) => rl.question(question),
        close: () => rl.close()
    }
}

function printNonProjectGuidance(root: string) {
    process.stdout.write(`No package.json was found in ${root}.\n`)
    process.stdout.write('@master/create-css adds Master CSS to an existing project.\n\n')
    process.stdout.write('Create a Vite project first, then run the installer from the project root:\n\n')
    process.stdout.write(`${formatNewProjectCommands()}\n`)
}

function formatNewProjectCommands() {
    return newProjectCommands.map((command) => `  ${command}`).join('\n')
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
