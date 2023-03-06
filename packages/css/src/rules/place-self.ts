import { Rule } from '../rule'

export class PlaceSelf extends Rule {
    static id = 'PlaceSelf' as const
    override order = -1
}