import rule from '../src/rules/prefer-canonical-classes'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import { UtilityType } from '@master/css-schema/utility-type'

const customManifest = createPresetManifest({
    customMedia: { '--tablet': { type: 'feature' as const, value: '(width >= 48rem)' } },
    variables: [
        { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number' as const, values: [{ path: [':root,:host'], value: '1.25rem' }], numeric: { value: 1.25, unit: 'rem' } }
    ],

    mixins: [
  {
    "name": "--midnight",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&:where(.midnight,.midnight *)",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  },
  {
    "name": "--wide",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media (min-width: 80rem)",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  },
  {
    "name": "--content-auto",
    "body": [
      {
        "type": "declaration" as const,
        "property": "content-visibility",
        "value": [
          {
            "type": "text" as const,
            "value": "auto"
          }
        ]
      }
    ]
  },
  {
    "name": "--btn",
    "body": [
      {
        "type": "declaration" as const,
        "property": "display",
        "value": [
          {
            "type": "text" as const,
            "value": "block"
          }
        ]
      }
    ]
  }
]
})

jsxTester.run('prefer canonical classes', rule, {
    valid: [
{ code: `<div class="text-align:center font-md m-md r-md fg-red-60">Recommended classes</div>` },
{ code: "<div class=\"btn width:futurekeyword unknown-class\">Unknown classes are ignored</div>" },
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
            code: "<div class=\"margin:var(--spacing-md)\">Explicit variable references are preserved</div>",
        },
{
            code: "<div class=\"margin:1rem|1.5rem\">Literal multi-values are preserved</div>",
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
            code: `<div class="display:block@dark@sm">Authored condition order</div>`,
        },
{
            code: `<div class="font-size:16px@dark@sm">Authored condition order preserves literals</div>`,
        },
{
            code: `<div class="block@sm:hover block:focus:hover block@starting-style@sm block@media(print)@sm block@supports((display:grid))@sm">Unsafe suffix order</div>`
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
code: "<div class=\"margin:1rem|1.5rem padding:.5rem|1rem r:.25rem|.375rem\">Multi-value tokens</div>"
},
{
code: "<div class=\"margin:var(--spacing-md) r:var(--radius-md) color:var(--color-red-60)\">Variable references</div>"
},
{
code: `<div class="font-size:16px@dark@sm">Authored condition order keeps theme token fix</div>`,
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
code: "ctl(`width:1rem height:1rem`)"
},
{
code: `<div class="font-size-md background-color-red-60">Named token keys</div>`
},
{
code: `<div class="display:block@dark@sm display:block:hover@dark@sm block!@dark@sm">Condition order</div>`
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
code: "<div class=\"margin:var(--spacing-md)@dark@sm\">Explicit variable references are preserved preserves condition nesting</div>"
},
{
code: "<div class=\"margin:1rem|1.5rem@dark@sm\">Literal multi-values are preserved preserves condition nesting</div>"
},
{
code: `<div class="mt-md@dark@sm mb-md@dark@sm">Axis composition with condition order</div>`
},
{
code: `clsx('display:block@dark@sm font-size:16px@dark@sm')`
},
{
code: 'ctl(`display:block:hover@dark@sm`)'
}
, { code: 'ctl(`padding-left:1rem padding-right:1rem`)' }
],
    invalid: [
{
            code: "<div class=\"margin:1rem margin-md padding-inline-md color-red-60\">Aliases</div>",
            output: "<div class=\"margin:1rem m-md px-md fg-red-60\">Aliases</div>",
            errors: [
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
                { messageId: 'preferClass' },
            ]
        },
{
            code: "<div class=\"width-md height-md width:1rem height:1rem w-md:hover h-md:hover margin-top-md margin-bottom-md padding-left:1rem padding-right:1rem\">Composition after canonicalization</div>",
            output: "<div class=\"w-md h-md width:1rem height:1rem w-md:hover h-md:hover mt-md mb-md padding-left:1rem padding-right:1rem\">Composition after canonicalization</div>",
            errors: [{ messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }, { messageId: 'preferClass' }]
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

]
})

createTester({
    settings: {
        '@master/css': {
            manifest: createPresetManifest({
                mixins: [
  {
    "name": "--btn",
    "body": [
      {
        "type": "declaration" as const,
        "property": "display",
        "value": [
          {
            "type": "text" as const,
            "value": "block"
          }
        ]
      }
    ]
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
{ code: `<div class="block@apply(--midnight)@apply(--wide) btn@apply(--midnight)@tablet">Custom variants and components</div>` },
{
code: "<div class=\"margin:1.25rem@apply(--midnight)@tablet content-visibility:auto\">Custom manifest</div>"
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
code: `<template><div class="display:block@dark@sm">Vue condition</div></template>`,
filename: 'test.vue',
languageOptions: {
                parser: await import('vue-eslint-parser')
            }
},
{
code: `<div class="display:block@dark@sm">Svelte condition</div>`,
filename: 'test.svelte',
languageOptions: {
                parser: await import('svelte-eslint-parser')
            }
},
{
code: `<div class="display:block@dark@sm">Angular condition</div>`,
languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
},
{
code: `
            # Test
            <div class="display:block@dark@sm">MDX condition</div>`,
filename: 'test.mdx',
languageOptions: {
                parser: await import('eslint-mdx')
            }
}
],
    invalid: [

]
})
