import { expect, test } from 'vitest'
import plugin from '../src/plugin'
import recommended from '../src/configs/recommended'
import rule from '../src/rules/no-legacy-classes'
import { jsxTester } from './testers'

jsxTester.run('no legacy classes', rule, {
  valid: [
    { code: '<div class="flex items-center p(8) (flex:1) w-full flex:hover">2.0 classes</div>' }
  ],
  invalid: [
    {
      code: '<div class="flex align-items:center p:8px w:full">rc syntax</div>',
      output: '<div class="flex items-center p(8) w-full">rc syntax</div>',
      errors: [
        { messageId: 'legacyClass', data: { message: 'Class "align-items:center" uses pre-2.0 property:value syntax; use "items-center".' } },
        { messageId: 'legacyClass' },
        { messageId: 'legacyClass' }
      ]
    }
  ]
})

test('is registered but opt-in', () => {
  expect(plugin.rules?.['no-legacy-classes']).toBe(rule)
  expect(recommended.rules).not.toHaveProperty('@master/css/no-legacy-classes')
})
