import { Rule } from '../rule'

export class FontStyle extends Rule {
    static id = 'FontStyle' as const
    static matches = '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)'
    static unit = 'deg'
}