import { UtilityType } from '@master/css-schema/utility-type'
import { expect, test } from 'vitest'
import plugin from '../src/plugin'
import recommended from '../src/configs/recommended'
import rule from '../src/rules/no-unapproved-raw-values'
import { createTester, jsxTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'

const customManifest = createPresetManifest({
  variables: [
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
  ]
})

type PresetManifestInput = Parameters<typeof createPresetManifest>[0]
const registryFieldManifest = createPresetManifest({
  variables: [
    { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
  ],
  nativeValueNamespaces: [{
    properties: ['--space'],
    variableAliasRefs: ['~spacing']
  }]
} as PresetManifestInput & {
  nativeValueNamespaces: { properties: string[], variableAliasRefs: string[] }[]
})

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
        {
          messageId: 'unapprovedRawValue',
          data: {
            message: 'Raw value "15px" is not approved for class "font:15px". Use a token or allow the value explicitly.'
          }
        },
        { messageId: 'unapprovedRawValue' },
        { messageId: 'unapprovedRawValue' },
      ]
    },
    {
      code: `<div class="m:md|17px m:calc(1rem+1px)|18px m:19px|20px">Multi-value raw value segments</div>`,
      options: [{ allowedPatterns: ['^calc\\('] }],
      errors: [
        { messageId: 'unapprovedRawValue' },
        { messageId: 'unapprovedRawValue' },
        { messageId: 'unapprovedRawValue' },
      ]
    },
    {
      code: `clsx('font:15px m:17px')`,
      errors: [
        { messageId: 'unapprovedRawValue' },
        { messageId: 'unapprovedRawValue' },
      ]
    },
    {
      code: 'ctl(`fg:#123456`)',
      errors: [
        { messageId: 'unapprovedRawValue' },
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

createTester({
  settings: {
    '@master/css': {
      manifest: customManifest
    }
  }
}).run('no unapproved raw values custom manifest', rule, {
  valid: [
    { code: `<div class="m:card">Custom token</div>` }
  ],
  invalid: [
    {
      code: `<div class="m:17px">Custom token namespace raw value</div>`,
      errors: [
        { messageId: 'unapprovedRawValue' },
      ]
    }
  ]
})

createTester({
  settings: {
    '@master/css': {
      manifest: registryFieldManifest
    }
  }
}).run('no unapproved raw values ignored manifest registry fields', rule, {
  valid: [
    { code: `<div class="--space:17px">Manifest-carried native namespace is ignored</div>` }
  ],
  invalid: []
})

jsxTester.run('no unapproved raw values parser smoke tests', rule, {
  valid: [],
  invalid: [
    {
      code: `<template><div class="font:15px">Vue</div></template>`,
      errors: [{ messageId: 'unapprovedRawValue' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<div class="font:15px">Svelte</div>`,
      errors: [{ messageId: 'unapprovedRawValue' }],
      filename: 'test.svelte',
      languageOptions: {
        parser: await import('svelte-eslint-parser')
      }
    },
    {
      code: `<div class="font:15px">Angular</div>`,
      errors: [{ messageId: 'unapprovedRawValue' }],
      languageOptions: {
        parser: await import('@angular-eslint/template-parser')
      }
    },
    {
      code: `
      # Test
      <div class="font:15px">MDX</div>`,
      errors: [{ messageId: 'unapprovedRawValue' }],
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
