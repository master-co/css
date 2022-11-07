import Rule from '../rule'

export default class extends Rule {
    static override id: 'Display' = 'Display' as const
    static override matches = /^d:./
}