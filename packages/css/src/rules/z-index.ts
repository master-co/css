import { Rule } from '../rule'

export class ZIndex extends Rule {
    static id = 'ZIndex' as const
    static matches = '^z:.'
    static unit = ''
}