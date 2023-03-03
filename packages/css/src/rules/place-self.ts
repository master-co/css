import { Rule } from '../'

export class PlaceSelf extends Rule {
    static override id = 'PlaceSelf' as const
    override order = -1
}