import { RuleTester } from '@typescript-eslint/rule-tester'
import { compileManifestSync } from '@master/css-compiler/node'
import rule from '../src/rules/no-invalid-classes'

const { manifest } = compileManifestSync('@mixin --bg(--color){background-color:var(--color)} @utility bg(--color) {background-color:var(--color)}@utility bg-(--color) {background-color:var(--color)}@mixin --p(--spacing){padding:var(--spacing)} @utility p(--spacing) {padding:var(--spacing)}@utility p-(--spacing) {padding:var(--spacing)}@theme{--color-brand:red;--spacing-card:1rem}:root{--color-native:red}', {
  baseManifest: { version: 6, languageVersion: 16 }
})
const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  settings: { '@master/css': { manifest } }
})

tester.run('only theme registers tokens', rule, {
  valid: [{ code: '<div className="bg-brand p-card"/>', options: [{ disallowUnknownClass: true }] }],
  invalid: [{
    code: '<div className="bg-native"/>',
    options: [{ disallowUnknownClass: true }],
    errors: [{ message: /Unknown or unsupported token for bg-: native/ }]
  }]
})
