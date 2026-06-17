import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'
import execPnpmSync from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const playgroundDir = join(packageDir, 'playground')

function buildPlayground() {
    try {
        execPnpmSync(['--dir', playgroundDir, 'build'], {
            cwd: packageDir,
            encoding: 'utf-8',
            env: {
                ...process.env,
                NEXT_TELEMETRY_DISABLED: '1'
            },
            stdio: 'pipe',
            timeout: 120000
        })
    } catch (error) {
        const buildError = error as Error & { stdout?: string | Buffer, stderr?: string | Buffer }
        throw new Error([
            buildError.message,
            buildError.stdout?.toString(),
            buildError.stderr?.toString()
        ].filter(Boolean).join('\n'))
    }
}

function readOutputFiles(dir: string, matches: (path: string) => boolean): string {
    return readdirSync(dir).map((entry) => {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) return readOutputFiles(path, matches)
        return matches(path) ? readFileSync(path, 'utf-8') : ''
    }).join('\n')
}

function readJavaScriptFiles(dir: string): string {
    return readOutputFiles(dir, (path) => path.endsWith('.js'))
}

function readJSONFiles(dir: string): string {
    return readOutputFiles(dir, (path) => path.endsWith('.json'))
}

describe('playground', () => {
    it('imports the global CSS entry as a Next config module', () => {
        buildPlayground()

        const nextDir = join(playgroundDir, '.next')
        const htmlPath = join(nextDir, 'server/app/index.html')
        const html = readFileSync(htmlPath, 'utf-8')
        const clientSource = readJavaScriptFiles(join(nextDir, 'static/chunks'))
        const planJSONSource = readJSONFiles(join(nextDir, 'static/media'))

        expect(html).toContain('.fg\\:primary{color:var(--color-primary)}')
        expect(html).toContain(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`)
        expect(html.match(new RegExp(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`, 'g'))?.length).toBe(1)
        expect(clientSource).not.toContain('font-weight-bold')
        expect(clientSource).not.toContain('#0070f3')
        expect(planJSONSource).toContain('font-weight-bold')
        expect(planJSONSource).toContain('#0070f3')
    }, 120000)
})
