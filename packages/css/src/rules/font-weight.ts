import { Rule } from '../'

export default class extends Rule {
    static override id = 'FontWeight' as const
    static override matches = '^f(?:ont)?:(?:bolder|$values)(?!\\|)'
    static override unit = ''
}