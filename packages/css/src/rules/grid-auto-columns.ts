import { Rule } from '../rule'

export class GridAutoColumns extends Rule {
    static id = 'GridAutoColumns' as const
    static matches = '^grid-auto-cols:.'
}