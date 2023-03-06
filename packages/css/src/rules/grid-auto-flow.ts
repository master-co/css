import { Rule } from '../rule'

export class GridAutoFlow extends Rule {
    static id = 'GridAutoFlow' as const
    static matches = '^grid-flow:.'
}