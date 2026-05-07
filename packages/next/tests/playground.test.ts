import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const playgroundDir = join(packageDir, 'playground')

function buildPlayground() {
    try {
        execFileSync('pnpm', ['--dir', playgroundDir, 'build'], {
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

function readJavaScriptFiles(dir: string): string {
    return readdirSync(dir).map((entry) => {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) return readJavaScriptFiles(path)
        return path.endsWith('.js') ? readFileSync(path, 'utf-8') : ''
    }).join('\n')
}

describe('playground', () => {
    it('imports master.css as a Next config module', () => {
        buildPlayground()

        const htmlPath = join(playgroundDir, '.next/server/app/index.html')
        const html = readFileSync(htmlPath, 'utf-8')
        const clientSource = readJavaScriptFiles(join(playgroundDir, '.next/static/chunks'))

        expect(html).toContain('.fg\\:primary{color:rgb(0 112 243)}')
        expect(clientSource).toContain('key:"primary",value:"#0070f3"')
    }, 120000)
})
