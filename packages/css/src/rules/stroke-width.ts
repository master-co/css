import { Rule } from '../rule'

export class StrokeWidth extends Rule {
    static id = 'StrokeWidth' as const
    static matches = '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}