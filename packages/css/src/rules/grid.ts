import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'Grid' as const
    override order = -1
}