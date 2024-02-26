import { type SyntaxError } from './types/syntax-error'
import { Config, MasterCSS } from '@master/css'
import validateCSS from './validate-css'

/**
 * @description Report errors for a given class. For pure validity, use the more performant `isClassValid()`.
 * @argument syntax A potential Master CSS syntactic class
 * @argument options Options for creating a new Master CSS instance
 * @returns SyntaxError[]
 */
export default function validate(
    syntax: string,
    options?: { css?: MasterCSS, config?: Config }
): {
    isMasterCSS: boolean,
    errors: SyntaxError[]
} {

    let css: MasterCSS
    if (options?.css) {
        css = options?.css
    } else {
        css = new MasterCSS(options?.config)
    }
    const rules = css.generate(syntax)
    if (rules.length) {
        const errors = []
        for (const eachRule of rules) {
            const syntaxErrors = validateCSS(eachRule.text)
            for (const eachSyntaxError of syntaxErrors) {
                eachSyntaxError.class = syntax
                errors.push(eachSyntaxError)
            }
        }
        return {
            isMasterCSS: true,
            errors
        }
    } else {
        return {
            isMasterCSS: false,
            errors: [{
                class: syntax,
                message: `'${syntax}' is not a valid Master CSS class`,
                rawMessage: 'Mismatch'
            }]
        }
    }
}
