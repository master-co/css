import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import type { MasterCSS } from '@master/css'
import { createRustValidatorSession, generateRustRules } from './rust-session'

const defaultValidator = createRustValidatorSession(defaultManifest)

/**
 * Validates that the string is valid Master CSS class syntax.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function isClassValid(
  syntax: string,
  css?: MasterCSS
): boolean {
  const rules = css
    ? css.generate(syntax)
    : generateRustRules(syntax, defaultValidator)
  if (rules.length) {
    for (const eachRule of rules) {
      if (validateCSS(eachRule.text).length) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}
