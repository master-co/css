import { Rule } from '../'

export class FontWeight extends Rule {
    static override id = 'FontWeight' as const
    static override matches = '^f(?:ont)?:(?:bolder|$values)(?!\\|)'
    static override unit = ''
}