import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('sort classes', rule, {
  valid: [],
  invalid: [
    {
      code: `
          <div class="
            m:2x
            bg:black
            p:2x
            font:1.5rem
            fg:white
          ">
            :)
          </div>`,
      output: `
          <div class="
            m:2x
            p:2x
            font:1.5rem
            bg:black
            fg:white
          ">
            :)
          </div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      languageOptions: {
        parser: await import('@angular-eslint/template-parser')
      }
    }
  ],
})
