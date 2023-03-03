import { Rule } from '../'

export class FontFamily extends Rule {
    static override id = 'FontFamily' as const
    static override matches = '^f(?:ont)?:(?:$values)(?!\\|)'
}