import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import type { MasterCSS } from '@master/css'
import type { MasterCSSGeneratedRuleIR } from '@master/css-schema/hydration-manifest'
import { createRustValidatorSession, generateRustRules } from './rust-session'

const defaultValidator = createRustValidatorSession(defaultManifest)

/**
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function generateValidRules(syntax: string): MasterCSSGeneratedRuleIR[]
export default function generateValidRules(syntax: string, css: MasterCSS): ReturnType<MasterCSS['generate']>
export default function generateValidRules(syntax: string, css?: MasterCSS) {
  const rules = css
    ? css.generate(syntax)
    : generateRustRules(syntax, defaultValidator)
  if (rules.length) {
    for (const eachRule of rules) {
      if (validateCSS(eachRule.text).length) {
        return []
      } else {
        continue
      }
    }
    return rules
  } else {
    return []
  }
}
