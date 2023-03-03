import { Rule } from '../'

export class AlignSelf extends Rule {
    static override id = 'AlignSelf' as const
    static override matches = '^as:'
}