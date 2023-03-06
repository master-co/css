import { Rule } from '../rule'

export class GridTemplate extends Rule {
    static override id = 'GridTemplate' as const
    override order = -1
}