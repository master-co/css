import { Rule } from '../rule'

export class AlignSelf extends Rule {
    static override id = 'AlignSelf' as const
    static override matches = '^as:'
}