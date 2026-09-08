import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'

// BH-0019: watching a project must include files created after startup.
it('scans a new sibling HTML file after an existing-file change', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-watch-'))
    const output = join(cwd, 'master.css')
    const source = join(cwd, 'index.html')
    writeFileSync(source, '<div class="block"></div>')
    const child = spawn(process.execPath, [
        '--import', createRequire(import.meta.url).resolve('tsx'),
        resolve(__dirname, '../src/bin/index.ts'), 'generate', '--watch'
    ], { cwd, env: { ...process.env, TSX_TSCONFIG_PATH: resolve(__dirname, '../../../tsconfig.json') } })
    let stderr = ''
    child.stderr.on('data', (chunk) => { stderr += chunk })
    const css = () => existsSync(output) ? readFileSync(output, 'utf8') : ''
    const waitUntil = async (check: () => boolean, timeout = 10000) => {
        const deadline = Date.now() + timeout
        while (!check() && Date.now() < deadline && child.exitCode === null) {
            await new Promise((resolveWait) => setTimeout(resolveWait, 50))
        }
        expect(check(), stderr).toBe(true)
    }
    try {
        await waitUntil(() => stderr.includes('Start watching source changes'))
        expect(css()).toContain('.block{display:block}')
        writeFileSync(source, '<div class="hidden"></div>')
        await waitUntil(() => css().includes('.hidden{display:none}'))
        writeFileSync(join(cwd, 'new.html'), '<div class="flex"></div>')
        await waitUntil(() => css().includes('.flex{display:flex}'), 5000)
    } finally {
        if (child.exitCode === null) {
            const exited = once(child, 'exit')
            child.kill('SIGTERM')
            const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
            await exited
            clearTimeout(timer)
        }
        rmSync(cwd, { recursive: true, force: true })
    }
}, 30000)
