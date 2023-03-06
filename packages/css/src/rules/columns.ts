import { Rule } from '../rule'

export class Columns extends Rule {
    static id = 'Columns' as const
    static matches = '^(?:columns|cols):.'
    static unit = ''
    override order = -1
}