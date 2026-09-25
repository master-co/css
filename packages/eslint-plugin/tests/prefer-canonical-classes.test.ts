import rule from '../src/rules/prefer-canonical-classes'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import { UtilityType } from '@master/css-schema/utility-type'
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
    modes: [...(createPresetManifest().modes ?? []), { name: 'midnight', branches: [{ selector: '.midnight', conditions: [] }] }],
    conditions: {
        tablet: {
            id: 'media',
            nodes: [{ type: 'number', value: 48, unit: 'rem' }]
        }
    },
    breakpointConditions: {
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
        { token: '@wide', branches: [{ conditions: ['@media (min-width: 80rem)'] }] }
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
            layer: 'utilities',
            declarations: { display: 'block' }
        }
    ]
})

jsxTester.run('prefer canonical classes', rule, {
    valid: [
{ code: `<div class="text-center font-md m-md r-md fg-red-60">Recommended classes</div>` },
{ code: `<div class="btn w:futurekeyword unknown-class">Unknown classes are ignored</div>` },
{ code: `<div class="text-muted grid-col-span:4">Manifest aliases are preserved</div>` },
{
            code: `<div class="font-size:16px">Literal values are preserved</div>`,
        },
{
            code: `<div class="margin-md">Property aliases disabled</div>`,
            options: [{ preferPropertyAliases: false }]
        },
{
            code: `<div class="display:block">Static utilities disabled</div>`,
            options: [{ preferStaticUtilities: false }]
        },
{
            code: `<div class="m:var(--spacing-md)">Explicit variable references are preserved</div>`,
        },
{
            code: `<div class="m:1rem|1.5rem">Literal multi-values are preserved</div>`,
        },
{
            code: `<div class="w-md h-md">Composition utilities disabled</div>`,
            options: [{ preferCompositionUtilities: false }]
        },
{
            code: `<div class="mt-md mb-md">Axis composition utilities disabled</div>`,
            options: [{ preferCompositionUtilities: false }]
        },
{
            code: `<div class="block@dark@sm">Condition order disabled</div>`,
            options: [{ preferConditionOrder: false }]
        },
{
            code: `<div class="font-size:16px@dark@sm">Condition order disabled preserves literals</div>`,
            options: [{ preferConditionOrder: false }],
        },
{
            code: `<div class="block@sm:hover block:focus:hover block@starting-style@sm block@print@sm block@supports((display:grid))@sm">Unsafe suffix order</div>`
        },
{
code: `<div class="text-align:center:hover@sm">Static pattern utility with variants</div>`
},
{
code: `<div class="display:block align-items:center">Static utilities</div>`
},
{
code: `<div class="font-size:16px font-size:1rem r:.375rem">Variables</div>`
},
{
code: `<div class="m:1rem|1.5rem p:.5rem|1rem r:.25rem|.375rem">Multi-value tokens</div>`
},
{
code: `<div class="m:var(--spacing-md) r:var(--radius-md) fg:var(--color-red-60)">Variable references</div>`
},
{
code: `<div class="font-size:16px@dark@sm">Condition order disabled keeps theme token fix</div>`,
options: [{ preferConditionOrder: false }]
},
{
code: `<div class="w-md h-md min-w-md min-h-md max-w-md max-h-md">Composition utilities</div>`
},
{
code: `<div class="mt-md mb-md ml-md mr-md pt-md pb-md pl-md pr-md">Axis composition utilities</div>`
},
{
code: `clsx('display:block font-size:16px')`
},
{
code: 'ctl(`font-size:1rem r:.375rem`)'
},
{
code: 'ctl(`w:1rem h:1rem`)'
},
{
code: `<div class="font-size-md background-color-red-60">Named token keys</div>`
},
{
code: `<div class="block@dark@sm block:hover@dark@sm block!@dark@sm">Condition order</div>`
},
{
code: `<div class="font-size:16px@dark@sm text-align:center@dark@sm">Condition order with canonical classes</div>`
},
{
code: `<div class="font-size:16px@dark@sm">Literal values are preserved preserves condition nesting</div>`
},
{
code: `<div class="margin-md@dark@sm">Property aliases disabled preserves condition nesting</div>`,
options: [{ preferPropertyAliases: false }]
},
{
code: `<div class="m:var(--spacing-md)@dark@sm">Explicit variable references are preserved preserves condition nesting</div>`
},
{
code: `<div class="m:1rem|1.5rem@dark@sm">Literal multi-values are preserved preserves condition nesting</div>`
},
{
code: `<div class="mt-md@dark@sm mb-md@dark@sm">Axis composition with condition order</div>`
},
{
code: `clsx('block@dark@sm font-size:16px@dark@sm')`
},
{
code: 'ctl(`block:hover@dark@sm`)'
}
],
    invalid: [
{
            code: `<div class="m:1rem margin-md padding-inline-md color-red-60">Aliases</div>`,
            output: `<div class="m:1rem m-md px-md fg-red-60">Aliases</div>`,
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        },
{
            code: `<div class="width-md height-md w:1rem h:1rem w-md:hover h-md:hover margin-top-md margin-bottom-md padding-left:1rem padding-right:1rem">Composition after canonicalization</div>`,
            output: "<div class=\"w-md h-md w:1rem h:1rem w-md:hover h-md:hover mt-md mb-md pl:1rem pr:1rem\">Composition after canonicalization</div>",
            errors: [{ messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }]
        },
{
            code: `clsx('width-md height-md')`,
            output: "clsx('w-md h-md')",
            errors: [{ messageId: 'preferClass' }, { messageId: 'preferClass' }]
        },
{
            code: `clsx('margin-top-md margin-bottom-md')`,
            output: "clsx('mt-md mb-md')",
            errors: [{ messageId: 'preferClass' }, { messageId: 'preferClass' }]
        },
{
            code: 'ctl(`padding-left:1rem padding-right:1rem`)',
            output: "ctl(`pl:1rem pr:1rem`)",
            errors: [{ messageId: 'preferClass' }, { messageId: 'preferClass' }]
        }
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
                        layer: 'utilities',
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
{ code: `<div class="block@midnight@wide btn@midnight@tablet">Custom variants and components</div>` },
{
code: `<div class="m:1.25rem@midnight@tablet content-visibility:auto">Custom manifest</div>`
}
],
    invalid: [

]
})

jsxTester.run('prefer canonical classes parser smoke tests', rule, {
    valid: [
{
code: `<template><div class="mt-md mb-md">Vue</div></template>`,
filename: 'test.vue',
languageOptions: {
                parser: await import('vue-eslint-parser')
            }
},
{
code: `<div class="ml-md mr-md">Svelte</div>`,
filename: 'test.svelte',
languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
},
{
code: `<div class="pt-md pb-md">Angular</div>`,
languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
},
{
code: `
            # Test
            <div class="pl-md pr-md">MDX</div>`,
filename: 'test.mdx',
languageOptions: {
                parser: await import('eslint-mdx')
            }
},
{
code: `<template><div class="block@dark@sm">Vue condition</div></template>`,
filename: 'test.vue',
languageOptions: {
                parser: await import('vue-eslint-parser')
            }
},
{
code: `<div class="block@dark@sm">Svelte condition</div>`,
filename: 'test.svelte',
languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
},
{
code: `<div class="block@dark@sm">Angular condition</div>`,
languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
},
{
code: `
            # Test
            <div class="block@dark@sm">MDX condition</div>`,
filename: 'test.mdx',
languageOptions: {
                parser: await import('eslint-mdx')
            }
}
],
    invalid: [

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
            output: `.btn {\n    text-align: center;\n    contain: content;\n}`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' }
            ]
        },
        {
            code: `.btn { @compose contain:content; }`,
            output: `.btn { contain: content; }`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass' }
            ]
        },
        {
            code: `@utilities {\n    btn {\n        @compose bg-blue-60:hover@sm block@dark;\n    }\n}`,
            output: `@utilities {\n    btn {\n        &:hover { @variant sm { @compose bg-blue-60; } }\n        @dark { @compose block; }\n    }\n}`,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' }
            ]
        },
        {
            code: `.btn {\n    @compose contain:content contain:none;\n}`,
            output: null,
            filename: 'test.css',
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' }
            ]
        }
    ]
})

jsxTester.run('prefer canonical classes compose directives', rule, {
    valid: [
{
            code: `.btn { @compose "font-size:16px margin-md"; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            }
        },
{
            code: `.btn { @compose { font-size:16px margin-md }; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            }
        },
{
            code: `const css = '.btn { @compose font-size:16px margin-md; }'`,
            filename: 'test.tsx'
        },
{
            code: `<template><p>@compose font-size:16px margin-md</p></template><style>.btn { @compose m-md; font-size: 16px; }</style>`,
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
{
            code: `<script>const css = '.btn { @compose font-size:16px margin-md; }'</script><style>.btn { @compose m-md; font-size: 16px; }</style>`,
            filename: 'test.svelte',
            languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
        },
{
code: `.btn { @compose w-md h-md mt-md mb-md; }`,
filename: 'test.css',
languageOptions: {
                parser: cssParser
            }
},
{
code: `<script>const value = true</script><style>.btn { @compose w-md h-md; }</style>`,
filename: 'test.svelte',
languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
}
],
    invalid: [
{
            code: `.btn { @compose font-size:16px margin-md; }`,
            output: `.btn { @compose m-md; font-size: 16px; }`,
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        },
{
            code: `.btn { @compose block@dark@sm font-size:16px@dark@sm; }`,
            output: [".btn { @variant dark@sm { @compose block font-size:16px; } }",".btn { @variant dark@sm { @compose block; font-size: 16px; } }"],
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        },
{
            code: `.btn {
  @compose
    font-size:16px
    margin-md
  ;
}`,
            output: ".btn {\n  @compose m-md;\n  font-size: 16px;\n}",
            filename: 'test.css',
            languageOptions: {
                parser: cssParser
            },
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        },
{
            code: `<template><button /></template><style>.btn { @compose font-size:16px margin-md; }</style>`,
            output: `<template><button /></template><style>.btn { @compose m-md; font-size: 16px; }</style>`,
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            },
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        }
]
})
