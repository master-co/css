import { Rule } from '../rule'

export class GridArea extends Rule {
    static id = 'GridArea' as const
    static unit = ''
    override order = -1
}