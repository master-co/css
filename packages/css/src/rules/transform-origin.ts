import { Rule } from '../rule'

export class TransformOrigin extends Rule {
    static id = 'TransformOrigin' as const
    static matches = '^transform:(?:top|bottom|right|left|center|[0-9]|$values)'
    static unit = 'px'
}