import { Rule } from '../rule'

export class GridColumnStart extends Rule {
    static override id = 'GridColumnStart' as const
    static override matches = '^grid-col-start:.'
    static override unit = ''
}