import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'GridAutoColumns' as const
    static override matches = '^grid-auto-cols:.'
}