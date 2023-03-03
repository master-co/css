import { Rule } from '../'

export class MinWidth extends Rule {
    static override id = 'MinWidth' as const
    static override matches = '^min-w:.'
}