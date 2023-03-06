import { Rule } from '../rule'

export class PlaceItems extends Rule {
    static id = 'PlaceItems' as const
    override order = -1
}