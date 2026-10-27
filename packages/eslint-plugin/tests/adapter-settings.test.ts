import rule from '../src/rules/sort-classes'
import { createTester, jsxTester } from './testers'

jsxTester.run('adapter source matching defaults', rule, {
  valid: [
    { code: `twMerge('fg-white display:block')` },
    { code: `classList.contains('fg-white display:block')` },
  ],
  invalid: [
    {
      code: `classList.add('fg-white display:block')`,
      output: `classList.add('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `classList.remove('fg-white display:block')`,
      output: `classList.remove('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `classList.toggle('fg-white display:block')`,
      output: `classList.toggle('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: "classList.replace('fg-white display:block', 'padding:0.5rem margin:0.5rem')",
      output: "classList.replace('display:block fg-white', 'margin:0.5rem padding:0.5rem')",
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ]
    },
    {
      code: `classList['add']('fg-white display:block')`,
      output: `classList['add']('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
  ]
})

createTester({
  settings: {
    '@master/css': {
      classAttributes: ['data-(?:class|tw)', 'className'],
      classFunctions: ['tw', 'tokens\\.cx'],
      classDeclarations: ['styles', 'classes(?:List)?']
    }
  }
}).run('adapter source matching custom settings', rule, {
  valid: [
    { code: `<div data-class-extra="fg-white display:block" />` },
    { code: `twMerge('fg-white display:block')` },
    { code: `const stylesExtra = 'fg-white display:block'` },
    { code: `const theme = { stylesExtra: 'fg-white display:block' }` },
  ],
  invalid: [
    {
      code: "<div data-class=\"fg-white display:block\" data-tw=\"padding:0.5rem margin:0.5rem\" />",
      output: "<div data-class=\"display:block fg-white\" data-tw=\"margin:0.5rem padding:0.5rem\" />",
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ]
    },
    {
      code: `tw('fg-white display:block')`,
      output: `tw('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `tokens.cx('fg-white display:block')`,
      output: `tokens.cx('display:block fg-white')`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: 'tokens.cx`fg-white display:block`',
      output: 'tokens.cx`display:block fg-white`',
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `const styles = 'fg-white display:block'`,
      output: `const styles = 'display:block fg-white'`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `const classesList = { primary: 'fg-white display:block' }`,
      output: `const classesList = { primary: 'display:block fg-white' }`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: `const theme = { styles: 'fg-white display:block' }`,
      output: `const theme = { styles: 'display:block fg-white' }`,
      errors: [{ messageId: 'invalidClassOrder' }]
    },
  ]
})
