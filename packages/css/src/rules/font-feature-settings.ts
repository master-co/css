import Rule from '../rule'

export default class extends Rule {
    static override id: 'FontFeatureSettings' = 'FontFeatureSettings' as const
    static override matches = /^font-feature:./
}