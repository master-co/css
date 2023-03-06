import { Rule } from '../rule'

export class MaxWidth extends Rule {
    static id = 'MaxWidth' as const
    static matches = '^max-w:.'
}