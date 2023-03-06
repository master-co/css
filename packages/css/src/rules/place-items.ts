import { Rule } from '../rule'

export class PlaceItems extends Rule {
    static override id = 'PlaceItems' as const
    override order = -1
}