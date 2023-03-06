import { Rule } from '../rule'

export class StrokeWidth extends Rule {
    static override id = 'StrokeWidth' as const
    static override matches = '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}