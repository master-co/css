import { Rule } from '../rule'

export class GridColumnStart extends Rule {
    static id = 'GridColumnStart' as const
    static matches = '^grid-col-start:.'
    static unit = ''
}