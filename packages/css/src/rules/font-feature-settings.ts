import { Rule } from '../rule'

export class FontFeatureSettings extends Rule {
    static id = 'FontFeatureSettings' as const
    static matches = '^font-feature:.'
}