import { Rule } from '../rule'

export class Font extends Rule {
    static id = 'Font' as const
    static matches = '^f:.'
    static unit = ''
    override order = -1
}