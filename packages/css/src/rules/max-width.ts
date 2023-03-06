import { Rule } from '../rule'

export class MaxWidth extends Rule {
    static override id = 'MaxWidth' as const
    static override matches = '^max-w:.'
}