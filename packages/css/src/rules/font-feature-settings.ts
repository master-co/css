import { Rule } from '../'

export default class extends Rule {
    static override id = 'FontFeatureSettings' as const
    static override matches = '^font-feature:.'
}