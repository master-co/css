import rule from '../src/rules/prefer-canonical-classes'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import UtilityType from '@master/css-schema/utility-type'

jsxTester.run('prefer canonical classes', rule, {
    valid: [
        { code: `<div class="text-center font:md m:md r:md fg:red-60">Recommended classes</div>` },
        { code: `<div class="btn width:error unknown-class">Unknown classes are ignored</div>` },
        { code: `<div class="text:muted grid-col-span:4">Manifest aliases are preserved</div>` },
        {
            code: `<div class="font:16px">Theme tokens disabled</div>`,
            options: [{ preferThemeTokens: false }]
        },
        {
            code: `<div class="margin:md">Property aliases disabled</div>`,
            options: [{ preferPropertyAliases: false }]
        },
        {
            code: `<div class="display:block">Static utilities disabled</div>`,
            options: [{ preferStaticUtilities: false }]
        },
        {
            code: `<div class="m:var(--spacing-md)">Variable references disabled</div>`,
            options: [{ preferVariableReferences: false }]
        },
        {
            code: `<div class="m:1rem|1.5rem">Multi-value tokens disabled</div>`,
            options: [{ preferMultiValueTokens: false }]
        },
    ],
    invalid: [
        {
            code: `<div class="text-align:center:hover@sm">Static pattern utility with variants</div>`,
            output: `<div class="text-center:hover@sm">Static pattern utility with variants</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'text-align:center:hover@sm', recommended: 'text-center:hover@sm' } }]
        },
        {
            code: `<div class="display:block align-items:center">Static utilities</div>`,
            output: `<div class="block items-center">Static utilities</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'display:block', recommended: 'block' } },
                { messageId: 'preferClass', data: { actual: 'align-items:center', recommended: 'items-center' } },
            ]
        },
        {
            code: `<div class="font:16px font:1rem r:.375rem">Variables</div>`,
            output: `<div class="font:md font:md r:md">Variables</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'font:1rem', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'r:.375rem', recommended: 'r:md' } },
            ]
        },
        {
            code: `<div class="m:4x margin:md padding-inline:md color:red-60">Aliases</div>`,
            output: `<div class="m:md m:md px:md fg:red-60">Aliases</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:4x', recommended: 'm:md' } },
                { messageId: 'preferClass', data: { actual: 'margin:md', recommended: 'm:md' } },
                { messageId: 'preferClass', data: { actual: 'padding-inline:md', recommended: 'px:md' } },
                { messageId: 'preferClass', data: { actual: 'color:red-60', recommended: 'fg:red-60' } },
            ]
        },
        {
            code: `<div class="font-size:md background-color:red-60">Named token keys</div>`,
            output: `<div class="font:md bg:red-60">Named token keys</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'font-size:md', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'background-color:red-60', recommended: 'bg:red-60' } },
            ]
        },
        {
            code: `<div class="m:1rem|1.5rem p:.5rem|1rem r:.25rem|.375rem">Multi-value tokens</div>`,
            output: `<div class="m:md|lg p:xs|md r:sm|md">Multi-value tokens</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:1rem|1.5rem', recommended: 'm:md|lg' } },
                { messageId: 'preferClass', data: { actual: 'p:.5rem|1rem', recommended: 'p:xs|md' } },
                { messageId: 'preferClass', data: { actual: 'r:.25rem|.375rem', recommended: 'r:sm|md' } },
            ]
        },
        {
            code: `<div class="m:var(--spacing-md) r:var(--radius-md) fg:var(--color-red-60)">Variable references</div>`,
            output: `<div class="m:md r:md fg:red-60">Variable references</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:var(--spacing-md)', recommended: 'm:md' } },
                { messageId: 'preferClass', data: { actual: 'r:var(--radius-md)', recommended: 'r:md' } },
                { messageId: 'preferClass', data: { actual: 'fg:var(--color-red-60)', recommended: 'fg:red-60' } },
            ]
        },
        {
            code: `clsx('display:block font:16px')`,
            output: `clsx('block font:md')`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'display:block', recommended: 'block' } },
                { messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } },
            ]
        },
        {
            code: 'ctl(`font:1rem r:.375rem`)',
            output: 'ctl(`font:md r:md`)',
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:1rem', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'r:.375rem', recommended: 'r:md' } },
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
}).run('prefer canonical classes custom components', rule, {
    valid: [
        { code: `<button class="btn">Component class</button>` }
    ],
    invalid: []
})

jsxTester.run('prefer canonical classes parser smoke tests', rule, {
    valid: [],
    invalid: [
        {
            code: `<template><div class="font:16px">Vue</div></template>`,
            output: `<template><div class="font:md">Vue</div></template>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<div class="margin:md">Svelte</div>`,
            output: `<div class="m:md">Svelte</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'margin:md', recommended: 'm:md' } }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
        {
            code: `<div class="text-align:center">Angular</div>`,
            output: `<div class="text-center">Angular</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'text-align:center', recommended: 'text-center' } }],
            languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
        },
        {
            code: `
            # Test
            <div class="display:block">MDX</div>`,
            output: `
            # Test
            <div class="block">MDX</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'display:block', recommended: 'block' } }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ]
})
