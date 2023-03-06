import { Rule } from '../rule'

export class ShapeMargin extends Rule {
    static id = 'ShapeMargin' as const
    static matches = '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}