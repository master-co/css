import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, it } from 'vitest'

const require = createRequire(import.meta.url)
const tscPath = require.resolve('typescript/bin/tsc')

describe('@master/css.next/client', () => {
    it('provides types for CSS config query imports', () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-next-client-'))

        try {
            const cssPackageDir = path.join(root, 'node_modules/@master/css')
            const nextPackageDir = path.join(root, 'node_modules/@master/css.next')
            const sourceDir = path.join(root, 'src')

            mkdirSync(cssPackageDir, { recursive: true })
            mkdirSync(nextPackageDir, { recursive: true })
            mkdirSync(sourceDir, { recursive: true })

            writeFileSync(
                path.join(cssPackageDir, 'package.json'),
                JSON.stringify({
                    name: '@master/css',
                    types: './index.d.ts'
                })
            )
            writeFileSync(
                path.join(cssPackageDir, 'index.d.ts'),
                'export interface Config { variables?: unknown[] }\n'
            )
            writeFileSync(
                path.join(nextPackageDir, 'package.json'),
                JSON.stringify({
                    name: '@master/css.next',
                    exports: {
                        './client': {
                            types: './client.d.ts'
                        }
                    }
                })
            )
            writeFileSync(
                path.join(nextPackageDir, 'client.d.ts'),
                readFileSync(path.resolve(__dirname, '../client.d.ts'), 'utf8')
            )
            writeFileSync(
                path.join(sourceDir, 'main.ts'),
                `
/// <reference types="@master/css.next/client" />

import type { Config } from '@master/css'
import config from './master.css?master-css-config'
import virtualConfig from 'virtual:master-css-config'
import 'virtual:master.css'

config satisfies Config
virtualConfig satisfies Config
`.trimStart()
            )
            writeFileSync(
                path.join(root, 'tsconfig.json'),
                JSON.stringify({
                    compilerOptions: {
                        target: 'ES2020',
                        module: 'ESNext',
                        moduleResolution: 'bundler',
                        strict: true,
                        noEmit: true
                    },
                    include: ['src']
                })
            )

            execFileSync(process.execPath, [tscPath, '-p', root, '--pretty', 'false'], {
                cwd: root,
                stdio: 'pipe'
            })
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
