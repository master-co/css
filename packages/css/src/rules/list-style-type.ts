import Rule from '../rule'

export default class extends Rule {
    static override id: 'ListStyleType' = 'ListStyleType' as const
    static override matches = /^list-style:(disc|decimal)(?!\|)/
}