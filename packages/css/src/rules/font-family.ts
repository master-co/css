import { Rule } from '../rule'

export class FontFamily extends Rule {
    static id = 'FontFamily' as const
    static matches = '^f(?:ont)?:(?:$values)(?!\\|)'
}