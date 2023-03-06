import { Rule } from '../rule'

export class GridArea extends Rule {
    static override id = 'GridArea' as const
    static override unit = ''
    override order = -1
}