import { Config, MasterCSS } from '@master/css'
import validateCSS from './validate-css'

/**
 * Validates that the string is valid Master CSS class syntax.
 * @argument syntax A potential Master CSS syntactic class
 * @argument options Options for creating a new Master CSS instance
 * @returns boolean
 */
export default function isClassValid(
    syntax: string,
    options?: { css?: MasterCSS, config?: Config }
): boolean {
    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS(options?.config)
    }
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