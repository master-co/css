import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
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
        const manifestJSONSource = readJSONFiles(join(nextDir, 'static/media'))
        const hydrationManifestJSONSource = readJSONFiles(join(nextDir, 'static/master-css/hydration'))

        expect(html).toContain('.fg\\:primary{color:var(--color-primary)}')
        expect(html).toContain(`${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="/_next/static/master-css/hydration/`)
        expect(html).not.toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        expect(html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0).toBe(0)
        expect(clientSource).not.toContain('font-weight-bold')
        expect(clientSource).not.toContain('#0070f3')
        expect(manifestJSONSource).toContain('font-weight-bold')
        expect(manifestJSONSource).toContain('#0070f3')
        expect(hydrationManifestJSONSource).toContain('"className":"fg:primary"')
    }, 120000)
})
