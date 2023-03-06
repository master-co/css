import { Rule } from '../rule'

export class Transition extends Rule {
    static id = 'Transition' as const
    static symbol = '~'
    override order = -1
}