import { Rule } from '../'

export class PlaceContent extends Rule {
    static override id = 'PlaceContent' as const
    override order = -1
}