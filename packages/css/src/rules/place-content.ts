import { Rule } from '../rule'

export class PlaceContent extends Rule {
    static id = 'PlaceContent' as const
    override order = -1
}