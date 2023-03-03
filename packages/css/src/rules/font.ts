import { Rule } from '../'

export class Font extends Rule {
    static override id = 'Font' as const
    static override matches = '^f:.'
    static override unit = ''
    override order = -1
}