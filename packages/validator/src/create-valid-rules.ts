import { Config, MasterCSS, Rule } from '@master/css'
import { validate as validateCSS } from 'csstree-validator'

/**
 * @argument syntax A potential Master CSS syntactic class
 * @argument options Options for creating a new Master CSS instance
 * @returns Rules that are valid
 */
export default function createValidRules(
    syntax: string,
    options?: { css?: MasterCSS, config?: Config }
): Rule[] {
    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS({ ...options?.config, observe: false })
    }
    const rules = css.create(syntax)
    if (rules.length) {
        for (const eachRule of rules) {
            if (validateCSS(eachRule.text, syntax).length) {
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