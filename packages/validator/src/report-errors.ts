import { validate as validateCSS } from 'csstree-validator'
import { SyntaxError } from './interfaces/syntax-error'
import { Config, MasterCSS } from '@master/css'

/**
 * @description Report errors for a given class. For pure validity, use the more performant `isClassValid()`.
 * @argument syntax A potential Master CSS syntactic class
 * @argument options Options for creating a new Master CSS instance
 * @returns SyntaxError[]
 */
export default function reportErrors(
    syntax: string,
    options?: { css?: MasterCSS, config?: Config }
): SyntaxError[] {
    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS({ ...options?.config, observe: false })
    }
    const rules = css.create(syntax)
    if (rules.length) {
        const errors = []
        for (const eachRule of rules) {
            const syntaxErrors = validateCSS(eachRule.text, syntax)
            for (const eachSyntaxError of syntaxErrors) {
                eachSyntaxError.class = syntax
                errors.push(eachSyntaxError)
            }
        }
        return errors
    } else {
        return [{
            class: syntax,
            message: `Invalid Master CSS class "${syntax}"`,
            rawMessage: 'Mismatch'
        }]
    }
}