import { Rule } from '../'

export default class extends Rule {
    static override id = 'FontFamily' as const
    static override matches = '^f(?:ont)?:(?:$values)(?!\\|)'
}