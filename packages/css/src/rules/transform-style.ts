import { Rule } from '../rule'

export class TransformStyle extends Rule {
    static id = 'TransformStyle' as const
    static matches = '^transform:(?:flat|preserve-3d|$values)(?!\\|)'
}