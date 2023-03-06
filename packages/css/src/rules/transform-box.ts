import { Rule } from '../rule'

export class TransformBox extends Rule {
    static override id = 'TransformBox' as const
    static override matches = '^transform:(?:$values)(?!\\|)'
}