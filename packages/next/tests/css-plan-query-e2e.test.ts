import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import pnpmCommand from './helpers/pnpm-command'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'e2e/css-plan-query')

function buildFixture() {
    try {
        execFileSync(pnpmCommand, ['--dir', fixtureDir, 'build'], {
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

describe('css plan query e2e', () => {
    it('builds a clean Next project that imports an explicit CSS plan resource', () => {
        buildFixture()

        const html = readFileSync(join(fixtureDir, '.next/server/app/index.html'), 'utf-8')

        expect(html).toContain('data-color="#4b6fff"')
        expect(html).toContain('data-breakpoint="1234"')
    }, 120000)
})
