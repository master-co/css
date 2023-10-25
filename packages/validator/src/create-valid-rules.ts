import { Config, MasterCSS, Rule } from '@master/css'
import validateCSS from './validate-css'

/**
 * @argument syntax A potential Master CSS syntactic class
 * @argument options Options for creating a new Master CSS instance
 * @returns Valid rules
 */
export default function createValidRules(
    syntax: string,
    options?: { css?: MasterCSS, config?: Config }
): Rule[] {
    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS(options?.config)
    }
    const rules = css.create(syntax)
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