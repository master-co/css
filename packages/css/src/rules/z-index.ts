import { Rule } from '../'

export class ZIndex extends Rule {
    static override id = 'ZIndex' as const
    static override matches = '^z:.'
    static override unit = ''
}