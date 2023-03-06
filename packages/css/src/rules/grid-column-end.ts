import { Rule } from '../rule'

export class GridColumnEnd extends Rule {
    static id = 'GridColumnEnd' as const
    static matches = '^grid-col-end:.'
    static unit = ''
}