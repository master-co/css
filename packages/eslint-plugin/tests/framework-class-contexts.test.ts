import sortClasses from '../src/rules/sort-classes'
import noConflictingClasses from '../src/rules/no-conflicting-classes'
import { jsxTester } from './testers'

const svelte = { filename: 'test.svelte', languageOptions: { parser: await import('svelte-eslint-parser') } }

jsxTester.run('class contexts of framework templates', sortClasses, {
  valid: [
    // Text touching `{expression}` belongs to a runtime class and is left alone.
    { code: '<div class="bg:{color}-50 block"></div>', ...svelte },
    { code: '<div class="flex mt:{size}x font:bold block"></div>', ...svelte },
    // cva variant names are not classes.
    { code: "cva('inline-flex', { compoundVariants: [{ intent: 'primary danger', class: 'uppercase' }], defaultVariants: { intent: 'primary danger' } })" },
  ],
  invalid: [
    {
      code: '<div class="fg-white (display:block) {extra} fg-white (display:block)"></div>',
      output: '<div class="(display:block) fg-white {extra} (display:block) fg-white"></div>',
      errors: [{ messageId: 'invalidClassOrder' }, { messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      code: "<div class={cond ? 'fg-white (display:block)' : ''}></div>",
      output: "<div class={cond ? '(display:block) fg-white' : ''}></div>",
      errors: [{ messageId: 'invalidClassOrder' }],
      ...svelte
    },
    {
      // Astro's class:list is a namespaced JSX attribute.
      code: "<div class:list={['fg-white (display:block)', { 'fg-white (display:block)': on }]} />",
      output: "<div class:list={['(display:block) fg-white', { '(display:block) fg-white': on }]} />",
      errors: [{ messageId: 'invalidClassOrder' }, { messageId: 'invalidClassOrder' }]
    },
    {
      code: "element.classList.add('fg-white (display:block)')",
      output: "element.classList.add('(display:block) fg-white')",
      errors: [{ messageId: 'invalidClassOrder' }]
    },
    {
      code: "document.body.classList.toggle('fg-white (display:block)')",
      output: "document.body.classList.toggle('(display:block) fg-white')",
      errors: [{ messageId: 'invalidClassOrder' }]
    },
  ]
})

jsxTester.run('conflicts next to Svelte expressions', noConflictingClasses, {
  valid: [
    { code: '<div class="block flex{x}"></div>', ...svelte },
  ],
  invalid: []
})
