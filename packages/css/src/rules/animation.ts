import { Rule } from '../rule'

export class Animation extends Rule {
    static id = 'Animation' as const
    static symbol = '@'
    static unit = ''
    override order = -1
}