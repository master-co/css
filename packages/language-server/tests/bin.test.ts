import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, test, expect } from 'vitest'

const pkgRoot = resolve(__dirname, '..')
const builtBin = resolve(pkgRoot, 'dist/bin/index.cjs')

describe('bin', () => {
    test('package.json declares mcss-language-server bin pointing at the built script', async () => {
        const pkg = JSON.parse(await readFile(resolve(pkgRoot, 'package.json'), 'utf8'))
        expect(pkg.bin).toBeDefined()
        expect(pkg.bin['mcss-language-server']).toBe('./dist/bin/index.cjs')
        expect(pkg.bin['master-css-language-server']).toBe('./dist/bin/index.cjs')
    })

    test('bin source has node shebang and starts CSSLanguageServer', async () => {
        const src = await readFile(resolve(pkgRoot, 'src/bin/index.ts'), 'utf8')
        expect(src.startsWith('#!/usr/bin/env node')).toBe(true)
        expect(src).toMatch(/CSSLanguageServer/)
        expect(src).toMatch(/\.start\(\)/)
    })

    test.skipIf(!existsSync(builtBin))(
        'built bin file is executable and responds to LSP initialize',
        async () => {
            // Permission bit
            const st = await stat(builtBin)
            // S_IXUSR = 0o100
            expect((st.mode & 0o100) !== 0).toBe(true)

            // Spawn the bin and send a real LSP initialize request.
            const child = spawn('node', [builtBin, '--stdio'])
            const msg = JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'initialize',
                params: { rootUri: null, workspaceFolders: [], capabilities: {} }
            })
            child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`)

            const got = await new Promise<string>((resolveOut, reject) => {
                let buf = ''
                let stderr = ''
                const t = setTimeout(() => {
                    child.kill()
                    reject(new Error(`Timeout. stdout: ${buf.slice(0, 200)}, stderr: ${stderr.slice(0, 200)}`))
                }, 6000)
                child.stdout.on('data', (d) => {
                    buf += d.toString()
                    if (buf.includes('capabilities')) {
                        clearTimeout(t)
                        child.kill()
                        resolveOut(buf)
                    }
                })
                child.stderr.on('data', (d) => { stderr += d.toString() })
                child.on('error', reject)
            })

            expect(got).toMatch(/Content-Length:/)
            expect(got).toMatch(/"jsonrpc":"2\.0","id":1/)
            expect(got).toMatch(/"capabilities":/)
        },
        15000
    )
})
