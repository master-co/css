import { ESLint } from 'eslint'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import plugin from '../src'
import { createPresetPlan } from './helpers/create-preset-plan'
import UtilityType from 'shared/utility-type'

test('uses explicit Master CSS plan objects from ESLint settings', async () => {
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
                            plan: createPresetPlan({
                                utilities: [
                                    {
                                        name: 'fixture-card',
                                        type: UtilityType.Semantic,
                                        layer: 'components',
                                        rules: [
                                            { selector: '&', declarations: { display: 'block' } }
                                        ]
                                    },
                                    {
                                        name: 'fixture-button',
                                        type: UtilityType.Semantic,
                                        layer: 'components',
                                        rules: [
                                            { selector: '&', declarations: { display: 'inline-flex' } }
                                        ]
                                    }
                                ]
                            })
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

test('uses project-level CSS plan entries from the ESLint workspace', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-eslint-'))

    try {
        writeFileSync(join(cwd, 'index.css'), `
            @master;

            @components {
                fixture-button {
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
