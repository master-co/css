import OrderRule from '../src/rules/sort-classes'
import CollisionRule from '../src/rules/no-conflicting-classes'
import InvalidRule from '../src/rules/no-invalid-classes'
import PreferCanonicalRule from '../src/rules/prefer-canonical-classes'
import RawValueRule from '../src/rules/no-unapproved-raw-values'
import { jsxTester } from './testers'

const mdxLanguageOptions = {
  parser: await import('eslint-mdx')
}

jsxTester.run('mdx sort classes', OrderRule, {
  valid: [{ code: `<div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Simple, basic</div>` }],
  invalid: [
    {
      code: `
      # Test
      <div class="m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem">Simple</div>`,
      output: `
      # Test
      <div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Simple</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
    {
      code: [
        '<button class="inline-flex align-items:center gap:0.5rem px-md py-xs r-md fg-white bg-blue-60">',
        '    Save',
        '</button>',
      ].join('\n'),
      output: [
        '<button class="inline-flex align-items:center gap:0.5rem py-xs px-md r-md bg-blue-60 fg-white">',
        '    Save',
        '</button>',
      ].join('\n'),
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
  ],
})

jsxTester.run('mdx no conflicting classes', CollisionRule, {
  valid: [],
  invalid: [
    {
      code: `<div class="m:10px m:20px m:30px:hover m:40px@dark">Simple</div>`,
      output: `<div class="m:20px m:30px:hover m:40px@dark">Simple</div>`,
      errors: [
        { messageId: 'collisionClass' }
      ],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
    {
      code: [
        '<div class="m:10px m:20px">Simple</div>',
      ].join('\n'),
      output: [
        '<div class="m:20px">Simple</div>',
      ].join('\n'),
      errors: [
        { messageId: 'collisionClass' }
      ],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
  ],
})

jsxTester.run('mdx no invalid classes', InvalidRule, {
  valid: [],
  invalid: [
    {
      code: [
        '<div class="btn">Simple</div>',
      ].join('\n'),
      options: [{ disallowUnknownClass: true }],
      errors: [{ messageId: 'disallowUnknownClass' }],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
  ],
})

jsxTester.run('mdx prefer canonical classes', PreferCanonicalRule, {
  valid: [
{
      code: [
        '<div class="font-size:16px">Simple</div>',
      ].join('\n'),
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
{
code: [
        '<button class="inline-flex align-items:center gap:0.5rem px-md py-xs r-md fg-white bg-blue-60">',
        '    Save',
        '</button>',
      ].join('\n'),
filename: 'test.mdx',
languageOptions: mdxLanguageOptions
}
],
  invalid: [

],
})

jsxTester.run('mdx no unapproved raw values', RawValueRule, {
  valid: [],
  invalid: [
    {
      code: [
        '<div class="font-size:15px w:17px">Simple</div>',
      ].join('\n'),
      options: [{ allowProperties: ['width'] }],
      errors: [{ messageId: 'unapprovedRawValue' }],
      filename: 'test.mdx',
      languageOptions: mdxLanguageOptions
    },
  ],
})

for (const [name, rule] of [
  ['order', OrderRule], ['conflict', CollisionRule], ['invalid', InvalidRule],
  ['canonical', PreferCanonicalRule], ['raw', RawValueRule]
] as const) jsxTester.run(`mdx preserves display content: ${name}`, rule, {
  valid: [{
    code: ['```html', '<div class="font:mono m:10px m:20px w:17px padding-md">Old RC example</div>', '```',
      '', '`<div class="padding:1px.<br"/>`', '', '<Card title="Not classes.<bad" source=".a { color:red }"/>'].join('\n'),
    filename: 'display.mdx', languageOptions: mdxLanguageOptions
  }], invalid: []
})
