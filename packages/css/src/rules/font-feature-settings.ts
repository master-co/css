import { Rule } from '../rule'

export class FontFeatureSettings extends Rule {
    static override id = 'FontFeatureSettings' as const
    static override matches = '^font-feature:.'
}