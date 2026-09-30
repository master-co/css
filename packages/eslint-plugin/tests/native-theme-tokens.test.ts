import { RuleTester } from '@typescript-eslint/rule-tester'
import { compileManifestSync } from '@master/css-compiler/node'
import rule from '../src/rules/no-invalid-classes'

const { manifest } = compileManifestSync(':root{--color-brand:red;--spacing-card:1rem}', {
  baseManifest: { version: 4, languageVersion: 11 }
})
const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  settings: { '@master/css': { manifest } }
})

tester.run('native theme tokens', rule, {
  valid: [{ code: '<div className="bg-brand p-card"/>', options: [{ disallowUnknownClass: true }] }],
  invalid: [{
    code: '<div className="bg-missing"/>',
    options: [{ disallowUnknownClass: true }],
    errors: [{ message: /Unknown or unsupported token for bg-: missing/ }]
  }]
})
