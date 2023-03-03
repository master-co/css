import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'OutlineWidth' as const
    static override matches = '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}