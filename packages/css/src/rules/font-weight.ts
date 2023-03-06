import { Rule } from '../rule'

export class FontWeight extends Rule {
    static id = 'FontWeight' as const
    static matches = '^f(?:ont)?:(?:bolder|$values)(?!\\|)'
    static unit = ''
}