import { Rule } from '../rule'

export class MinWidth extends Rule {
    static id = 'MinWidth' as const
    static matches = '^min-w:.'
}