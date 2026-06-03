import { ESLint } from 'eslint'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import plugin from '../src'

test('uses explicit Master CSS config objects from ESLint settings', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-eslint-'))

    try {
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
                            config: {
                                utilities: [
                                    {
                                        name: 'fixture-card',
                                        type: -4,
                                        layer: 'main',
                                        rules: [
                                            { selector: '&', declarations: { display: 'block' } }
                                        ]
                                    },
                                    {
                                        name: 'fixture-button',
                                        type: -4,
                                        layer: 'main',
                                        rules: [
                                            { selector: '&', declarations: { display: 'inline-flex' } }
                                        ]
                                    }
                                ]
                            }
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

test('uses project-level CSS config entries from the ESLint workspace', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-eslint-'))

    try {
        writeFileSync(join(cwd, 'index.css'), `
            @master;

            @master {
                .fixture-button {
                    display: inline-flex;
                }
            }
        `)
        writeFileSync(join(cwd, 'index.jsx'), `<div className="fixture-button zzz"></div>`)

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
