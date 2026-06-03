import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { describe, it } from 'vitest'

const require = createRequire(import.meta.url)
const tscPath = require.resolve('typescript/bin/tsc')

describe('@master/css.vite/client', () => {
    it('provides types for Master CSS config virtual modules', () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-client-'))

        try {
            const cssPackageDir = path.join(root, 'node_modules/@master/css')
            const vitePackageDir = path.join(root, 'node_modules/@master/css.vite')
            const sourceDir = path.join(root, 'src')

            mkdirSync(cssPackageDir, { recursive: true })
            mkdirSync(vitePackageDir, { recursive: true })
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
                path.join(vitePackageDir, 'package.json'),
                JSON.stringify({
                    name: '@master/css.vite',
                    exports: {
                        './client': {
                            types: './client.d.ts'
                        }
                    }
                })
            )
            writeFileSync(
                path.join(vitePackageDir, 'client.d.ts'),
                readFileSync(path.resolve(__dirname, '../client.d.ts'), 'utf8')
            )
            writeFileSync(
                path.join(sourceDir, 'main.ts'),
                `
/// <reference types="@master/css.vite/client" />

import type { Config } from '@master/css'
import 'virtual:master-utilities.css'
import virtualConfig from 'virtual:master-css-config'
import localConfig from './app.css?master-css-config'

virtualConfig satisfies Config
localConfig satisfies Config
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
