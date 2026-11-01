import { expect, test } from 'vitest'
import plugin from '../src/plugin'
import recommended from '../src/configs/recommended'
import rule from '../src/rules/prefer-component-classes'
import { jsxTester } from './testers'

jsxTester.run('prefer component classes', rule, {
  valid: [
    { code: '<div class="flex gap-md font-bold:hover fg-red:has(>img) block@sm">Own element only</div>' },
    { code: '<div class="block_h4 hidden_h4 grid_svg">At the default limit</div>' },
    { code: '<div class="block_h4 hidden_h4 grid_svg flex>li">Raised limit</div>', options: [{ max: 4 }] }
  ],
  invalid: [
    {
      code: '<div class="flex block_h4 hidden_h4 grid_svg flex>li">Past the default limit</div>',
      errors: [{
        messageId: 'remoteStylingLimit',
        data: { message: '4 classes style other elements through combinators ("_h4", "_svg", ">li"); the limit is 3. Move them into a component class in @layer components.' }
      }]
    },
    {
      code: '<ul class="m(0)>li">One remote class over a zero limit</ul>',
      options: [{ max: 0 }],
      errors: [{ messageId: 'remoteStylingLimit' }]
    }
  ]
})

test('is registered but opt-in', () => {
  expect(plugin.rules?.['prefer-component-classes']).toBe(rule)
  expect(recommended.rules).not.toHaveProperty('@master/css/prefer-component-classes')
})
