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
        {
            code: `<div class="w:md h:md">Composition utilities disabled</div>`,
            options: [{ preferCompositionUtilities: false }]
        },
        {
            code: `<div class="mt:md mb:md">Axis composition utilities disabled</div>`,
            options: [{ preferCompositionUtilities: false }]
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
            code: `<div class="w:md h:md min-w:md min-h:md max-w:md max-h:md">Composition utilities</div>`,
            output: `<div class="size:md min-size:md max-size:md">Composition utilities</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'w:md h:md', recommended: 'size:md' } },
                { messageId: 'preferClass', data: { actual: 'min-w:md min-h:md', recommended: 'min-size:md' } },
                { messageId: 'preferClass', data: { actual: 'max-w:md max-h:md', recommended: 'max-size:md' } },
            ]
        },
        {
            code: `<div class="mt:md mb:md ml:md mr:md pt:md pb:md pl:md pr:md">Axis composition utilities</div>`,
            output: `<div class="my:md mx:md py:md px:md">Axis composition utilities</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'mt:md mb:md', recommended: 'my:md' } },
                { messageId: 'preferClass', data: { actual: 'ml:md mr:md', recommended: 'mx:md' } },
                { messageId: 'preferClass', data: { actual: 'pt:md pb:md', recommended: 'py:md' } },
                { messageId: 'preferClass', data: { actual: 'pl:md pr:md', recommended: 'px:md' } },
            ]
        },
        {
            code: `<div class="width:md height:md w:1rem h:1rem w:md:hover h:md:hover margin-top:md margin-bottom:md padding-left:1rem padding-right:1rem">Composition after canonicalization</div>`,
            output: `<div class="size:md size:1rem size:md:hover my:md px:md">Composition after canonicalization</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'width:md height:md', recommended: 'size:md' } },
                { messageId: 'preferClass', data: { actual: 'w:1rem h:1rem', recommended: 'size:1rem' } },
                { messageId: 'preferClass', data: { actual: 'w:md:hover h:md:hover', recommended: 'size:md:hover' } },
                { messageId: 'preferClass', data: { actual: 'margin-top:md margin-bottom:md', recommended: 'my:md' } },
                { messageId: 'preferClass', data: { actual: 'padding-left:1rem padding-right:1rem', recommended: 'px:md' } },
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
            code: `clsx('width:md height:md')`,
            output: `clsx('size:md')`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'width:md height:md', recommended: 'size:md' } },
            ]
        },
        {
            code: `clsx('margin-top:md margin-bottom:md')`,
            output: `clsx('my:md')`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'margin-top:md margin-bottom:md', recommended: 'my:md' } },
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
        {
            code: 'ctl(`w:1rem h:1rem`)',
            output: 'ctl(`size:1rem`)',
            errors: [
                { messageId: 'preferClass', data: { actual: 'w:1rem h:1rem', recommended: 'size:1rem' } },
            ]
        },
        {
            code: 'ctl(`padding-left:1rem padding-right:1rem`)',
            output: 'ctl(`px:md`)',
            errors: [
                { messageId: 'preferClass', data: { actual: 'padding-left:1rem padding-right:1rem', recommended: 'px:md' } },
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
            code: `<template><div class="mt:md mb:md">Vue</div></template>`,
            output: `<template><div class="my:md">Vue</div></template>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'mt:md mb:md', recommended: 'my:md' } }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<div class="ml:md mr:md">Svelte</div>`,
            output: `<div class="mx:md">Svelte</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'ml:md mr:md', recommended: 'mx:md' } }],
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
        {
            code: `<div class="pt:md pb:md">Angular</div>`,
            output: `<div class="py:md">Angular</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'pt:md pb:md', recommended: 'py:md' } }],
            languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
        },
        {
            code: `
            # Test
            <div class="pl:md pr:md">MDX</div>`,
            output: `
            # Test
            <div class="px:md">MDX</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'pl:md pr:md', recommended: 'px:md' } }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ]
})
