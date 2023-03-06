import { Rule } from '../rule'

export class Grid extends Rule {
    static id = 'Grid' as const
    override order = -1
}