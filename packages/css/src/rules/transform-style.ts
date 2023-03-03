import { Rule } from '../'

export default class extends Rule {
    static override id = 'TransformStyle' as const
    static override matches = '^transform:(?:flat|preserve-3d|$values)(?!\\|)'
}