import defaultManifest from './default-manifest'
import validateCSS from './validate-css'
import { createCSSWithNativeDeclarations } from './native-declaration'

/**
 * Validates that the string is valid Master CSS class syntax.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function isClassValid(
    syntax: string,
    css = createCSSWithNativeDeclarations(defaultManifest)
): boolean {
    const rules = css.generate(syntax)
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
