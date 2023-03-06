import { Rule } from '../rule'

export class OutlineWidth extends Rule {
    static id = 'OutlineWidth' as const
    static matches = '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}