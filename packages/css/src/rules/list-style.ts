import { Rule } from '../rule'

export class ListStyle extends Rule {
    static override id = 'ListStyle' as const
    override order = -1
}