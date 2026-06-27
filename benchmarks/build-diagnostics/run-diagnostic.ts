import { writeFile } from 'node:fs/promises'
import { runBuildDiagnostic, type DiagnosticToolId } from '../shared/build-diagnostics'
import type { BenchmarkFixtureId } from '../shared/types'

const options = parseArgs(process.argv.slice(2))
const result = await runBuildDiagnostic({
    workspace: requireOption(options.workspace, 'workspace'),
    fixtureId: requireOption(options.fixtureId, 'fixture-id') as BenchmarkFixtureId,
    toolId: requireOption(options.toolId, 'tool-id') as DiagnosticToolId,
    variantId: requireOption(options.variantId, 'variant-id'),
    round: Number(requireOption(options.round, 'round'))
})

await writeFile(requireOption(options.output, 'output'), `${JSON.stringify(result, null, 2)}\n`)

function parseArgs(args: string[]) {
    const options: Record<string, string> = {}

    for (let index = 0; index < args.length; index += 2) {
        const key = args[index]
        const value = args[index + 1]
        if (!key?.startsWith('--') || value === undefined) {
            throw new Error(`Invalid argument list: ${args.join(' ')}`)
        }
        options[toCamelCase(key.slice(2))] = value
    }

    return options
}

function requireOption(value: string | undefined, name: string) {
    if (!value) throw new Error(`Missing --${name}.`)
    return value
}

function toCamelCase(value: string) {
    return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}
