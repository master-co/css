import Rule from '../rule'

export default class extends Rule {
    static override id: 'AlignItems' = 'AlignItems' as const
    static override matches = /^ai:./
}