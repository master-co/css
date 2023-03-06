import { Rule } from '../rule'

export class GridAutoColumns extends Rule {
    static override id = 'GridAutoColumns' as const
    static override matches = '^grid-auto-cols:.'
}