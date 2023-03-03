import { Rule } from '../'

export default class extends Rule {
    static override id = 'Animation' as const
    static override symbol = '@'
    static override unit = ''
    override order = -1
}