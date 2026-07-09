import rule from '../src/rules/prefer-canonical-classes'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import UtilityType from '@master/css-schema/utility-type'
import stylesheetParser from '../src/stylesheet-parser'

const cssParser = {
    meta: {
        name: 'master-css-test-css-parser',
        version: '1.0.0'
    },
    parseForESLint(code: string) {
        const lines = code.split(/\r\n|[\r\n]/)
        return {
            ast: {
                type: 'Program',
                body: [],
                sourceType: 'module',
                comments: [],
                tokens: [],
                range: [0, code.length],
                loc: {
                    start: { line: 1, column: 0 },
                    end: { line: lines.length, column: lines.at(-1)?.length || 0 }
                }
            },
            services: {},
            visitorKeys: {
                Program: []
            }
        }
    }
}

const customManifest = createPresetManifest({
    settings: {
        rootSize: 16,
        modes: ['dark', 'midnight']
    },
    atRules: {
        tablet: {
            id: 'media',
            nodes: [{ type: 'number', value: 48, unit: 'rem' }]
        }
    },
    breakpointAtRules: {
        tablet: {
            id: 'media',
            nodes: [{ type: 'number', value: 48, unit: 'rem' }]
        }
    },
    variables: [
        { namespace: 'breakpoint', key: 'tablet', name: 'breakpoint-tablet', type: 'number', value: '48rem', numeric: { value: 48, unit: 'rem' } },
        { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
    ],
    variants: [
        { token: '@wide', branches: [{ atRules: ['@media (min-width: 80rem)'] }] }
    ],
    utilities: [
        {
            name: 'content-auto',
            type: UtilityType.Semantic,
            layer: 'utilities',
            declarations: { 'content-visibility': 'auto' }
        },
        {
            name: 'btn',
            type: UtilityType.Semantic,
            layer: 'components',
            declarations: { display: 'block' }
        }
    ]
})

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
        {
            code: `<div class="block@dark@sm">Condition order disabled</div>`,
            options: [{ preferConditionOrder: false }]
        },
        {
            code: `<div class="font:16px@dark@sm">Theme tokens and condition order disabled</div>`,
            options: [{ preferThemeTokens: false, preferConditionOrder: false }]
        },
        {
            code: `<div class="block@sm:hover block:focus:hover block@start@sm block@print@sm block@supports(display:grid)@sm">Unsafe suffix order</div>`
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
            code: `<div class="block@dark@sm block:hover@dark@sm block!@dark@sm">Condition order</div>`,
            output: `<div class="block@sm@dark block:hover@sm@dark block!@sm@dark">Condition order</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } },
                { messageId: 'preferClass', data: { actual: 'block:hover@dark@sm', recommended: 'block:hover@sm@dark' } },
                { messageId: 'preferClass', data: { actual: 'block!@dark@sm', recommended: 'block!@sm@dark' } },
            ]
        },
        {
            code: `<div class="font:16px@dark@sm text-align:center@dark@sm">Condition order with canonical classes</div>`,
            output: `<div class="font:md@sm@dark text-center@sm@dark">Condition order with canonical classes</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px@dark@sm', recommended: 'font:md@sm@dark' } },
                { messageId: 'preferClass', data: { actual: 'text-align:center@dark@sm', recommended: 'text-center@sm@dark' } },
            ]
        },
        {
            code: `<div class="font:16px@dark@sm">Condition order disabled keeps theme token fix</div>`,
            output: `<div class="font:md@dark@sm">Condition order disabled keeps theme token fix</div>`,
            options: [{ preferConditionOrder: false }],
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px@dark@sm', recommended: 'font:md@dark@sm' } },
            ]
        },
        {
            code: `<div class="font:16px@dark@sm">Theme tokens disabled keeps condition order fix</div>`,
            output: `<div class="font:16px@sm@dark">Theme tokens disabled keeps condition order fix</div>`,
            options: [{ preferThemeTokens: false }],
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px@dark@sm', recommended: 'font:16px@sm@dark' } },
            ]
        },
        {
            code: `<div class="margin:md@dark@sm">Property aliases disabled keeps condition order fix</div>`,
            output: `<div class="margin:md@sm@dark">Property aliases disabled keeps condition order fix</div>`,
            options: [{ preferPropertyAliases: false }],
            errors: [
                { messageId: 'preferClass', data: { actual: 'margin:md@dark@sm', recommended: 'margin:md@sm@dark' } },
            ]
        },
        {
            code: `<div class="m:var(--spacing-md)@dark@sm">Variable references disabled keeps condition order fix</div>`,
            output: `<div class="m:var(--spacing-md)@sm@dark">Variable references disabled keeps condition order fix</div>`,
            options: [{ preferVariableReferences: false }],
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:var(--spacing-md)@dark@sm', recommended: 'm:var(--spacing-md)@sm@dark' } },
            ]
        },
        {
            code: `<div class="m:1rem|1.5rem@dark@sm">Multi-value tokens disabled keeps condition order fix</div>`,
            output: `<div class="m:1rem|1.5rem@sm@dark">Multi-value tokens disabled keeps condition order fix</div>`,
            options: [{ preferMultiValueTokens: false }],
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:1rem|1.5rem@dark@sm', recommended: 'm:1rem|1.5rem@sm@dark' } },
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
            code: `<div class="mt:md@dark@sm mb:md@dark@sm">Axis composition with condition order</div>`,
            output: `<div class="my:md@sm@dark">Axis composition with condition order</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'mt:md@dark@sm mb:md@dark@sm', recommended: 'my:md@sm@dark' } },
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
            code: `clsx('block@dark@sm font:16px@dark@sm')`,
            output: `clsx('block@sm@dark font:md@sm@dark')`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } },
                { messageId: 'preferClass', data: { actual: 'font:16px@dark@sm', recommended: 'font:md@sm@dark' } },
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
            code: 'ctl(`block:hover@dark@sm`)',
            output: 'ctl(`block:hover@sm@dark`)',
            errors: [
                { messageId: 'preferClass', data: { actual: 'block:hover@dark@sm', recommended: 'block:hover@sm@dark' } },
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

createTester({
    settings: {
        '@master/css': {
            manifest: customManifest
        }
    }
}).run('prefer canonical classes custom manifest', rule, {
    valid: [
        { code: `<div class="block@midnight@wide btn@midnight@tablet">Custom variants and components</div>` }
    ],
    invalid: [
        {
            code: `<div class="m:1.25rem@midnight@tablet content-visibility:auto">Custom manifest</div>`,
            output: `<div class="m:card@tablet@midnight content-auto">Custom manifest</div>`,
            errors: [
                { messageId: 'preferClass', data: { actual: 'm:1.25rem@midnight@tablet', recommended: 'm:card@tablet@midnight' } },
                { messageId: 'preferClass', data: { actual: 'content-visibility:auto', recommended: 'content-auto' } },
            ]
        }
    ]
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
            code: `<template><div class="block@dark@sm">Vue condition</div></template>`,
            output: `<template><div class="block@sm@dark">Vue condition</div></template>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } }],
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
            code: `<div class="block@dark@sm">Svelte condition</div>`,
            output: `<div class="block@sm@dark">Svelte condition</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } }],
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
            code: `<div class="block@dark@sm">Angular condition</div>`,
            output: `<div class="block@sm@dark">Angular condition</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } }],
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
        {
            code: `
            # Test
            <div class="block@dark@sm">MDX condition</div>`,
            output: `
            # Test
            <div class="block@sm@dark">MDX condition</div>`,
            errors: [{ messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } }],
            filename: 'test.mdx',
            languageOptions: {
                parser: await import('eslint-mdx')
            }
        },
    ]
})

createTester({
    languageOptions: {
        parser: stylesheetParser as any
    }
}).run('prefer canonical classes in compose directives', rule, {
    valid: [
        {
            code: `.btn {\n    @compose text-center;\n    contain: content;\n}`,
            filename: 'test.css'
        }
    ],
    invalid: [
        {
            code: `.btn {\n    @compose text-align:center contain:content;\n}`,
            output: `.btn {\n    @compose text-center;\n    contain: content;\n}`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass', data: { actual: 'text-align:center', recommended: 'text-center' } },
                { messageId: 'preferClass', data: { actual: 'contain:content', recommended: 'contain: content' } }
            ]
        },
        {
            code: `.btn { @compose contain:content; }`,
            output: `.btn { contain: content; }`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass', data: { actual: 'contain:content', recommended: 'contain: content' } }
            ]
        },
        {
            code: `@components {\n    btn {\n        @compose bg:blue-60:hover@sm block@dark;\n    }\n}`,
            output: `@components {\n    btn {\n        :hover { @variant sm { @compose bg:blue-60; } }\n        @dark { @compose block; }\n    }\n}`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass', data: { actual: 'bg:blue-60:hover@sm', recommended: ':hover { @variant sm { @compose bg:blue-60; } }' } },
                { messageId: 'preferClass', data: { actual: 'block@dark', recommended: '@dark { @compose block; }' } }
            ]
        },
        {
            code: `.btn {\n    @compose contain:content contain:none;\n}`,
            output: null,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass', data: { actual: 'contain:content', recommended: 'contain: content' } },
                { messageId: 'preferClass', data: { actual: 'contain:none', recommended: 'contain: none' } }
            ]
        }
    ]
})

jsxTester.run('prefer canonical classes compose directives', rule, {
    valid: [
        {
            code: `.btn { @compose "font:16px margin:md"; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            }
        },
        {
            code: `.btn { @compose { font:16px margin:md }; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            }
        },
        {
            code: `const css = '.btn { @compose font:16px margin:md; }'`,
            filename: 'test.tsx'
        },
        {
            code: `<template><p>@compose font:16px margin:md</p></template><style>.btn { @compose font:md m:md; }</style>`,
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<script>const css = '.btn { @compose font:16px margin:md; }'</script><style>.btn { @compose font:md m:md; }</style>`,
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
    ],
    invalid: [
        {
            code: `.btn { @compose font:16px margin:md; }`,
            output: `.btn { @compose font:md m:md; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'margin:md', recommended: 'm:md' } },
            ]
        },
        {
            code: `.btn { @compose w:md h:md mt:md mb:md; }`,
            output: `.btn { @compose size:md my:md; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'w:md h:md', recommended: 'size:md' } },
                { messageId: 'preferClass', data: { actual: 'mt:md mb:md', recommended: 'my:md' } },
            ]
        },
        {
            code: `.btn { @compose block@dark@sm font:16px@dark@sm; }`,
            output: `.btn { @variant sm@dark { @compose block font:md; } }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'block@dark@sm', recommended: 'block@sm@dark' } },
                { messageId: 'preferClass', data: { actual: 'font:16px@dark@sm', recommended: 'font:md@sm@dark' } },
            ]
        },
        {
            code: `.btn {
  @compose
    font:16px
    margin:md
  ;
}`,
            output: `.btn {
  @compose
    font:md
    m:md
  ;
}`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'margin:md', recommended: 'm:md' } },
            ]
        },
        {
            code: `<template><button /></template><style>.btn { @compose font:16px margin:md; }</style>`,
            output: `<template><button /></template><style>.btn { @compose font:md m:md; }</style>`,
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'font:16px', recommended: 'font:md' } },
                { messageId: 'preferClass', data: { actual: 'margin:md', recommended: 'm:md' } },
            ]
        },
        {
            code: `<script>const value = true</script><style>.btn { @compose w:md h:md; }</style>`,
            output: `<script>const value = true</script><style>.btn { @compose size:md; }</style>`,
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            },
            errors: [
                { messageId: 'preferClass', data: { actual: 'w:md h:md', recommended: 'size:md' } },
            ]
        },
    ]
})
