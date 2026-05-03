import { ESLint } from 'eslint'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import plugin from '../src'

test('loads Master CSS TypeScript config files from the ESLint cwd', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-eslint-'))

    try {
        writeFileSync(join(cwd, 'preset.css.ts'), `
            import type { Config } from '@master/css'

            export default {
                components: {
                    'fixture-card': 'block'
                }
            } as Config
        `)
        writeFileSync(join(cwd, 'master.css.ts'), `
            import type { Config } from '@master/css'
            import preset from './preset.css'

            export default {
                extends: [
                    preset
                ],
                components: {
                    'fixture-button': 'inline-flex'
                }
            } as Config
        `)
        writeFileSync(join(cwd, 'index.jsx'), `<div className="fixture-button fixture-card zzz"></div>`)

        const eslint = new ESLint({
            cwd,
            overrideConfigFile: true,
            overrideConfig: [
                {
                    files: ['**/*.jsx'],
                    plugins: {
                        '@master/css': plugin
                    },
                    languageOptions: {
                        parserOptions: {
                            ecmaVersion: 2022,
                            sourceType: 'module',
                            ecmaFeatures: {
                                jsx: true
                            }
                        }
                    },
                    settings: {
                        '@master/css': {
                            config: 'master.css'
                        }
                    },
                    rules: {
                        '@master/css/class-validation': [
                            'error',
                            {
                                disallowUnknownClass: true
                            }
                        ]
                    }
                }
            ]
        })

        const [result] = await eslint.lintFiles('index.jsx')

        expect(result.messages.map((message) => message.message)).toStrictEqual([
            '"zzz" is not a valid or known class.'
        ])
    } finally {
        rmSync(cwd, { force: true, recursive: true })
    }
})
