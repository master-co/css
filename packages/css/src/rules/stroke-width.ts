import { Rule } from '../'

export default class extends Rule {
    static override id = 'StrokeWidth' as const
    static override matches = '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}