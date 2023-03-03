import { Rule } from '../'

export class ShapeMargin extends Rule {
    static override id = 'ShapeMargin' as const
    static override matches = '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}