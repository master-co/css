import { Rule } from '../rule'

export class AlignSelf extends Rule {
    static id = 'AlignSelf' as const
    static matches = '^as:'
}