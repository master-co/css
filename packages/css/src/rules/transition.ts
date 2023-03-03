import { Rule } from '../'

export class Transition extends Rule {
    static override id = 'Transition' as const
    static override symbol = '~'
    override order = -1
}