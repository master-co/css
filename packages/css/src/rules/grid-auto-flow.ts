import { Rule } from '../'

export class GridAutoFlow extends Rule {
    static override id = 'GridAutoFlow' as const
    static override matches = '^grid-flow:.'
}