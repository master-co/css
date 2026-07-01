import { ESLint } from 'eslint'
import { expect, test } from 'vitest'
import * as mdx from 'eslint-mdx'
import plugin from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

test('recommended config autofixes cross-rule class lists to a stable result', async () => {
    const overrideConfig = [
        plugin.configs.recommended,
        {
            settings: {
                '@master/css': {
                    manifest: createPresetManifest()
                }
            }
        }
    ]
    const preferCanonicalOnly = new ESLint({
        fix: (message) => message.ruleId === '@master/css/prefer-canonical-classes',
        overrideConfigFile: true,
        overrideConfig
    })
    const recommendedFix = new ESLint({
        fix: true,
        overrideConfigFile: true,
        overrideConfig
    })

    const [canonicalResult] = await preferCanonicalOnly.lintText(
        `clsx('size:md w:md h:md block')`,
        { filePath: 'fixture.js' }
    )
    const canonicalOutput = canonicalResult.output
    expect(canonicalOutput).toBe(`clsx('size:md size:md block')`)
    if (!canonicalOutput) throw new Error('Expected canonical output')
    expect(canonicalResult.messages.map((message) => message.ruleId)).toEqual([
        '@master/css/sort-classes',
        '@master/css/no-conflicting-classes'
    ])

    const [fixedResult] = await recommendedFix.lintText(canonicalOutput, { filePath: 'fixture.js' })
    const fixedOutput = fixedResult.output
    expect(fixedOutput).toBe(`clsx('block size:md')`)
    if (!fixedOutput) throw new Error('Expected fixed output')
    expect(fixedResult.messages).toEqual([])

    const [stableResult] = await recommendedFix.lintText(fixedOutput, { filePath: 'fixture.js' })
    expect(stableResult.output).toBeUndefined()
    expect(stableResult.messages).toEqual([])
})

test('recommended config autofixes mdx fenced examples', async () => {
    const overrideConfig = [
        plugin.configs.recommended,
        {
            files: ['**/*.mdx'],
            languageOptions: {
                parser: mdx
            }
        },
        {
            settings: {
                '@master/css': {
                    manifest: createPresetManifest()
                }
            }
        }
    ]
    const recommendedFix = new ESLint({
        fix: true,
        overrideConfigFile: true,
        overrideConfig
    })
    const source = [
        '```html',
        '<button class="inline-flex align-items:center gap:2x px:md py:xs r:md fg:white bg:blue-60">',
        '    Save',
        '</button>',
        '```'
    ].join('\n')

    const [fixedResult] = await recommendedFix.lintText(source, { filePath: 'fixture.mdx' })
    expect(fixedResult.output).toBe([
        '```html',
        '<button class="inline-flex items-center gap:xs px:md py:xs r:md bg:blue-60 fg:white">',
        '    Save',
        '</button>',
        '```'
    ].join('\n'))

    const disabledSource = [
        '{/* eslint-disable @master/css/sort-classes -- intentional example */}',
        '```html',
        '<button class="fg:white bg:blue-60">Save</button>',
        '```',
        '{/* eslint-enable @master/css/sort-classes */}'
    ].join('\n')
    const [disabledResult] = await recommendedFix.lintText(disabledSource, { filePath: 'fixture.mdx' })
    expect(disabledResult.output).toBeUndefined()
    expect(disabledResult.messages).toEqual([])
})
