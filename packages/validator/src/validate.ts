import { type SyntaxError } from './types/syntax-error'
import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import type { MasterCSS } from '@master/css'
import { createRustValidatorSession, generateRustRules } from './rust-session'

const defaultValidator = createRustValidatorSession(defaultManifest)

/**
 * @description Report errors for a given class. For pure validity, use the more performant `isClassValid()`.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function validate(
  syntax: string,
  css?: MasterCSS
): {
  matched: boolean,
  errors: SyntaxError[]
} {
  const rules = css
    ? css.generate(syntax)
    : generateRustRules(syntax, defaultValidator)
  if (rules.length) {
    const errors = []
    for (const eachRule of rules) {
      const syntaxErrors = validateCSS(eachRule.text)
      for (const eachUtilityError of syntaxErrors) {
        eachUtilityError.class = syntax
        errors.push(eachUtilityError)
      }
    }
    return {
      matched: true,
      errors
    }
  } else {
    return {
      matched: false,
      errors: [{
        class: syntax,
        message: `'${syntax}' is not a valid Master CSS class`,
        rawMessage: 'Mismatch'
      }]
    }
  }
}
