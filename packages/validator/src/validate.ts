import { type SyntaxError } from './types/syntax-error'
import { createCSS } from '@master/css'
import validateCSS from './validate-css'

/**
 * @description Report errors for a given class. For pure validity, use the more performant `isClassValid()`.
 * @argument syntax A potential Master CSS syntactic class
 * @argument css a Master CSS instance
 */
export default function validate(
    syntax: string,
    css = createCSS()
): {
    matched: boolean,
    errors: SyntaxError[]
} {
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
