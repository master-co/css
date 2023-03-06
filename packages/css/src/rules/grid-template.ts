import { Rule } from '../rule'

export class GridTemplate extends Rule {
    static id = 'GridTemplate' as const
    override order = -1
}