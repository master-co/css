import { Rule } from '../rule'

export class TransformBox extends Rule {
    static id = 'TransformBox' as const
    static matches = '^transform:(?:$values)(?!\\|)'
}