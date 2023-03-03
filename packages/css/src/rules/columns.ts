import { Rule } from '../'

export class Columns extends Rule {
    static override id = 'Columns' as const
    static override matches = '^(?:columns|cols):.'
    static override unit = ''
    override order = -1
}