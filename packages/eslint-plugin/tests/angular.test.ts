import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('sort classes', rule, {
  valid: [],
  invalid: [
    {
      code: "\n          <div class=\"\n            margin:0.5rem\n            bg-black\n            padding:0.5rem\n            font-size:1.5rem\n            fg-white\n          \">\n            :)\n          </div>",
      output: "\n          <div class=\"\n            margin:0.5rem\n            padding:0.5rem\n            font-size:1.5rem\n            bg-black\n            fg-white\n          \">\n            :)\n          </div>",
      errors: [{ messageId: 'invalidClassOrder' }],
      languageOptions: {
        parser: await import('@angular-eslint/template-parser')
      }
    }
  ],
})
