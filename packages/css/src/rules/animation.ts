import { Rule } from '../rule'

export class Animation extends Rule {
    static override id = 'Animation' as const
    static override symbol = '@'
    static override unit = ''
    override order = -1
}