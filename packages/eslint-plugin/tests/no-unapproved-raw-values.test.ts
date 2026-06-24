import UtilityType from '@master/css-schema/utility-type'
import { expect, test } from 'vitest'
import plugin from '../src/plugin'
import recommended from '../src/configs/recommended'
import rule from '../src/rules/no-unapproved-raw-values'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'

jsxTester.run('no unapproved raw values', rule, {
    valid: [
        { code: `<div class="font:md m:md m:md|lg fg:red-60 text-center">Tokens and static utilities</div>` },
        { code: `<div class="font:error unknown-class">Invalid and unknown classes are ignored</div>` },
        {
            code: `<div class="font:15px">Raw values disabled</div>`,
            options: [{ allowRawValues: true }]
        },
        {
            code: `<div class="w:50%">Allowed by generated property</div>`,
            options: [{ allowProperties: ['width'] }]
        },
        {
            code: `<div class="w:50%">Allowed by class key</div>`,
            options: [{ allowProperties: ['w'] }]
        },
        {
            code: `<div class="m:calc(1rem+1px)">Allowed by pattern</div>`,
            options: [{ allowedPatterns: ['^calc\\('] }]
        },
        {
            code: `<div class="m:md|calc(1rem+1px) m:calc(1rem+1px)|md">Allowed multi-value segment by pattern</div>`,
            options: [{ allowedPatterns: ['^calc\\('] }]
        },
    ],
    invalid: [
        {
            code: `<div class="font:15px m:17px fg:#123456">Raw values</div>`,
            errors: [
                { messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } },
                { messageId: 'unapprovedRawValue', data: { value: '17px', className: 'm:17px' } },
                { messageId: 'unapprovedRawValue', data: { value: '#123456', className: 'fg:#123456' } },
            ]
        },
        {
            code: `<div class="m:md|17px m:calc(1rem+1px)|18px m:19px|20px">Multi-value raw value segments</div>`,
            options: [{ allowedPatterns: ['^calc\\('] }],
            errors: [
                { messageId: 'unapprovedRawValue', data: { value: '17px', className: 'm:md|17px' } },
                { messageId: 'unapprovedRawValue', data: { value: '18px', className: 'm:calc(1rem+1px)|18px' } },
                { messageId: 'unapprovedRawValue', data: { value: '19px|20px', className: 'm:19px|20px' } },
            ]
        },
        {
            code: `clsx('font:15px m:17px')`,
            errors: [
                { messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } },
                { messageId: 'unapprovedRawValue', data: { value: '17px', className: 'm:17px' } },
            ]
        },
        {
            code: 'ctl(`fg:#123456`)',
            errors: [
                { messageId: 'unapprovedRawValue', data: { value: '#123456', className: 'fg:#123456' } },
            ]
        },
    ]
})

createTester({
    settings: {
        '@master/css': {
            manifest: createPresetManifest({
                utilities: [
                    {
                        name: 'btn',
                        type: UtilityType.Semantic,
                        layer: 'components',
                        declarations: { display: 'block' }
                    }
                ]
            })
        }
    }
}).run('no unapproved raw values custom components', rule, {
    valid: [
        { code: `<button class="btn">Component class</button>` }
    ],
    invalid: []
})

jsxTester.run('no unapproved raw values parser smoke tests', rule, {
    valid: [],
    invalid: [
        {
            code: `<template><div class="font:15px">Vue</div></template>`,
            errors: [{ messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<div class="font:15px">Svelte</div>`,
            errors: [{ messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
        {
            code: `<div class="font:15px">Angular</div>`,
            errors: [{ messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } }],
            languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
        },
        {
            code: `
            # Test
            <div class="font:15px">MDX</div>`,
            errors: [{ messageId: 'unapprovedRawValue', data: { value: '15px', className: 'font:15px' } }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ]
})

test('registers rule without enabling it in recommended config', () => {
    expect(plugin.rules?.['no-unapproved-raw-values']).toBe(rule)
    expect(recommended.rules?.['@master/css/no-unapproved-raw-values']).toBeUndefined()
})
