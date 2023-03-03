import { Rule } from '../'

export default class extends Rule {
    static override id = 'TransformBox' as const
    static override matches = '^transform:(?:$values)(?!\\|)'
}