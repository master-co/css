import { createCSS } from '@master/css'
import defaultPlan from './default-plan'
import validateCSS from './validate-css'

/**
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function generateValidRules(
    syntax: string,
    css = createCSS(defaultPlan)
) {
    const rules = css.generate(syntax)
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
