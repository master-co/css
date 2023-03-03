import { Rule } from '../'

export default class extends Rule {
    static override id = 'Transition' as const
    static override symbol = '~'
    override order = -1
}